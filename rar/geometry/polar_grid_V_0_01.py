"""
Business-Centered Calibration Frame — Logarithmic Polar Rings
Used to measure spatial rank decay as distance increases from a canonical business address.
"""
import math
from typing import List, Optional
from rar.schemas.data_models_V_0_01 import GridPoint, FrameType, SearchSurface

# Earth mean radius in miles
EARTH_RADIUS_MILES = 3958.7613

DEFAULT_RADII_MILES = [0.0, 0.5, 1.0, 2.0, 4.0, 8.0]

CARDINAL_BEARINGS = [
    (0.0, "N"),
    (45.0, "NE"),
    (90.0, "E"),
    (135.0, "SE"),
    (180.0, "S"),
    (225.0, "SW"),
    (270.0, "W"),
    (315.0, "NW"),
]


def geodesic_destination(
    lat: float,
    lng: float,
    distance_miles: float,
    bearing_degrees: float,
) -> tuple[float, float]:
    """
    Calculate destination coordinates given a starting point, distance (miles), and bearing (degrees).
    Uses the spherical forward geodesic formula.
    """
    if distance_miles == 0.0:
        return round(lat, 6), round(lng, 6)

    lat_rad = math.radians(lat)
    lng_rad = math.radians(lng)
    bearing_rad = math.radians(bearing_degrees)
    d_div_r = distance_miles / EARTH_RADIUS_MILES

    dest_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(d_div_r)
        + math.cos(lat_rad) * math.sin(d_div_r) * math.cos(bearing_rad)
    )

    dest_lng_rad = lng_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(d_div_r) * math.cos(lat_rad),
        math.cos(d_div_r) - math.sin(lat_rad) * math.sin(dest_lat_rad),
    )

    # Normalize longitude to [-180, 180]
    dest_lng_deg = (math.degrees(dest_lng_rad) + 540) % 360 - 180
    dest_lat_deg = math.degrees(dest_lat_rad)

    return round(dest_lat_deg, 6), round(dest_lng_deg, 6)


def generate_polar_grid(
    center_lat: float,
    center_lng: float,
    radii_miles: Optional[List[float]] = None,
    bearings: Optional[List[tuple[float, str]]] = None,
    allowed_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT,
    prefix_id: str = "polar",
) -> List[GridPoint]:
    """
    Generates a Business-Centered Calibration Grid using logarithmic polar rings.
    
    Default configuration:
    - 6 concentric rings: 0.0, 0.5, 1.0, 2.0, 4.0, 8.0 miles
    - 8 cardinal/ordinal directions: N, NE, E, SE, S, SW, W, NW
    - Total points: 1 (centroid) + 5 rings * 8 bearings = 41 points
    """
    if radii_miles is None:
        radii_miles = DEFAULT_RADII_MILES
    if bearings is None:
        bearings = CARDINAL_BEARINGS

    grid_points: List[GridPoint] = []

    for r_idx, r in enumerate(radii_miles):
        if r == 0.0:
            # Centroid point (Ring 0)
            grid_points.append(
                GridPoint(
                    point_id=f"{prefix_id}_r0.0_centroid",
                    latitude=round(center_lat, 6),
                    longitude=round(center_lng, 6),
                    frame_type=FrameType.BUSINESS_CENTERED_POLAR,
                    ring_radius_miles=0.0,
                    bearing_degrees=0.0,
                    bearing_label="CENTER",
                    population_weight=1.0,
                    allowed_surface=allowed_surface,
                )
            )
            continue

        for bearing_deg, label in bearings:
            p_lat, p_lng = geodesic_destination(center_lat, center_lng, r, bearing_deg)
            point_id = f"{prefix_id}_r{r:.1f}_{label}"
            
            grid_points.append(
                GridPoint(
                    point_id=point_id,
                    latitude=p_lat,
                    longitude=p_lng,
                    frame_type=FrameType.BUSINESS_CENTERED_POLAR,
                    ring_radius_miles=r,
                    bearing_degrees=bearing_deg,
                    bearing_label=label,
                    population_weight=1.0,
                    allowed_surface=allowed_surface,
                )
            )

    return grid_points
