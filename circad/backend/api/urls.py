from django.urls import path
from . import views
from . import views_admin
from . import reports
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("upload/", views.upload_dcrm, name="upload_dcrm"),
    path("task/<str:task_id>/", views.task_status, name="task-status"),
    path("analyze/<int:file_id>/", views.analyze_dcrm_file, name="analyze_dcrm_file"),
    path("results/", views.list_results, name="list_results"),
    path("admin/system_status/", views_admin.system_status),
    path("admin/reset_all/", views_admin.reset_all),
    path("admin/reset_db_only/", views_admin.reset_db_only),
    path("admin/clear_uploads/", views_admin.clear_uploads),
    path("admin/delete_file/<int:file_id>/", views_admin.delete_file),
    path("admin/delete_analysis/<int:analysis_id>/", views_admin.delete_analysis),
    path("reports/pdf/", reports.generate_pdf_report),
    path("reports/csv/", reports.generate_csv_report),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("task/<str:task_id>/status/", views_admin.get_task_status),
]
