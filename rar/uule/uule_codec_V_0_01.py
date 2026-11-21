"""
Google UULE Protocol Codec — Exact Coordinate & Canonical Name Encoders
Encodes and decodes Google location emulation parameters with strict surface boundary controls.
"""
import base64
import time
from typing import Dict, Any, Optional
from rar.schemas.data_models_V_0_01 import SearchSurface

# UULE length mapping table for canonical names (w+ format)
# Maps string length to Google's Base64 key character
UULE_SECRET_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"


class SurfaceBoundaryError(ValueError):
    """Raised when an attempt is made to mix UULE with Google Maps Viewport workflows."""
    pass


def encode_exact_coordinate_uule(
    latitude: float,
    longitude: float,
    radius_meters: int = -1,
    timestamp_micros: Optional[int] = None,
    role: int = 1,
    producer: int = 12,
    provenance: int = 6,
) -> str:
    """
    Encodes exact WGS84 coordinates into Google's undocumented text-protobuf UULE format (Version 2 / 'a+').
    
    Structure:
      role: 1
      producer: 12
      provenance: 6
      timestamp: <microseconds since epoch>
      latlng {
        latitude_e7: <int>
        longitude_e7: <int>
      }
      radius: <int> (-1 for exact point)
    """
    if not (-90.0 <= latitude <= 90.0):
        raise ValueError(f"Invalid latitude {latitude}. Must be between -90 and 90.")
    if not (-180.0 <= longitude <= 180.0):
        raise ValueError(f"Invalid longitude {longitude}. Must be between -180 and 180.")

    if timestamp_micros is None:
        timestamp_micros = int(time.time() * 1_000_000)

    lat_e7 = int(round(latitude * 10_000_000))
    lng_e7 = int(round(longitude * 10_000_000))

    # Construct the exact ASCII protobuf string
    proto_lines = [
        f"role:{role}",
        f"producer:{producer}",
        f"provenance:{provenance}",
        f"timestamp:{timestamp_micros}",
        "latlng{",
        f"latitude_e7:{lat_e7}",
        f"longitude_e7:{lng_e7}",
        "}",
        f"radius:{radius_meters}\n",
    ]
    raw_ascii = "\n".join(proto_lines)

    # Base64 encode without padding and prepend 'a+'
    b64 = base64.b64encode(raw_ascii.encode("utf-8")).decode("ascii").rstrip("=")
    return f"a+{b64}"


def decode_exact_coordinate_uule(uule_str: str) -> Dict[str, Any]:
    """
    Decodes an exact-coordinate UULE string (prefixed with 'a+') back into structured fields.
    """
    if not uule_str.startswith("a+"):
        raise ValueError("Invalid exact coordinate UULE. Expected prefix 'a+'.")

    b64_part = uule_str[2:]
    # Add padding if needed
    missing_padding = len(b64_part) % 4
    if missing_padding != 0:
        b64_part += "=" * (4 - missing_padding)

    raw_text = base64.b64decode(b64_part).decode("utf-8")
    
    parsed: Dict[str, Any] = {}
    for line in raw_text.splitlines():
        line = line.strip()
        if not line or line in ("latlng{", "}"):
            continue
        if ":" in line:
            k, v = line.split(":", 1)
            parsed[k.strip()] = int(v.strip())

    if "latitude_e7" in parsed and "longitude_e7" in parsed:
        parsed["latitude"] = round(parsed["latitude_e7"] / 10_000_000.0, 6)
        parsed["longitude"] = round(parsed["longitude_e7"] / 10_000_000.0, 6)

    return parsed


def encode_canonical_uule(canonical_name: str) -> str:
    """
    Encodes a Google Ads canonical geotarget name into UULE format (Version 1 / 'w+').
    E.g. 'Austin,Texas,United States' -> 'w+CAIQICI...'
    """
    length = len(canonical_name)
    if length >= len(UULE_SECRET_TABLE):
        raise ValueError(f"Canonical name exceeds maximum length: {length}")
    
    key = UULE_SECRET_TABLE[length]
    b64_name = base64.b64encode(canonical_name.encode("utf-8")).decode("ascii")
    return f"w+CAIQICI{key}{b64_name}"


def decode_canonical_uule(uule_str: str) -> str:
    """
    Decodes a canonical name UULE string (prefixed with 'w+') back to place name.
    """
    if not uule_str.startswith("w+CAIQICI"):
        raise ValueError("Invalid canonical UULE. Expected prefix 'w+CAIQICI'.")

    # The character immediately after w+CAIQICI is the length key
    b64_part = uule_str[10:]
    return base64.b64decode(b64_part).decode("utf-8")


def enforce_surface_boundary(surface: SearchSurface, uule_str: Optional[str] = None):
    """
    Validates that UULE parameters are NEVER mixed into Google Maps Viewport datasets.
    """
    if surface == SearchSurface.GOOGLE_MAPS_VIEWPORT and uule_str is not None:
        raise SurfaceBoundaryError(
            "CRITICAL DATASET BOUNDARY VIOLATION: Google Maps Viewport datasets "
            "must rely exclusively on explicit URL viewports (/@lat,lng,zoom). "
            "Injecting UULE into Google Maps causes mixed spatial heuristics."
        )
    if surface == SearchSurface.GOOGLE_SEARCH_UULE and uule_str is None:
        raise SurfaceBoundaryError(
            "CRITICAL DATASET BOUNDARY VIOLATION: Google Search datasets "
            "must provide an exact coordinate UULE parameter (uule=a+...) to ensure "
            "server-side spatial targeting without IP geo leakage."
        )
