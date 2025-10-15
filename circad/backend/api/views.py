from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, parser_classes, permission_classes, authentication_classes
from rest_framework.response import Response
from django.core.files.storage import default_storage
from .models import DCRMFile, AnalysisResult
from .serializers import DCRMFileSerializer, AnalysisResultSerializer
from . import ai_model
from .ai_model import analyze_dcrm
from pathlib import Path
from django.shortcuts import get_object_or_404
from django_ratelimit.decorators import ratelimit
from .tasks import analyze_file_task
from celery.result import AsyncResult
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    User.objects.create_user(username=username, password=password)
    return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mocked for now: later you can send a real email with a reset link.
    return Response({'message': 'Password reset link sent successfully'}, status=status.HTTP_200_OK)

@ratelimit(key='ip', rate='10/m', block=True)
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_dcrm(request):
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"error": "No file provided"}, status=400)
    if not file_obj.name.lower().endswith(".csv"):
        return Response({"error": "Only CSV files allowed"}, status=400)
    if file_obj.size > 5 * 1024 * 1024:
        return Response({"error": "File too large (max 5 MB)"}, status=400)
    
    dcrm = DCRMFile.objects.create(file=file_obj)
    serializer = DCRMFileSerializer(dcrm)

    # Enqueue Celery analysis task; we pass no past_means here and let task compute if needed
    task = analyze_file_task.delay(dcrm.id)

    return Response({
        "message": "File uploaded successfully",
        "file_id": serializer.data.get("id"),
        "file_path": serializer.data.get("file"),
        "task_id": task.id
    }, status=status.HTTP_202_ACCEPTED)

@ratelimit(key='ip', rate='5/m', block=True)
@api_view(["POST"])
def analyze_dcrm_file(request, file_id):
    from django.core.serializers.json import DjangoJSONEncoder
    import json

    try:
        dcrm = get_object_or_404(DCRMFile, id=file_id)
        file_path = dcrm.file.path

        # Collect past mean values (last N analyses for same breaker or globally)
        # Here we take last 10 AnalysisResult.mean values for forecasting.
        past_records = AnalysisResult.objects.filter(dcrm_file=dcrm).order_by("created_at")  # older->newer
        past_means = [r.result_json.get("mean_resistance") for r in past_records if r.result_json.get("mean_resistance") is not None]

        result = ai_model.analyze_dcrm(file_path, past_means=past_means)

        if "status" in result and result.get("status") == "Invalid data":
            return Response(result, status=400)

        # Save analysis result in DB
        record = AnalysisResult.objects.create(
            dcrm_file=dcrm,
            result_json=result
        )

        return Response(AnalysisResultSerializer(record).data, status=200)
    except DCRMFile.DoesNotExist:
        return Response({"error": "File not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

class ResultPagination(PageNumberPagination):
    page_size = 10

@api_view(["GET"])
def list_results(request):
    status_filter = request.query_params.get("status")
    queryset = AnalysisResult.objects.all().order_by("-created_at")
    if status_filter:
        queryset = queryset.filter(result_json__status=status_filter)
    paginator = ResultPagination()
    results = paginator.paginate_queryset(queryset, request)
    serializer = AnalysisResultSerializer(results, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(["GET"])
def system_health_index(request):
    """
    Return health index computed from recent analyses (default last 50).
    """
    records = AnalysisResult.objects.all().order_by("-created_at")[:50]
    if not records:
        return Response({"health_index": 0.0})
    score_map = {"Healthy": 2, "Warning": 1, "Faulty": 0, "High Contact Resistance": 0}
    total_score = 0
    for r in records:
        status = r.result_json.get("status")
        total_score += score_map.get(status, 0)
    health_index = (total_score / (2 * len(records))) * 100
    return Response({"health_index": round(health_index, 2)})

@api_view(["GET"])
def forecast_for_analysis(request, analysis_id):
    """
    Return forecast details for a given analysis id (or file id if needed).
    """
    try:
        analysis = AnalysisResult.objects.get(id=analysis_id)
        # Use stored historical means for forecast (last N for same dcrm_file)
        dcrm = analysis.dcrm_file
        past_records = AnalysisResult.objects.filter(dcrm_file=dcrm).order_by("created_at")
        past_means = [r.result_json.get("mean_resistance") for r in past_records if r.result_json.get("mean_resistance") is not None]
        # call ai_model forecast helper
        forecast_next = ai_model.forecast_mean(past_means + [])
        return Response({"forecast_next_mean": forecast_next})
    except AnalysisResult.DoesNotExist:
        return Response({"error": "Analysis not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def task_status(request, task_id):
    res = AsyncResult(task_id)
    return Response({
        "task_id": task_id,
        "state": res.state,
        "result": res.result if res.ready() else None
    })
