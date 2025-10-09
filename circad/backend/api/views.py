from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets, status

from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from django.core.files.storage import default_storage
from .models import DCRMFile, AnalysisResult
from .serializers import DCRMFileSerializer, AnalysisResultSerializer
from .ai_model import analyze_dcrm
from pathlib import Path

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
        dcrm = DCRMFile.objects.get(id=file_id)
        file_path = dcrm.file.path
        result = analyze_dcrm(file_path)

        # If there's an error in result, return immediately
        if "error" in result:
            return Response(result, status=400)

        # Ensure JSON-safe serialization
        safe_result = json.loads(
            json.dumps(result, cls=DjangoJSONEncoder, allow_nan=False)
        )

        # Save clean JSON
        record = AnalysisResult.objects.create(
            dcrm_file=dcrm, result_json=safe_result
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
