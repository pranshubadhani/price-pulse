from django.conf import settings
from django.db import models


class Product(models.Model):
    url = models.URLField(unique=True, max_length=2048)
    title = models.CharField(max_length=512, blank=True)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or self.url


class UserTrackedProduct(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tracked_products")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="tracked_by_users")
    target_price = models.DecimalField(max_digits=10, decimal_places=2)
    alert_enabled = models.BooleanField(default=True)
    last_alert_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_alert_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "product")

    def __str__(self):
        return f"{self.user.email} -> {self.product.url}"


class PriceHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="price_history")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["product", "-timestamp"]),
        ]

    def __str__(self):
        return f"{self.product.url} -> {self.price} at {self.timestamp}"
