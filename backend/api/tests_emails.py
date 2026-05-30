from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.core.mail import EmailMultiAlternatives

from api.emails import EmailService
from api.models import Product, UserTrackedProduct
from api.tasks import send_price_alerts_for_product
from accounts.models import User


class EmailServiceTests(TestCase):
    @patch("api.emails.EmailMultiAlternatives.send")
    def test_send_welcome_email_renders_and_sends(self, mock_send):
        result = EmailService.send_welcome_email(
            user_email="alice@example.com",
            user_name="Alice",
        )

        self.assertTrue(result)
        mock_send.assert_called_once()

    @patch("api.emails.EmailMultiAlternatives.send")
    def test_send_price_drop_alert_renders_and_sends(self, mock_send):
        result = EmailService.send_price_drop_alert(
            user_email="bob@example.com",
            product_title="Sony Headphones",
            product_url="https://amazon.com/dp/B123456",
            current_price="7499.00",
            target_price="8000.00",
        )

        self.assertTrue(result)
        mock_send.assert_called_once()

    @patch("api.emails.EmailMultiAlternatives.send", side_effect=Exception("SMTP failed"))
    def test_send_welcome_email_handles_error_gracefully(self, mock_send):
        result = EmailService.send_welcome_email(
            user_email="error@example.com",
        )

        self.assertFalse(result)

    @patch("api.emails.EmailMultiAlternatives.send", side_effect=Exception("SMTP failed"))
    def test_send_price_drop_alert_handles_error_gracefully(self, mock_send):
        result = EmailService.send_price_drop_alert(
            user_email="error@example.com",
            product_title="Test Product",
            product_url="https://example.com/p",
            current_price="100.00",
            target_price="200.00",
        )

        self.assertFalse(result)


class PriceAlertEmailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="tracker@example.com", password="password123")
        self.product = Product.objects.create(
            url="https://amazon.com/dp/B123456",
            title="Sony Headphones",
            current_price=Decimal("7499.00"),
        )
        self.tracked = UserTrackedProduct.objects.create(
            user=self.user,
            product=self.product,
            target_price=Decimal("8000.00"),
            alert_enabled=True,
        )

    @patch("api.tasks.EmailService.send_price_drop_alert")
    def test_send_price_alerts_when_current_price_below_target(self, mock_send_alert):
        self.product.current_price = Decimal("7200.00")
        self.product.save()

        send_price_alerts_for_product(self.product)

        mock_send_alert.assert_called_once()

    @patch("api.tasks.EmailService.send_price_drop_alert")
    def test_send_price_alerts_when_current_price_equals_target(self, mock_send_alert):
        self.product.current_price = Decimal("8000.00")
        self.product.save()

        send_price_alerts_for_product(self.product)

        mock_send_alert.assert_called_once()

    @patch("api.tasks.EmailService.send_price_drop_alert")
    def test_no_alerts_when_current_price_above_target(self, mock_send_alert):
        self.product.current_price = Decimal("8500.00")
        self.product.save()

        send_price_alerts_for_product(self.product)

        mock_send_alert.assert_not_called()

    @patch("api.tasks.EmailService.send_price_drop_alert")
    def test_no_alerts_when_alert_disabled(self, mock_send_alert):
        self.tracked.alert_enabled = False
        self.tracked.save()
        self.product.current_price = Decimal("7000.00")
        self.product.save()

        send_price_alerts_for_product(self.product)

        mock_send_alert.assert_not_called()
