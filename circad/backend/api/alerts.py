# circad/backend/api/alerts.py
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_alert_email(recipients, subject, body):
    """
    recipients: list of email strings
    subject: string
    body: string
    """
    if not recipients:
        logger.warning("send_alert_email called without recipients.")
        return False
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
            recipient_list=recipients,
            fail_silently=False,
        )
        logger.info("Alert email sent to %s", recipients)
        return True
    except Exception as e:
        logger.exception("Failed to send alert email: %s", e)
        return False
