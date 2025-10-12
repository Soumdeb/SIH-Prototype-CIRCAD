import io
import os
import csv
import qrcode
import base64
import matplotlib.pyplot as plt
from datetime import datetime
from django.http import HttpResponse, FileResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from .models import AnalysisResult, DCRMFile
from django.conf import settings
import pandas as pd
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import permission_classes
from django_ratelimit.decorators import ratelimit

# Helper: draw small matplotlib chart (returns bytes)
def create_mean_trend_chart(analysis_list):
    """
    analysis_list: list of AnalysisResult instances (ordered)
    returns: PNG bytes
    """
    means = [a.result_json.get("mean_resistance") for a in analysis_list]
    dates = [a.created_at for a in analysis_list]
    plt.switch_backend('Agg')
    fig, ax = plt.subplots(figsize=(6, 2.5))
    ax.plot(dates, means, marker='o', linewidth=2)
    ax.set_title("Mean Resistance Over Time")
    ax.set_ylabel("Mean (µΩ)")
    ax.grid(True, linestyle='--', alpha=0.5)
    fig.autofmt_xdate(rotation=25)
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf

# Helper: create QR code image bytes (contains report metadata url or JSON)
def create_qr_image(data_str):
    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

# Endpoint: Produce PDF report for selected analyses
@api_view(["POST"])
@permission_classes([IsAdminUser])
def generate_pdf_report(request):
    """
    POST payload:
    {
      "analysis_ids": [1,2,3],   # optional: if omitted => include all or last N
      "title": "CIRCAD Batch Report",
      "include_signature": true,
      "technician_name": "Raj"
    }
    """
    payload = request.data or {}
    analysis_ids = payload.get("analysis_ids")
    title = payload.get("title", "CIRCAD Analysis Report")
    include_signature = bool(payload.get("include_signature", False))
    technician = payload.get("technician_name", "")

    # fetch analyses
    if analysis_ids:
        analyses = list(AnalysisResult.objects.filter(id__in=analysis_ids).order_by("created_at"))
    else:
        analyses = list(AnalysisResult.objects.all().order_by("created_at")[-10:])  # last 10 by default

    if not analyses:
        return Response({"error": "No analyses found for report"}, status=400)

    # Create PDF in memory
    buffer = io.BytesIO()
    page_width, page_height = A4  # portrait
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setTitle(title)

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, (page_height - 20 * mm), title)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, (page_height - 26 * mm), f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

    # Insert trend chart of selected analyses (if more than 1)
    if len(analyses) >= 2:
        chart_buf = create_mean_trend_chart(analyses)
        chart_img = ImageReader(chart_buf)
        c.drawImage(chart_img, 20 * mm, (page_height - 100 * mm), width=170*mm, preserveAspectRatio=True, mask='auto')
        y_cursor = (page_height - 110 * mm)
    else:
        y_cursor = (page_height - 40 * mm)

    # Table of analyses (multiple per page)
    x_left = 20 * mm
    row_h = 9 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x_left, y_cursor, "ID")
    c.drawString(x_left + 18*mm, y_cursor, "File")
    c.drawString(x_left + 80*mm, y_cursor, "Status")
    c.drawString(x_left + 110*mm, y_cursor, "Mean (µΩ)")
    c.drawString(x_left + 140*mm, y_cursor, "Date")
    y_cursor -= 6*mm
    c.setFont("Helvetica", 9)

    for a in analyses:
        if y_cursor < 30*mm:
            c.showPage()
            y_cursor = page_height - 30*mm
        fid = a.dcrm_file.id if a.dcrm_file else "-"
        fname = os.path.basename(a.dcrm_file.file.name) if a.dcrm_file and a.dcrm_file.file else "N/A"
        status = a.result_json.get("status")
        mean = a.result_json.get("mean_resistance")
        created = a.created_at.strftime("%Y-%m-%d %H:%M")
        c.drawString(x_left, y_cursor, str(a.id))
        c.drawString(x_left + 18*mm, y_cursor, fname[:30])
        c.drawString(x_left + 80*mm, y_cursor, status)
        c.drawRightString(x_left + 132*mm, y_cursor, f"{mean}")
        c.drawString(x_left + 140*mm, y_cursor, created)
        y_cursor -= row_h

    # Add per-analysis detail pages with chart & QR + signature
    for a in analyses:
        c.showPage()
        c.setFont("Helvetica-Bold", 14)
        c.drawString(20*mm, page_height - 20*mm, f"Analysis #{a.id} - File #{a.dcrm_file.id if a.dcrm_file else '-'}")
        c.setFont("Helvetica", 10)
        c.drawString(20*mm, page_height - 28*mm, f"Status: {a.result_json.get('status')}")
        c.drawString(20*mm, page_height - 34*mm, f"Mean Resistance: {a.result_json.get('mean_resistance')} µΩ")
        c.drawString(20*mm, page_height - 40*mm, f"Std Dev: {a.result_json.get('std_dev')} µΩ")
        # small chart for this analysis (if data points available)
        data_points = a.result_json.get("data_points", [])
        if data_points:
            # make small plt chart
            times = [p.get("time") for p in data_points]
            res = [p.get("resistance") for p in data_points]
            plt.switch_backend('Agg')
            fig, ax = plt.subplots(figsize=(5,1.8))
            ax.plot(times, res, linewidth=1.5)
            ax.set_xlabel("")
            ax.set_ylabel("µΩ")
            ax.grid(True, linestyle='--', alpha=0.4)
            buf = io.BytesIO()
            fig.tight_layout()
            fig.savefig(buf, format='png', dpi=150)
            plt.close(fig)
            buf.seek(0)
            img = ImageReader(buf)
            c.drawImage(img, 20*mm, page_height - 110*mm, width=170*mm, preserveAspectRatio=True, mask='auto')

        # QR with a JSON summary (embedding id + status)
        qr_json = {"analysis_id": a.id, "status": a.result_json.get("status"), "mean": a.result_json.get("mean_resistance")}
        qr_img_buf = create_qr_image(str(qr_json))
        qr_img = ImageReader(qr_img_buf)
        c.drawImage(qr_img, page_width - 50*mm, page_height - 60*mm, width=30*mm, preserveAspectRatio=True, mask='auto')

        # optionally include signature (if exists in static path)
        if include_signature:
            sig_path = getattr(settings, "CIRCAD_TECH_SIGNATURE", None)
            if sig_path and os.path.exists(sig_path):
                sig_img = ImageReader(sig_path)
                c.drawImage(sig_img, 20*mm, 20*mm, width=60*mm, preserveAspectRatio=True, mask='auto')
                c.drawString(20*mm, 18*mm, f"Technician: {technician}")

    # finalize
    c.showPage()
    c.save()
    buffer.seek(0)

    # Return as response
    resp = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="{title.replace(" ", "_")}_{datetime.utcnow().strftime("%Y%m%d%H%M")}.pdf"'
    return resp


