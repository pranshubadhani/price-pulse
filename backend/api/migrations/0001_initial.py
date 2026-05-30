from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("url", models.URLField(unique=True)),
                ("title", models.CharField(blank=True, max_length=512)),
                ("current_price", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("last_checked", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="UserTrackedProduct",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("alert_enabled", models.BooleanField(default=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tracked_by_users", to="api.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tracked_products", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "unique_together": {("user", "product")},
            },
        ),
    ]
