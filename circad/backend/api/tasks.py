# circad/backend/api/tasks.py
import logging
from celery import shared_task
import time
from django.utils import timezone
from .models import DCRMFile, AnalysisResult
from . import ai_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def analyze_file_task(self, dcrm_file_id, past_means=None):
    """
    Celery task to analyze a DCRM file by id.
    Returns analysis_id on success and notifies WebSocket.
    """
    try:
        dcrm = DCRMFile.objects.get(id=dcrm_file_id)
    except DCRMFile.DoesNotExist:
        logger.error("DCRMFile not found: %s", dcrm_file_id)
        return {"error": "file_not_found"}

    try:
        # Run main AI model analysis
        result = ai_model.analyze_dcrm(dcrm.file.path, past_means=past_means)

        # Store result in DB
        rec = AnalysisResult.objects.create(dcrm_file=dcrm, result_json=result)
        logger.info("Analysis saved: id=%s file_id=%s", rec.id, dcrm_file_id)

        # Notify all connected dashboards via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "analysis_updates",
            {
                "type": "analysis_update",
                "message": f"Analysis complete for File #{dcrm_file_id}",
                "data": {
                    "id": rec.id,
                    "file_id": dcrm_file_id,
                    "status": result.get("status"),
                    "mean_resistance": result.get("mean_resistance"),
                    "timestamp": str(rec.created_at),
                },
            },
        )

        return {"analysis_id": rec.id, "status": "ok"}
    except Exception as exc:
        logger.exception("Failed analyze_file_task for %s: %s", dcrm_file_id, exc)
        raise

@shared_task
def test_celery_task(name="CIRCAD"):
    print(f"Starting async task for {name}...")
    time.sleep(5)
    print(f"Task for {name} completed successfully!")
    return f"Task finished for {name}"
