from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from api.models import DCRMFile, AnalysisResult
from django.conf import settings
import os, shutil
from .ai_model import forecast_mean
from rest_framework.permissions import IsAdminUser
from .permissions import IsTechnician
from celery.result import AsyncResult
from circad_backend.celery import app
from . import ai_model

# =======================================================================
# === SYSTEM STATUS & MAINTENANCE =======================================
# =======================================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def system_status(request):
    """Get summary of current CIRCAD data"""
    total_files = DCRMFile.objects.count()
    total_analyses = AnalysisResult.objects.count()
    health_map = {"Healthy": 0, "Warning": 0, "Faulty": 0}
    mean_values = []

    for r in AnalysisResult.objects.all():
        st = r.result_json.get("status")
        mean = r.result_json.get("mean_resistance")
        if st in health_map:
            health_map[st] += 1
        if mean:
            mean_values.append(float(mean))

    avg_mean = round(sum(mean_values) / len(mean_values), 2) if mean_values else 0
    media_path = getattr(settings, "MEDIA_ROOT", None)
    size_mb = get_folder_size(media_path) / (1024 * 1024)

    return Response({
        "total_files": total_files,
        "total_analyses": total_analyses,
        "healthy": health_map["Healthy"],
        "warning": health_map["Warning"],
        "faulty": health_map["Faulty"],
        "avg_mean": avg_mean,
        "storage_used": round(size_mb, 2)
    })


@api_view(["POST"])
@permission_classes([IsAdminUser])
def reset_all(request):
    """Full reset: DB + media"""
    AnalysisResult.objects.all().delete()
    DCRMFile.objects.all().delete()
    clear_media_folder()
    return Response({"message": "Full reset complete."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def reset_db_only(request):
    """Delete DB records, keep uploads"""
    AnalysisResult.objects.all().delete()
    DCRMFile.objects.all().delete()
    return Response({"message": "Database reset (files retained)."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def clear_uploads(request):
    """Delete uploaded media, keep DB"""
    clear_media_folder()
    return Response({"message": "Media cleared, DB retained."}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_file(request, file_id):
    """Delete one file + linked analyses"""
    try:
        file = DCRMFile.objects.get(id=file_id)
        AnalysisResult.objects.filter(dcrm_file=file).delete()
        if os.path.exists(file.file.path):
            os.remove(file.file.path)
        file.delete()
        return Response({"message": f"Deleted file {file_id} and linked analyses."})
    except DCRMFile.DoesNotExist:
        return Response({"error": "File not found"}, status=404)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_analysis(request, analysis_id):
    """Delete one analysis record"""
    try:
        AnalysisResult.objects.get(id=analysis_id).delete()
        return Response({"message": f"Deleted analysis {analysis_id}."})
    except AnalysisResult.DoesNotExist:
        return Response({"error": "Analysis not found"}, status=404)

# =======================================================================
# === ANALYSIS REPROCESSING ============================================
# =======================================================================

@api_view(["POST"])
@permission_classes([IsTechnician])
def reanalyze_file(request, file_id):
    """
    Requeue a file for analysis (Technician or Admin) -- uses Celery if available.
    """
    try:
        file = DCRMFile.objects.get(id=file_id)
    except DCRMFile.DoesNotExist:
        return Response({"error": "File not found"}, status=404)

    try:
        from .tasks import analyze_file_task
        task = analyze_file_task.delay(file.id)
        return Response({
            "message": f"Re-analysis queued for file {file_id}",
            "task_id": task.id
        }, status=200)
    except Exception as e:
        # fallback to synchronous
        try:
            result = ai_model.analyze_dcrm(file.file.path)
            rec = AnalysisResult.objects.create(dcrm_file=file, result_json=result)
            return Response({
                "message": "Re-analysis completed (sync mode)",
                "analysis_id": rec.id
            }, status=200)
        except Exception as inner_e:
            return Response({"error": str(inner_e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def bulk_reanalyze(request):
    """
    Bulk requeue multiple files for analysis (Admin only).
    Body example: { "file_ids": [1,2,3] }
    """
    ids = request.data.get("file_ids", [])
    if not isinstance(ids, list) or not ids:
        return Response({"error": "file_ids must be a non-empty list"}, status=400)

    from .tasks import analyze_file_task
    queued = []
    failed = []

    for fid in ids:
        try:
            if DCRMFile.objects.filter(id=fid).exists():
                task = analyze_file_task.delay(fid)
                queued.append({"file_id": fid, "task_id": task.id})
            else:
                failed.append(fid)
        except Exception as e:
            failed.append(fid)

    return Response({
        "queued": queued,
        "failed": failed,
        "summary": f"{len(queued)} queued, {len(failed)} failed."
    }, status=200)

# =======================================================================
# === TASK STATUS MONITOR ===============================================
# =======================================================================

@api_view(["GET"])
@permission_classes([IsTechnician])
def get_task_status(request, task_id):
    """Return Celery task state + result (for progress tracking)."""
    try:
        res = AsyncResult(task_id, app=app)
        return Response({
            "task_id": task_id,
            "status": res.status,
            "result": res.result if res.ready() else None
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# =======================================================================
# === HELPERS ===========================================================
# =======================================================================

def clear_media_folder():
    media_path = getattr(settings, "MEDIA_ROOT", None)
    if not media_path or not os.path.exists(media_path):
        return
    for item in os.listdir(media_path):
        item_path = os.path.join(media_path, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path, ignore_errors=True)
        else:
            os.remove(item_path)

def get_folder_size(folder):
    if not folder or not os.path.exists(folder):
        return 0
    total_size = 0
    for dirpath, _, filenames in os.walk(folder):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if os.path.isfile(fp):
                total_size += os.path.getsize(fp)
    return total_size
