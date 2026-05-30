from django.test import TestCase, Client
from django.contrib.auth import get_user_model

User = get_user_model()

class SimpleClientTest(TestCase):
    def test_register_with_django_client(self):
        """Test if Django's Client works (without APIClient)"""
        client = Client()
        response = client.post(
            '/api/auth/register/',  # WITH trailing slash
            data='{"email":"test@example.com","password":"Apassword123"}',
            content_type='application/json'
        )
        print(f"\n=== Django Client Result ===")
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.get('Content-Type', 'N/A')}")
        print(f"Location: {response.get('Location', 'N/A')}")
        self.assertEqual(response.status_code, 201)
