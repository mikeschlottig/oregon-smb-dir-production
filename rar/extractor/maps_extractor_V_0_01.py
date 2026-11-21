"""
Google Maps Listing Extractor — Scrapling Adaptor Engine
Extracts ordered business rankings, names, CIDs, ratings, reviews, and addresses from rendered Maps DOM.
"""
import re
from typing import List, Optional
from urllib.parse import urlparse, parse_qs
from scrapling import Selector
from rar.schemas.data_models_V_0_01 import BusinessResult


def extract_cid_from_url(url: str) -> Optional[str]:
    """
    Extracts canonical Google CID (decimal ludocid) from Google Maps place URLs.
    Format in URL often includes: !1s0x...:0x<hex_cid>!
    """
    if not url:
        return None

    # Check for direct ludocid or lrd parameter in query string
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    if "ludocid" in qs:
        return qs["ludocid"][0]

    # Pattern: 0x[0-9a-fA-F]+:0x([0-9a-fA-F]+)
    match = re.search(r"0x[0-9a-fA-F]+:(0x[0-9a-fA-F]+)", url)
    if match:
        hex_cid = match.group(1)
        try:
            dec_cid = str(int(hex_cid, 16))
            return dec_cid
        except ValueError:
            pass

    return None


def extract_place_id_from_url(url: str) -> Optional[str]:
    """
    Extracts Google Place ID (e.g. ChIJ...) from URL path if present.
    """
    if not url:
        return None
    match = re.search(r"(ChIJ[a-zA-Z0-9_-]{23,})", url)
    if match:
        return match.group(1)
    return None


def parse_numeric_rating(rating_str: Optional[str]) -> Optional[float]:
    if not rating_str:
        return None
    match = re.search(r"([1-5]\.[0-9]|[1-5])", rating_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return None


def parse_numeric_reviews(review_str: Optional[str]) -> Optional[int]:
    if not review_str:
        return None
    # Matches patterns like (142), (1,234), or 142 reviews
    clean = review_str.replace(",", "").replace(".", "")
    match = re.search(r"\(?(\d+)\)?", clean)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            pass
    return None


def extract_maps_listings(html_content: str, max_rank: int = 20) -> List[BusinessResult]:
    """
    Parses rendered Google Maps HTML using Scrapling Selector and returns ordered BusinessResult models.
    """
    selector = Selector(html_content)
    
    # Primary selector: Listing cards 'div.Nv2PK'
    cards = selector.css("div.Nv2PK")
    
    # Fallback selector: Listing anchors 'a.hfpxzc'
    if not cards:
        anchors = selector.css("a.hfpxzc")
        results: List[BusinessResult] = []
        for idx, a in enumerate(anchors[:max_rank], start=1):
            name = a.attrib.get("aria-label", "").strip()
            href = a.attrib.get("href", "")
            if not name:
                continue
            cid = extract_cid_from_url(href)
            place_id = extract_place_id_from_url(href)
            results.append(
                BusinessResult(
                    rank=idx,
                    name=name,
                    cid=cid,
                    place_id=place_id,
                    maps_url=href,
                )
            )
        return results

    results: List[BusinessResult] = []
    for idx, card in enumerate(cards[:max_rank], start=1):
        # Anchor
        anchors = card.css("a.hfpxzc")
        anchor = anchors[0] if anchors else None
        href = anchor.attrib.get("href", "") if anchor else ""
        name = anchor.attrib.get("aria-label", "") if anchor else ""
        
        # Name fallback to headline
        if not name:
            headlines = card.css("div.fontHeadlineSmall")
            if headlines and headlines[0].text:
                name = headlines[0].text.strip()

        if not name:
            continue

        # Rating
        rating_matches = card.css("span.MW4etd")
        rating_str = rating_matches[0].text if rating_matches else None
        rating = parse_numeric_rating(rating_str)

        # Reviews Count
        reviews_matches = card.css("span.UY7F9")
        reviews_str = reviews_matches[0].text if reviews_matches else None
        reviews_count = parse_numeric_reviews(reviews_str)

        # Subtitle / Details container
        details_containers = card.css("div.W4Efsd")
        category = None
        address = None
        
        if len(details_containers) >= 1:
            # First container typically carries rating, review count, and category
            spans = details_containers[0].css("span")
            span_texts = [s.text.strip() for s in spans if s.text and s.text.strip()]
            for txt in span_texts:
                clean_txt = txt.strip(" ·\t\n")
                if clean_txt and clean_txt not in (rating_str, reviews_str):
                    category = clean_txt
                    break

        if len(details_containers) >= 2:
            # Second container typically carries address snippet and operating hours
            spans = details_containers[1].css("span")
            span_texts = [s.text.strip() for s in spans if s.text and s.text.strip()]
            for txt in span_texts:
                if any(char.isdigit() for char in txt) or "St" in txt or "Ave" in txt or "Rd" in txt or "Blvd" in txt:
                    address = txt.strip(" ·")
                    break

        cid = extract_cid_from_url(href)
        place_id = extract_place_id_from_url(href)

        results.append(
            BusinessResult(
                rank=idx,
                name=name,
                cid=cid,
                place_id=place_id,
                address=address,
                rating=rating,
                reviews_count=reviews_count,
                category=category,
                maps_url=href,
            )
        )

    return results
