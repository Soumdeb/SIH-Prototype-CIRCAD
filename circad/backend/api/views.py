from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from django.core.files.storage import default_storage
from .models import DCRMFile, AnalysisResult
from .serializers import DCRMFileSerializer, AnalysisResultSerializer
from . import ai_model
from .ai_model import analyze_dcrm
from pathlib import Path
from django.shortcuts import get_object_or_404

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_dcrm(request):
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"error": "No file provided"}, status=400)
    
    dcrm = DCRMFile.objects.create(file=file_obj)
    serializer = DCRMFileSerializer(dcrm)
    return Response({
        "message": "File uploaded successfully",
        "file_id": serializer.data.get("id"),
        "file_path": serializer.data.get("file"),
    }, status=status.HTTP_200_OK)

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

@api_view(["GET"])
def list_results(request):
    results = AnalysisResult.objects.all().order_by("-created_at")
    serializer = AnalysisResultSerializer(results, many=True)
    return Response(serializer.data)

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
