from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthEndpointsTests(APITestCase):
    def test_register_creates_user(self):
        payload = {
            "email": "alice@example.com",
            "password": "Apassword123",
        }

        response = self.client.post("/api/auth/register/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], payload["email"])
        self.assertTrue(User.objects.filter(email=payload["email"]).exists())

    def test_login_returns_jwt_tokens(self):
        password = "Apassword123"
        email = "bob@example.com"
        User.objects.create_user(email=email, password=password)

        response = self.client.post(
            "/api/auth/login/",
            {"email": email, "password": password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_refresh_returns_new_access_token(self):
        password = "Apassword123"
        email = "carol@example.com"
        User.objects.create_user(email=email, password=password)

        login_response = self.client.post(
            "/api/auth/login/",
            {"email": email, "password": password},
            format="json",
        )

        refresh_response = self.client.post(
            "/api/auth/refresh/",
            {"refresh": login_response.data["refresh"]},
            format="json",
        )

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)
