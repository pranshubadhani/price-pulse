from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from api.models import Product, PriceHistory
from api.tasks import check_product_prices


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class PriceCheckTaskTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            url="https://amazon.com/dp/B123456",
            title="",
            current_price=None,
            last_checked=None,
        )

    @patch("api.tasks.get_scraper_for_url")
    def test_check_product_prices_updates_product_and_creates_history(self, mock_get_scraper):
        mock_scraper = MagicMock()
        mock_scraper.scrape.return_value = MagicMock(
            title="Sony Headphones",
            price=Decimal("7499.00"),
        )
        mock_get_scraper.return_value = mock_scraper

        result = check_product_prices()

        self.product.refresh_from_db()
        self.assertEqual(self.product.title, "Sony Headphones")
        self.assertEqual(self.product.current_price, Decimal("7499.00"))
        self.assertIsNotNone(self.product.last_checked)

        history = PriceHistory.objects.filter(product=self.product)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().price, Decimal("7499.00"))

        self.assertEqual(result["updated"], 1)

    @patch("api.tasks.get_scraper_for_url")
    def test_check_product_prices_continues_on_scrape_error(self, mock_get_scraper):
        good_product = Product.objects.create(
            url="https://flipkart.com/p/item1",
            title="",
        )

        mock_scraper = MagicMock()
        mock_scraper.scrape.side_effect = [
            Exception("Scrape failed"),
            MagicMock(title="Good Item", price=Decimal("500.00")),
        ]
        mock_get_scraper.return_value = mock_scraper

        result = check_product_prices()

        self.product.refresh_from_db()
        self.assertEqual(self.product.title, "")
        self.assertIsNone(self.product.current_price)

        good_product.refresh_from_db()
        self.assertEqual(good_product.title, "Good Item")

        self.assertEqual(result["updated"], 1)

    def test_get_scraper_for_url_selects_amazon_scraper(self):
        from api.tasks import get_scraper_for_url
        from services.scrapers.amazon import AmazonScraper

        scraper = get_scraper_for_url("https://amazon.com/dp/B123456")
        self.assertIsInstance(scraper, AmazonScraper)

    def test_get_scraper_for_url_selects_flipkart_scraper(self):
        from api.tasks import get_scraper_for_url
        from services.scrapers.flipkart import FlipkartScraper

        scraper = get_scraper_for_url("https://flipkart.com/p/item")
        self.assertIsInstance(scraper, FlipkartScraper)

    def test_get_scraper_for_url_defaults_to_amazon(self):
        from api.tasks import get_scraper_for_url
        from services.scrapers.amazon import AmazonScraper

        scraper = get_scraper_for_url("https://example.com/product")
        self.assertIsInstance(scraper, AmazonScraper)

    def test_get_scraper_for_url_selects_myntra_scraper(self):
        from api.tasks import get_scraper_for_url
        from services.scrapers.myntra import MyntraScraper

        scraper = get_scraper_for_url("https://myntra.com/p/item")
        self.assertIsInstance(scraper, MyntraScraper)

    def test_get_scraper_for_url_selects_ajio_scraper(self):
        from api.tasks import get_scraper_for_url
        from services.scrapers.ajio import AjioScraper

        scraper = get_scraper_for_url("https://ajio.com/p/item")
        self.assertIsInstance(scraper, AjioScraper)
