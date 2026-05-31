from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
import re
from typing import Callable, Optional

import requests
from bs4 import BeautifulSoup


@dataclass
class ScrapeResult:
    title: str
    price: Decimal


class GenericScraper:
    price_pattern = re.compile(r"\d+[\d,]*(?:\.\d{1,2})?")
    request_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }

    def scrape(
        self,
        url: str,
        html_fetcher: Optional[Callable[[str], str]] = None,
        playwright_fetcher: Optional[Callable[[str], str]] = None,
    ) -> ScrapeResult:
        html = self._fetch_html(url, html_fetcher)
        result = self._parse(html)

        if result is not None:
            return result

        rendered_html = self._fetch_with_playwright(url, playwright_fetcher)
        if not rendered_html:
            raise ValueError("Unable to scrape product data with BeautifulSoup or Playwright")

        rendered_result = self._parse(rendered_html)
        if rendered_result is None:
            raise ValueError("Unable to extract title and price from rendered content")

        return rendered_result

    def _fetch_html(self, url: str, html_fetcher: Optional[Callable[[str], str]] = None) -> str:
        if html_fetcher is not None:
            return html_fetcher(url)

        response = requests.get(url, timeout=15, headers=self.request_headers)
        response.raise_for_status()
        return response.text

    def _fetch_with_playwright(
        self,
        url: str,
        playwright_fetcher: Optional[Callable[[str], str]] = None,
    ) -> Optional[str]:
        if playwright_fetcher is not None:
            return playwright_fetcher(url)

        try:
            from playwright.sync_api import sync_playwright
        except Exception:
            return None

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent=self.request_headers["User-Agent"],
                locale="en-IN",
            )
            page.goto(url, wait_until="networkidle", timeout=30000)
            content = page.content()
            browser.close()
        return content

    def _parse(self, html: str) -> Optional[ScrapeResult]:
        soup = BeautifulSoup(html, "html.parser")
        title = self.extract_title(soup)
        price = self.extract_price(soup)

        if not title or price is None:
            return None

        return ScrapeResult(title=title.strip(), price=price)

    def extract_title(self, soup: BeautifulSoup) -> str:
        raise NotImplementedError

    def extract_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        raise NotImplementedError

    @classmethod
    def parse_price_text(cls, value: str) -> Optional[Decimal]:
        if not value:
            return None

        match = cls.price_pattern.search(value.replace("\u20b9", ""))
        if not match:
            return None

        normalized = match.group(0).replace(",", "")
        try:
            return Decimal(normalized)
        except Exception:
            return None
