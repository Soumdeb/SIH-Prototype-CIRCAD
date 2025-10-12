# circad_backend/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "circad_backend.settings")

app = Celery("circad_backend")
# read config from django settings, namespace='CELERY' => discover CELERY_*
app.config_from_object("django.conf:settings", namespace="CELERY")

# Autodiscover tasks from installed apps
app.autodiscover_tasks()

# Optional: nicer default JSON serializer
app.conf.update(
    accept_content=["json"],
    task_serializer="json",
    result_serializer="json",
)

if __name__ == "__main__":
    app.start()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')