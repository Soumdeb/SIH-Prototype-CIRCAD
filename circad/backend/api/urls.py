from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload_dcrm, name="upload_dcrm"),
    path("analyze/<int:file_id>/", views.analyze_dcrm_file, name="analyze_dcrm_file"),
    path("results/", views.list_results, name="list_results"),
]
