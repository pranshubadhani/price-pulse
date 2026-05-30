import logging
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_welcome_email(user_email: str, user_name: str = "") -> bool:
        """Send welcome email to new user."""
        try:
            subject = "Welcome to PricePulse!"
            context = {
                "user_name": user_name or user_email.split("@")[0],
            }
            html_content = render_to_string("emails/welcome.html", context)
            text_content = f"Welcome to PricePulse! Start tracking product prices and get alerts on price drops."

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user_email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            logger.info(f"Welcome email sent to {user_email}")
            return True
        except Exception as exc:
            logger.error(f"Failed to send welcome email to {user_email}: {exc}")
            return False

    @staticmethod
    def send_price_drop_alert(
        user_email: str,
        product_title: str,
        product_url: str,
        current_price: str,
        target_price: str,
    ) -> bool:
        """Send price drop alert email."""
        try:
            subject = f"Price Drop Alert: {product_title}"
            context = {
                "product_title": product_title,
                "product_url": product_url,
                "current_price": current_price,
                "target_price": target_price,
            }
            html_content = render_to_string("emails/price_drop.html", context)
            text_content = (
                f"Great news! {product_title} is now {current_price}, "
                f"which is below your target price of {target_price}."
            )

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user_email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            logger.info(f"Price drop alert sent to {user_email} for {product_title}")
            return True
        except Exception as exc:
            logger.error(f"Failed to send price drop alert to {user_email}: {exc}")
            return False
