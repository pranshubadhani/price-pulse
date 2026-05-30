from django.urls import path

from .views import HealthView, MetricsView, ProductListCreateView, ProductHistoryView

app_name = "api"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("metrics/", MetricsView.as_view(), name="metrics"),
    path("products/", ProductListCreateView.as_view(), name="products"),
    path("products/<int:product_id>/history/", ProductHistoryView.as_view(), name="product_history"),
]
