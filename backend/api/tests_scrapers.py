from decimal import Decimal

from django.test import SimpleTestCase

from services.scrapers.ajio import AjioScraper
from services.scrapers.amazon import AmazonScraper
from services.scrapers.flipkart import FlipkartScraper
from services.scrapers.generic import GenericScraper
from services.scrapers.myntra import MyntraScraper


class GenericScraperTests(SimpleTestCase):
    def test_parse_price_text_supports_currency_and_commas(self):
        parsed = GenericScraper.parse_price_text("Rs. 12,499.50")

        self.assertEqual(parsed, Decimal("12499.50"))


class AmazonScraperTests(SimpleTestCase):
    def test_extracts_title_and_price_with_beautifulsoup(self):
        html = """
        <html>
            <span id='productTitle'>Sony Headphones</span>
            <span class='a-price'>
                <span class='a-offscreen'>Rs. 7,499.00</span>
            </span>
        </html>
        """
        scraper = AmazonScraper()

        result = scraper.scrape("https://amazon.example/p/1", html_fetcher=lambda _: html)

        self.assertEqual(result.title, "Sony Headphones")
        self.assertEqual(result.price, Decimal("7499.00"))

    def test_uses_playwright_fallback_when_initial_html_is_missing_price(self):
        initial_html = """
        <html>
            <span id='productTitle'>Sony Headphones</span>
        </html>
        """
        rendered_html = """
        <html>
            <span id='productTitle'>Sony Headphones</span>
            <span id='priceblock_dealprice'>Rs. 6,999.00</span>
        </html>
        """
        scraper = AmazonScraper()

        result = scraper.scrape(
            "https://amazon.example/p/2",
            html_fetcher=lambda _: initial_html,
            playwright_fetcher=lambda _: rendered_html,
        )

        self.assertEqual(result.title, "Sony Headphones")
        self.assertEqual(result.price, Decimal("6999.00"))


class FlipkartScraperTests(SimpleTestCase):
    def test_extracts_title_and_price_with_beautifulsoup(self):
        html = """
        <html>
            <span class='B_NuCI'>Apple iPhone 15</span>
            <div class='_30jeq3 _16Jk6d'>Rs. 69,999</div>
        </html>
        """
        scraper = FlipkartScraper()

        result = scraper.scrape("https://flipkart.example/p/1", html_fetcher=lambda _: html)

        self.assertEqual(result.title, "Apple iPhone 15")
        self.assertEqual(result.price, Decimal("69999"))

    def test_extracts_from_meta_fields(self):
        html = """
        <html>
            <meta property='og:title' content='Casio Watch'>
            <meta property='product:price:amount' content='2795'>
        </html>
        """
        scraper = FlipkartScraper()

        result = scraper.scrape("https://flipkart.example/p/2", html_fetcher=lambda _: html)

        self.assertEqual(result.title, "Casio Watch")
        self.assertEqual(result.price, Decimal("2795"))

    def test_extracts_from_json_ld(self):
        html = """
        <html>
            <script type='application/ld+json'>
            {
                "@context": "https://schema.org",
                "name": "Casio Youth Analog Watch",
                "offers": {"price": "2699"}
            }
            </script>
        </html>
        """
        scraper = FlipkartScraper()

        result = scraper.scrape("https://flipkart.example/p/3", html_fetcher=lambda _: html)

        self.assertEqual(result.title, "Casio Youth Analog Watch")
        self.assertEqual(result.price, Decimal("2699"))


class MyntraScraperTests(SimpleTestCase):
    def test_extracts_title_and_price_with_beautifulsoup(self):
        html = """
        <html>
            <h1 class='productTitle'>Nike Running Shoes</h1>
            <span class='productDiscountedPrice'>Rs. 5,499.00</span>
        </html>
        """
        scraper = MyntraScraper()

        result = scraper.scrape("https://myntra.example/p/1", html_fetcher=lambda _: html)

        self.assertEqual(result.title, "Nike Running Shoes")
        self.assertEqual(result.price, Decimal("5499.00"))

    def test_uses_playwright_fallback_when_initial_html_is_missing_price(self):
        initial_html = """
        <html>
            <h1 class='productTitle'>Nike Running Shoes</h1>
        </html>
        """
        rendered_html = """
        <html>
            <h1 class='productTitle'>Nike Running Shoes</h1>
            <span class='productDiscountedPrice'>Rs. 4,999.00</span>
        </html>
        """
        scraper = MyntraScraper()

        result = scraper.scrape(
            "https://myntra.example/p/2",
            html_fetcher=lambda _: initial_html,
            playwright_fetcher=lambda _: rendered_html,
        )

        self.assertEqual(result.title, "Nike Running Shoes")
        self.assertEqual(result.price, Decimal("4999.00"))


class AjioScraperTests(SimpleTestCase):
    def test_extracts_title_and_price_with_beautifulsoup(self):
        html = """
        <html>
            <h1 class='productTitle'>Adidas Sports Jacket</h1>
            <span class='sellingPrice'>Rs. 3,299.00</span>
        </html>
        """
        scraper = AjioScraper()

        result = scraper.scrape("https://ajio.example/p/1", html_fetcher=lambda _: html)

        self.assertEqual(result.title, "Adidas Sports Jacket")
        self.assertEqual(result.price, Decimal("3299.00"))

    def test_uses_playwright_fallback_when_initial_html_is_missing_price(self):
        initial_html = """
        <html>
            <h1 class='productTitle'>Adidas Sports Jacket</h1>
        </html>
        """
        rendered_html = """
        <html>
            <h1 class='productTitle'>Adidas Sports Jacket</h1>
            <span class='sellingPrice'>Rs. 2,999.00</span>
        </html>
        """
        scraper = AjioScraper()

        result = scraper.scrape(
            "https://ajio.example/p/2",
            html_fetcher=lambda _: initial_html,
            playwright_fetcher=lambda _: rendered_html,
        )

        self.assertEqual(result.title, "Adidas Sports Jacket")
        self.assertEqual(result.price, Decimal("2999.00"))
