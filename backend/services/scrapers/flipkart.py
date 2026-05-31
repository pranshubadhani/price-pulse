from decimal import Decimal
import json
from typing import Optional

from bs4 import BeautifulSoup

from .generic import GenericScraper


class FlipkartScraper(GenericScraper):
    def extract_title(self, soup: BeautifulSoup) -> str:
        candidates = [
            "span.B_NuCI",
            "h1._6EBuvT span",
            "h1.yhB1nd",
            "meta[property='og:title']",
        ]
        for selector in candidates:
            node = soup.select_one(selector)
            if node:
                if node.name == "meta":
                    text = str(node.get("content", "")).strip()
                else:
                    text = node.get_text(strip=True)
                if text:
                    return text

        for script in soup.select("script[type='application/ld+json']"):
            raw = script.string or script.get_text(strip=True)
            if not raw:
                continue
            try:
                payload = json.loads(raw)
            except Exception:
                continue

            candidates_payload = payload if isinstance(payload, list) else [payload]
            for item in candidates_payload:
                if not isinstance(item, dict):
                    continue
                name = item.get("name")
                if isinstance(name, str) and name.strip():
                    return name.strip()

        return ""

    def extract_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        candidates = [
            "div._30jeq3._16Jk6d",
            "div.Nx9bqj.CxhGGd",
            "div._25b18c ._30jeq3",
            "meta[property='product:price:amount']",
            "meta[itemprop='price']",
        ]
        for selector in candidates:
            node = soup.select_one(selector)
            if node:
                if node.name == "meta":
                    raw_text = str(node.get("content", "")).strip()
                else:
                    raw_text = node.get_text(strip=True)
                parsed = self.parse_price_text(raw_text)
                if parsed is not None:
                    return parsed

        for script in soup.select("script[type='application/ld+json']"):
            raw = script.string or script.get_text(strip=True)
            if not raw:
                continue
            try:
                payload = json.loads(raw)
            except Exception:
                continue

            candidates_payload = payload if isinstance(payload, list) else [payload]
            for item in candidates_payload:
                if not isinstance(item, dict):
                    continue
                offers = item.get("offers")
                if isinstance(offers, dict):
                    parsed = self.parse_price_text(str(offers.get("price", "")))
                    if parsed is not None:
                        return parsed

        return None
