import logging
from decimal import Decimal
from typing import Optional

from celery import shared_task
from django.utils import timezone

from services.scrapers.ajio import AjioScraper
from services.scrapers.amazon import AmazonScraper
from services.scrapers.flipkart import FlipkartScraper
from services.scrapers.myntra import MyntraScraper

from .emails import EmailService
from .models import Product, PriceHistory, UserTrackedProduct

logger = logging.getLogger(__name__)

SCRAPER_MAP = {
    "amazon.com": AmazonScraper(),
    "flipkart.com": FlipkartScraper(),
    "myntra.com": MyntraScraper(),
    "ajio.com": AjioScraper(),
}


def get_scraper_for_url(url: str):
    for domain, scraper in SCRAPER_MAP.items():
        if domain in url:
            return scraper
    return AmazonScraper()


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def scrape_single_product(self, product_id: int):
    """Immediately scrape a single product by ID."""
    try:
        product = Product.objects.get(pk=product_id)
        scraper = get_scraper_for_url(product.url)
        result = scraper.scrape(product.url)

        product.title = result.title or product.title
        product.current_price = result.price
        product.last_checked = timezone.now()
        product.save(update_fields=["title", "current_price", "last_checked"])

        if result.price is not None:
            PriceHistory.objects.create(product=product, price=result.price)

        logger.info(f"Immediate scrape done for product {product_id}: {result.price}")
        return {"product_id": product_id, "price": str(result.price)}
    except Product.DoesNotExist:
        logger.warning(f"scrape_single_product: product {product_id} not found")
        return {"error": "not found"}
    except Exception as exc:
        logger.error(f"scrape_single_product failed for {product_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=5 * 60)
def check_product_prices(self):
    try:
        products = Product.objects.all()
        updated_count = 0

        for product in products:
            try:
                scraper = get_scraper_for_url(product.url)
                result = scraper.scrape(product.url)

                product.title = result.title
                product.current_price = result.price
                product.last_checked = timezone.now()
                product.save(update_fields=["title", "current_price", "last_checked"])

                PriceHistory.objects.create(product=product, price=result.price)
                updated_count += 1

                logger.info(f"Updated {product.url}: {result.price}")

                send_price_alerts_for_product(product)
            except Exception as exc:
                logger.error(f"Failed to scrape {product.url}: {exc}")
                continue

        logger.info(f"Price check completed: {updated_count} products updated")
        return {"updated": updated_count}

    except Exception as exc:
        logger.error(f"Price check task failed: {exc}")
        raise self.retry(exc=exc)


def send_price_alerts_for_product(product: Product):
    """Send price drop alerts for tracked users."""
    if product.current_price is None:
        return

    tracked = UserTrackedProduct.objects.filter(
        product=product,
        alert_enabled=True,
    )

    for tracked_product in tracked:
        if product.current_price <= tracked_product.target_price:
            should_send = (
                tracked_product.last_alert_price is None
                or product.current_price < tracked_product.last_alert_price
            )

            if should_send:
                EmailService.send_price_drop_alert(
                    user_email=tracked_product.user.email,
                    product_title=product.title,
                    product_url=product.url,
                    current_price=str(product.current_price),
                    target_price=str(tracked_product.target_price),
                )
                tracked_product.last_alert_price = product.current_price
                tracked_product.last_alert_sent_at = timezone.now()
                tracked_product.save(update_fields=["last_alert_price", "last_alert_sent_at"])
        elif tracked_product.last_alert_price is not None:
            tracked_product.last_alert_price = None
            tracked_product.save(update_fields=["last_alert_price"])
