from django.contrib import admin
from django.urls import path, include
from api import views as api_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("api/system_health/", api_views.system_health_index),
    path("api/forecast/analysis/<int:analysis_id>/", api_views.forecast_for_analysis),
]
