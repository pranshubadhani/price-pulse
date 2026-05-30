from decimal import Decimal
from typing import Optional

from bs4 import BeautifulSoup

from .generic import GenericScraper


class MyntraScraper(GenericScraper):
    def extract_title(self, soup: BeautifulSoup) -> str:
        candidates = [
            "h1.productTitle",
            "h1.productPageTitle",
            "meta[property='og:title']",
        ]
        
        for selector in candidates:
            if selector.startswith("meta"):
                node = soup.select_one(selector)
                if node and node.get("content"):
                    return str(node["content"])
            else:
                node = soup.select_one(selector)
                if node:
                    text = node.get_text(strip=True)
                    if text:
                        return text
        
        return ""

    def extract_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        candidates = [
            "span.productDiscountedPrice",
            "h3.productCardPrice",
            "div.productPriceContainer span",
            "span.discountedPrice",
        ]
        
        for selector in candidates:
            node = soup.select_one(selector)
            if node:
                parsed = self.parse_price_text(node.get_text(strip=True))
                if parsed is not None:
                    return parsed
        
        return None
