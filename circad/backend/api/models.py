from django.db import models

class DCRMFile(models.Model):
    file = models.FileField(upload_to="uploads/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name


class AnalysisResult(models.Model):
    dcrm_file = models.ForeignKey(DCRMFile, on_delete=models.CASCADE, related_name="results")
    result_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
