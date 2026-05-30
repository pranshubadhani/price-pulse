from decimal import Decimal
from typing import Optional

from bs4 import BeautifulSoup

from .generic import GenericScraper


class FlipkartScraper(GenericScraper):
    def extract_title(self, soup: BeautifulSoup) -> str:
        candidates = [
            "span.B_NuCI",
            "h1._6EBuvT span",
            "h1.yhB1nd",
        ]
        for selector in candidates:
            node = soup.select_one(selector)
            if node:
                text = node.get_text(strip=True)
                if text:
                    return text
        return ""

    def extract_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        candidates = [
            "div._30jeq3._16Jk6d",
            "div.Nx9bqj.CxhGGd",
            "div._25b18c ._30jeq3",
        ]
        for selector in candidates:
            node = soup.select_one(selector)
            if node:
                parsed = self.parse_price_text(node.get_text(strip=True))
                if parsed is not None:
                    return parsed
        return None
