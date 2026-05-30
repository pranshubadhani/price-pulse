from decimal import Decimal

from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Product, UserTrackedProduct, PriceHistory


class HealthViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_endpoint_returns_ok(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("status", response.json())


class ProductTrackingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="tracker@example.com", password="Apassword123")
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "tracker@example.com", "password": "Apassword123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    def test_create_product_tracking(self):
        payload = {
            "url": "https://example.com/product/1",
            "target_price": "499.00",
        }

        response = self.client.post("/api/products/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["url"], payload["url"])
        self.assertEqual(Decimal(response.data["target_price"]), Decimal("499.00"))
        self.assertTrue(Product.objects.filter(url=payload["url"]).exists())
        self.assertTrue(UserTrackedProduct.objects.filter(user=self.user).exists())

    def test_get_products_lists_only_authenticated_users_tracking(self):
        own_product = Product.objects.create(url="https://example.com/own", title="")
        other_user = User.objects.create_user(email="other@example.com", password="Apassword123")
        other_product = Product.objects.create(url="https://example.com/other", title="")

        UserTrackedProduct.objects.create(user=self.user, product=own_product, target_price="100.00")
        UserTrackedProduct.objects.create(user=other_user, product=other_product, target_price="200.00")

        response = self.client.get("/api/products/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["url"], "https://example.com/own")

    def test_products_endpoint_requires_authentication(self):
        client = APIClient()
        response = client.get("/api/products/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PriceHistoryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="historian@example.com", password="Apassword123")
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "historian@example.com", "password": "Apassword123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

        self.product = Product.objects.create(
            url="https://example.com/item/1",
            title="Test Item",
            current_price="500.00",
        )
        self.tracked = UserTrackedProduct.objects.create(
            user=self.user,
            product=self.product,
            target_price="400.00",
        )

    def test_get_product_history_returns_all_price_entries(self):
        PriceHistory.objects.create(product=self.product, price="600.00")
        PriceHistory.objects.create(product=self.product, price="550.00")
        PriceHistory.objects.create(product=self.product, price="500.00")

        response = self.client.get(f"/api/products/{self.product.id}/history/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertEqual(Decimal(response.data[0]["price"]), Decimal("500.00"))

    def test_product_history_requires_user_to_track_product(self):
        other_product = Product.objects.create(url="https://example.com/item/2", title="")
        PriceHistory.objects.create(product=other_product, price="100.00")

        response = self.client.get(f"/api/products/{other_product.id}/history/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_product_history_requires_authentication(self):
        client = APIClient()
        response = client.get(f"/api/products/{self.product.id}/history/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_product_history_returns_404_for_nonexistent_product(self):
        response = self.client.get("/api/products/99999/history/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