@api_view(["POST"])
@permission_classes([IsAdminUser])
def generate_csv_report(request):
    """
    POST payload:
    { "analysis_ids": [1,2,3] }
    returns CSV file with rows (id,file,status,mean,std,min,max,created_at)
    """
    payload = request.data or {}
    analysis_ids = payload.get("analysis_ids")
    if analysis_ids:
        analyses = AnalysisResult.objects.filter(id__in=analysis_ids).order_by("created_at")
    else:
        analyses = AnalysisResult.objects.all().order_by("created_at")

    if not analyses.exists():
        return Response({"error": "No analyses found"}, status=400)

    # Build CSV in-memory
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["analysis_id", "file_id", "file_name", "status", "mean_resistance", "std_dev", "min_resistance", "max_resistance", "created_at"])
    for a in analyses:
        file_id = a.dcrm_file.id if a.dcrm_file else ""
        fname = os.path.basename(a.dcrm_file.file.name) if a.dcrm_file and a.dcrm_file.file else ""
        r = a.result_json
        writer.writerow([a.id, file_id, fname, r.get("status"), r.get("mean_resistance"), r.get("std_dev"), r.get("min_resistance"), r.get("max_resistance"), a.created_at.isoformat()])

    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="circad_analyses_{datetime.utcnow().strftime("%Y%m%d%H%M")}.csv"'
    return response
