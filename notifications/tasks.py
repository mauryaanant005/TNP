from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Notification
import logging
import os

logger = logging.getLogger(__name__)


@shared_task
def send_notification_email(notification_id):
    """
    Send email notifications to all recipients of a notification.
    This task is triggered when a new notification is created.
    """
    try:
        # Get the notification
        notification = Notification.objects.prefetch_related('recipients').get(id=notification_id)
        
        # Get all recipients
        recipients = notification.recipients.all()
        
        if not recipients:
            logger.warning(f"No recipients found for notification {notification_id}")
            return {"status": "no_recipients"}
        
        # Prepare email details
        subject = f"New Notification: {notification.title}"
        from_email = settings.EMAIL_HOST_USER
        
        # Render HTML email template
        html_message = render_to_string(
            'emails/notification.html',
            {
                'title': notification.title,
                'message': notification.message,
                'category': notification.category,
                'created_at': notification.created_at,
            }
        )
        plain_message = strip_tags(html_message)
        
        # Send email to each recipient
        sent_count = 0
        failed_count = 0
        
        for recipient in recipients:
            try:
                # Use EmailMultiAlternatives to support attachments
                email = EmailMultiAlternatives(
                    subject,
                    plain_message,
                    from_email,
                    [recipient.email],
                )
                
                # Attach HTML content
                email.attach_alternative(html_message, "text/html")
                
                # Attach file if it exists
                if notification.files and notification.files.name:
                    try:
                        # Get the file path
                        file_path = notification.files.path
                        if os.path.exists(file_path):
                            # Get the filename from the path
                            filename = os.path.basename(file_path)
                            # Open and attach the file
                            with open(file_path, 'rb') as file:
                                email.attach(filename, file.read(), notification.files.name)
                            logger.info(f"Attaching file {filename} to email for recipient {recipient.id}")
                        else:
                            logger.warning(f"File not found: {file_path}")
                    except Exception as e:
                        logger.error(f"Error attaching file for recipient {recipient.id}: {str(e)}")

                # Send the email
                email.send(fail_silently=False)
                sent_count += 1
                logger.info(f"Notification email sent successfully to recipient {recipient.id}")
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to send notification email to recipient {recipient.id}: {str(e)}")
        
        return {
            "status": "completed",
            "sent": sent_count,
            "failed": failed_count,
            "total_recipients": len(recipients)
        }
    
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist")
        return {"status": "error", "message": "Notification not found"}
    except Exception as e:
        logger.error(f"Error sending notification emails: {str(e)}")
        return {"status": "error", "message": str(e)}