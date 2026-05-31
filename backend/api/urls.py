from django.urls import path

from .views import (
    HealthView,
    MetricsView,
    ProductListCreateView,
    ProductHistoryView,
    ProductDetailView,
    CronPriceCheckView,
)

app_name = "api"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("metrics/", MetricsView.as_view(), name="metrics"),
    path("products/", ProductListCreateView.as_view(), name="products"),
    path("products/<int:product_id>/refresh/", ProductDetailView.as_view(), name="product_refresh"),
    path("products/<int:product_id>/", ProductDetailView.as_view(), name="product_detail"),
    path("products/<int:product_id>/history/", ProductHistoryView.as_view(), name="product_history"),
    path("cron/price-check/", CronPriceCheckView.as_view(), name="cron_price_check"),
]
