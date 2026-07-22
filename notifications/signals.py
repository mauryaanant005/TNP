from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Notification
from .tasks import send_notification_email

# Trigger when recipients are added to a notification
@receiver(m2m_changed, sender=Notification.recipients.through)
def notification_recipients_added(sender, instance, action, pk_set, **kwargs):
    """
    Signal triggered when recipients are added to a notification.
    This ensures emails are sent only after all recipients are set.
    """
    # 'post_add' action means recipients were added to ManyToMany field
    if action == 'post_add' and pk_set:
        # Trigger async email sending task
        send_notification_email.delay(instance.id)
        print(f"Notification email task triggered for notification {instance.id}")