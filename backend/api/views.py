import logging
import os
from django.db import transaction
from django.db import connection
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, UserTrackedProduct, PriceHistory
from .serializers import ProductCreateSerializer, TrackedProductSerializer, PriceHistorySerializer
from .tasks import scrape_single_product, check_product_prices

logger = logging.getLogger(__name__)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        """Health check endpoint with database connectivity check"""
        try:
            # Check database connectivity
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            return Response({
                "status": "ok",
                "database": "connected",
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return Response({
                "status": "error",
                "database": "disconnected",
                "error": str(e),
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class MetricsView(APIView):
    """Metrics and monitoring endpoint"""
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        """Get system metrics"""
        try:
            total_products = Product.objects.count()
            total_tracked = UserTrackedProduct.objects.count()
            total_users = UserTrackedProduct.objects.values('user').distinct().count()
            total_price_entries = PriceHistory.objects.count()
            
            return Response({
                "metrics": {
                    "total_products": total_products,
                    "total_tracked_products": total_tracked,
                    "active_users": total_users,
                    "price_history_entries": total_price_entries,
                },
                "status": "ok",
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Metrics retrieval failed: {str(e)}")
            return Response({
                "status": "error",
                "error": str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tracked_products = (
            UserTrackedProduct.objects.select_related("product")
            .filter(user=request.user)
            .order_by("-product__created_at")
        )
        serializer = TrackedProductSerializer(tracked_products, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        serializer = ProductCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        product, product_created = Product.objects.get_or_create(
            url=serializer.validated_data["url"],
            defaults={"title": "", "current_price": None, "last_checked": None},
        )

        tracked_product, created = UserTrackedProduct.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={
                "target_price": serializer.validated_data["target_price"],
                "alert_enabled": True,
            },
        )

        if not created:
            tracked_product.target_price = serializer.validated_data["target_price"]
            tracked_product.alert_enabled = True
            tracked_product.save(update_fields=["target_price", "alert_enabled"])

        # Kick off an immediate scrape when the product is brand new
        if product_created:
            try:
                scrape_single_product.delay(product.id)
            except Exception as exc:
                logger.warning(f"Could not enqueue scrape for product {product.id}: {exc}")

        response_serializer = TrackedProductSerializer(tracked_product)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(response_serializer.data, status=status_code)


class CronPriceCheckView(APIView):
    """Called by GitHub Actions cron — protected by CRON_SECRET header."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        secret = os.getenv("CRON_SECRET", "")
        if not secret:
            return Response({"detail": "Cron not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if request.headers.get("X-Cron-Secret") != secret:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        try:
            task = check_product_prices.delay()
            return Response(
                {"detail": "Price check enqueued.", "task_id": str(getattr(task, "id", ""))},
                status=status.HTTP_202_ACCEPTED,
            )
        except Exception as enqueue_exc:
            logger.warning(f"Cron could not enqueue price check: {enqueue_exc}")

        # Fallback to synchronous execution when broker/worker isn't available.
        try:
            # Run task body directly to avoid Celery backend/broker dependencies in fallback mode.
            check_product_prices.run()

            return Response({"detail": "Price check completed synchronously."}, status=status.HTTP_200_OK)
        except Exception as sync_exc:
            logger.exception(f"Cron synchronous execution failed: {sync_exc}")
            return Response(
                {"detail": "Price check failed.", "error": str(sync_exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class ProductHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)

        user_tracks = (
            UserTrackedProduct.objects.select_related("product")
            .filter(user=request.user, product=product)
            .exists()
        )

        if not user_tracks:
            return Response({"detail": "You are not tracking this product."}, status=status.HTTP_403_FORBIDDEN)

        history = PriceHistory.objects.filter(product=product).order_by("-timestamp")
        serializer = PriceHistorySerializer(history, many=True)
        return Response(serializer.data)
