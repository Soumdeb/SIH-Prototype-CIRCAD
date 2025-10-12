import os
import shutil
import math
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from api.models import DCRMFile, AnalysisResult

class Command(BaseCommand):
    help = """
    CIRCAD System Maintenance & Reset Utility

    Provides options to inspect, reset, or selectively clean CIRCAD's data.

    Usage examples:
      python manage.py reset_circad --status             → Show system summary
      python manage.py reset_circad --all                → Full reset (DB + uploads)
      python manage.py reset_circad --keep-files         → Reset DB only
      python manage.py reset_circad --keep-db            → Clear uploads only
      python manage.py reset_circad --delete-file 12     → Delete file ID 12 + linked analyses
      python manage.py reset_circad --delete-analysis 34 → Delete analysis ID 34
      python manage.py reset_circad --all --force        → Run full reset without confirmation
    """

    def add_arguments(self, parser):
        parser.add_argument('--status', action='store_true', help='Show system summary')
        parser.add_argument('--all', action='store_true', help='Reset everything (database + media)')
        parser.add_argument('--keep-files', action='store_true', help='Keep uploaded files, clear DB only')
        parser.add_argument('--keep-db', action='store_true', help='Keep DB, delete media files only')
        parser.add_argument('--delete-file', type=int, help='Delete a specific DCRMFile record by ID')
        parser.add_argument('--delete-analysis', type=int, help='Delete a specific AnalysisResult record by ID')
        parser.add_argument('--force', action='store_true', help='Bypass confirmation prompts (for automation)')

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("⚙️  CIRCAD Maintenance Utility\n"))

        try:
            if options['status']:
                self.show_status()
                return

            if options['delete_file']:
                self.delete_single_file(options['delete_file'], options['force'])
                return

            if options['delete_analysis']:
                self.delete_single_analysis(options['delete_analysis'], options['force'])
                return

            if options['keep_files']:
                self.reset_db_only(options['force'])
                return

            if options['keep_db']:
                self.clear_media_only(options['force'])
                return

            if options['all']:
                self.reset_everything(options['force'])
                return

            self.stdout.write(self.style.NOTICE(
                "ℹ️  No flags provided.\n"
                "  --status            (Show current system state)\n"
                "  --all               (Full reset)\n"
                "  --keep-files        (Reset DB only)\n"
                "  --keep-db           (Clear uploads only)\n"
                "  --delete-file <id>  (Delete single file)\n"
                "  --delete-analysis <id> (Delete single analysis)\n"
                "  --force             (Skip confirmations)"
            ))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Error: {e}"))

    # === Helper: Confirmation ===
    def confirm_action(self, message, force=False):
        if force:
            return True
        response = input(f"{message} [y/N]: ").strip().lower()
        return response in ("y", "yes")

    # === NEW FEATURE: STATUS REPORT ===
    def show_status(self):
        total_files = DCRMFile.objects.count()
        total_analyses = AnalysisResult.objects.count()
        latest_analysis = AnalysisResult.objects.order_by("-created_at").first()
        health_map = {"Healthy": 0, "Warning": 0, "Faulty": 0}
        mean_values = []

        for r in AnalysisResult.objects.all():
            status = r.result_json.get("status")
            mean = r.result_json.get("mean_resistance")
            if status in health_map:
                health_map[status] += 1
            if mean:
                mean_values.append(float(mean))

        avg_mean = round(sum(mean_values) / len(mean_values), 2) if mean_values else 0
        latest_time = (
            latest_analysis.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if latest_analysis else "N/A"
        )

        media_path = getattr(settings, "MEDIA_ROOT", None)
        total_size = self.get_folder_size(media_path)
        size_mb = total_size / (1024 * 1024)

        self.stdout.write(self.style.SUCCESS("📊 CIRCAD System Summary\n"))
        self.stdout.write(f"🧾 Total Uploaded Files:   {total_files}")
        self.stdout.write(f"📈 Total Analyses:         {total_analyses}")
        self.stdout.write(f"🟢 Healthy: {health_map['Healthy']}   🟡 Warning: {health_map['Warning']}   🔴 Faulty: {health_map['Faulty']}")
        self.stdout.write(f"⚙️  Avg. Mean Resistance:   {avg_mean} µΩ")
        self.stdout.write(f"🕓 Last Analysis Time:     {latest_time}")
        self.stdout.write(f"💾 Media Storage Used:     {size_mb:.2f} MB\n")

        if total_files == 0 and total_analyses == 0:
            self.stdout.write(self.style.WARNING("✅ System appears clean (no files or analyses found)."))
        else:
            self.stdout.write(self.style.NOTICE("Use --all, --keep-files, or --keep-db to reset data.\n"))

    def get_folder_size(self, folder):
        """Returns total size (in bytes) of folder recursively"""
        if not folder or not os.path.exists(folder):
            return 0
        total_size = 0
        for dirpath, _, filenames in os.walk(folder):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.isfile(fp):
                    total_size += os.path.getsize(fp)
        return total_size

    # === Resets and Deletes ===
    def reset_everything(self, force=False):
        if not self.confirm_action("⚠️  Completely reset system (DB + uploads)?", force):
            self.stdout.write("❎ Operation cancelled.")
            return
        deleted_analyses, _ = AnalysisResult.objects.all().delete()
        deleted_files, _ = DCRMFile.objects.all().delete()
        self.stdout.write(f"🧹 Deleted {deleted_analyses} analyses and {deleted_files} files from DB.")
        self.clear_media_folder()
        self.stdout.write(self.style.SUCCESS("🎯 Full system reset complete."))

    def reset_db_only(self, force=False):
        if not self.confirm_action("⚠️  Reset database but keep uploaded files?", force):
            self.stdout.write("❎ Operation cancelled.")
            return
        deleted_analyses, _ = AnalysisResult.objects.all().delete()
        deleted_files, _ = DCRMFile.objects.all().delete()
        self.stdout.write(f"🧾 DB reset: Deleted {deleted_analyses} analyses and {deleted_files} DCRM files.")
        self.stdout.write(self.style.SUCCESS("✅ Media folder retained."))

    def clear_media_only(self, force=False):
        if not self.confirm_action("⚠️  Delete all uploaded files (keep database)?", force):
            self.stdout.write("❎ Operation cancelled.")
            return
        self.clear_media_folder()
        self.stdout.write(self.style.SUCCESS("✅ Media folder cleared, DB retained."))

    def delete_single_file(self, file_id, force=False):
        try:
            file = DCRMFile.objects.get(id=file_id)
            related_analyses = AnalysisResult.objects.filter(dcrm_file=file)
            count = related_analyses.count()
            if not self.confirm_action(
                f"⚠️  Delete file ID {file_id} ({os.path.basename(file.file.name)}) and {count} linked analyses?",
                force
            ):
                self.stdout.write("❎ Operation cancelled.")
                return

            related_analyses.delete()
            file_path = file.file.path
            file.delete()
            if os.path.exists(file_path):
                os.remove(file_path)
            self.stdout.write(self.style.SUCCESS(
                f"🗑️  Deleted file ID {file_id} and {count} linked analyses."
            ))
        except DCRMFile.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"❌ File ID {file_id} not found."))

    def delete_single_analysis(self, analysis_id, force=False):
        try:
            analysis = AnalysisResult.objects.get(id=analysis_id)
            if not self.confirm_action(f"⚠️  Delete analysis ID {analysis_id} ({analysis.result_json.get('status')})?", force):
                self.stdout.write("❎ Operation cancelled.")
                return
            analysis.delete()
            self.stdout.write(self.style.SUCCESS(f"🗑️  Deleted analysis ID {analysis_id}."))
        except AnalysisResult.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"❌ Analysis ID {analysis_id} not found."))

    def clear_media_folder(self):
        media_path = getattr(settings, "MEDIA_ROOT", None)
        if not media_path or not os.path.exists(media_path):
            self.stdout.write("⚠️  Media folder not found.")
            return
        for item in os.listdir(media_path):
            item_path = os.path.join(media_path, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path, ignore_errors=True)
            else:
                os.remove(item_path)
        self.stdout.write("🧺 Media folder cleared successfully.")
