from decimal import Decimal

from rest_framework import serializers

from .models import Product, UserTrackedProduct, PriceHistory


class ProductCreateSerializer(serializers.Serializer):
    url = serializers.URLField()
    target_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"))

    def validate_url(self, value):
        """Validate URL format and supported domains"""
        if not value or not isinstance(value, str):
            raise serializers.ValidationError("URL must be a non-empty string.")
        
        value = value.strip()
        if len(value) > 2048:
            raise serializers.ValidationError("URL is too long (max 2048 characters).")
        
        # Check if product already being tracked by user
        user = self.context.get("request").user if self.context.get("request") else None
        if user and Product.objects.filter(url=value).exists():
            if UserTrackedProduct.objects.filter(user=user, product__url=value).exists():
                raise serializers.ValidationError("You are already tracking this product.")
        
        return value

    def validate_target_price(self, value):
        """Validate target price"""
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Target price cannot be negative.")
        if value > Decimal("99999999.99"):
            raise serializers.ValidationError("Target price is too high.")
        return value


class TrackedProductSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="product.id", read_only=True)
    url = serializers.URLField(source="product.url", read_only=True)
    title = serializers.CharField(source="product.title", read_only=True)
    current_price = serializers.DecimalField(source="product.current_price", max_digits=10, decimal_places=2, read_only=True)
    last_checked = serializers.DateTimeField(source="product.last_checked", read_only=True)
    created_at = serializers.DateTimeField(source="product.created_at", read_only=True)

    class Meta:
        model = UserTrackedProduct
        fields = (
            "id",
            "url",
            "title",
            "current_price",
            "last_checked",
            "created_at",
            "target_price",
            "alert_enabled",
        )

    def validate_target_price(self, value):
        """Validate target price on update"""
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Target price cannot be negative.")
        if value > Decimal("99999999.99"):
            raise serializers.ValidationError("Target price is too high.")
        return value


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ("price", "timestamp")
        read_only_fields = ("price", "timestamp")
