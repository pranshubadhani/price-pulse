from decimal import Decimal
from typing import Optional

from bs4 import BeautifulSoup

from .generic import GenericScraper


class AmazonScraper(GenericScraper):
    def extract_title(self, soup: BeautifulSoup) -> str:
        title = soup.select_one("#productTitle")
        if title:
            return title.get_text(strip=True)

        meta_title = soup.select_one("meta[name='title']")
        if meta_title and meta_title.get("content"):
            return str(meta_title["content"])

        return ""

    def extract_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        candidates = [
            "#priceblock_dealprice",
            "#priceblock_ourprice",
            "#priceblock_saleprice",
            ".a-price .a-offscreen",
        ]
        for selector in candidates:
            node = soup.select_one(selector)
            if node:
                parsed = self.parse_price_text(node.get_text(strip=True))
                if parsed is not None:
                    return parsed
        return None
