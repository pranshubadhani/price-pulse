import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("pricepulse")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


app.conf.beat_schedule = {
    "check-product-prices-every-2-hours": {
        "task": "api.tasks.check_product_prices",
        "schedule": 2 * 60 * 60,
    },
}
