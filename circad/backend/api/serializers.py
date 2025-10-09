from rest_framework import serializers
from .models import DCRMFile, AnalysisResult

class DCRMFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DCRMFile
        fields = ['id', 'file', 'uploaded_at']

class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = "__all__"
