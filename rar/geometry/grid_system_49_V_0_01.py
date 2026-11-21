"""
RAR P2A 49-Point Grid Geometry Systems — Version 0.01
Author: Operations Orchestrator / Spatial Systems Architect

Formalizes the 49-point geo-grid specifications defined in the RAR Research Report:
  1. BCRF-49 (Business-Centered Relative Frame):
     - 49-point Logarithmic Radial Rings (1 Center + 6 Rings x 8 Bearings).
     - Designed to replace the naive 7x7 square grid for distance-decay modeling.
     - Radii: 0.0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0 statute miles.
  2. Legacy Square 7x7:
     - Conventional 49-point Cartesian lattice (Local Falcon / Whitespark style).
     - Used for comparative baseline testing and legacy heatmap rendering.
  3. MFCF-49-Hex (Market-Fixed Competitive Frame):
     - 49-point Hexagonal tessellation providing uniform 6-neighbor isotropy across the market.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from rar.schemas.data_models_V_0_01 import GridPoint, FrameType, SearchSurface
from rar.geometry.polar_grid_V_0_01 import geodesic_destination, EARTH_RADIUS_MILES
from rar.analysis.mpcs_engine_V_0_01 import haversine_distance_miles, calculate_bearing_degrees


# Canonical 8-point compass bearings (45-degree intervals)
COMPASS_8_BEARINGS = [
    (0.0, "N"),
    (45.0, "NE"),
    (90.0, "E"),
    (135.0, "SE"),
    (180.0, "S"),
    (225.0, "SW"),
    (270.0, "W"),
    (315.0, "NW"),
]

# Canonical BCRF-49 radii progression: r_k = 0.25 * 2^(k-1)
DEFAULT_BCRF49_RADII_MILES = [0.0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0]


def generate_bcrf_49(
    center_lat: float,
    center_lng: float,
    radii_miles: Optional[List[float]] = None,
    allowed_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT,
    prefix_id: str = "bcrf49",
) -> List[GridPoint]:
    """
    Constructs the canonical RAR BCRF-49 Business-Centered Relative Frame:
      - 1 Centroid (r = 0.0 mi)
      - 6 Logarithmic Concentric Rings (0.25, 0.5, 1.0, 2.0, 4.0, 8.0 mi)
      - 8 Cardinal/Ordinal Bearings per ring
      - Exactly 1 + (6 * 8) = 49 Points.
    """
    if radii_miles is None:
        radii_miles = DEFAULT_BCRF49_RADII_MILES

    points: List[GridPoint] = []

    # Ring 0: Center (Point 1)
    points.append(
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

    # Rings 1 to 6: 8 bearings each (48 Points)
    non_zero_radii = [r for r in radii_miles if r > 0.0]
    for r in non_zero_radii:
        for deg, lbl in COMPASS_8_BEARINGS:
            dest_lat, dest_lng = geodesic_destination(center_lat, center_lng, r, deg)
            points.append(
                GridPoint(
                    point_id=f"{prefix_id}_r{r:.2f}_{lbl}",
                    latitude=dest_lat,
                    longitude=dest_lng,
                    frame_type=FrameType.BUSINESS_CENTERED_POLAR,
                    ring_radius_miles=r,
                    bearing_degrees=deg,
                    bearing_label=lbl,
                    population_weight=round(1.0 / (1.0 + 0.15 * r), 3),
                    allowed_surface=allowed_surface,
                )
            )

    if len(points) != 49:
        raise ValueError(f"BCRF-49 contract violated: Expected 49 points, generated {len(points)}")

    return points


def generate_legacy_square_7x7(
    center_lat: float,
    center_lng: float,
    step_miles: float = 1.0,
    allowed_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT,
    prefix_id: str = "sq49",
) -> List[GridPoint]:
    """
    Constructs a conventional 7x7 Cartesian lattice (49 points) as used in legacy local SEO tools.
    Grid index offsets: row, col in [-3, -2, -1, 0, 1, 2, 3].
    """
    points: List[GridPoint] = []
    offsets = [-3, -2, -1, 0, 1, 2, 3]

    for row_idx, r_offset in enumerate(offsets):
        # North-South delta: row offset * step_miles
        north_dist = r_offset * step_miles
        for col_idx, c_offset in enumerate(offsets):
            # East-West delta: col offset * step_miles
            east_dist = c_offset * step_miles

            # Flat-to-geodesic conversion around center
            # 1 degree latitude = ~69.0 statute miles
            delta_lat = north_dist / 69.047
            # 1 degree longitude = ~69.0 * cos(lat) statute miles
            cos_lat = math.cos(math.radians(center_lat))
            delta_lng = east_dist / (69.047 * cos_lat) if abs(cos_lat) > 1e-6 else 0.0

            pt_lat = round(center_lat + delta_lat, 6)
            pt_lng = round(center_lng + delta_lng, 6)

            # Compute true geodesic distance and bearing from center
            dist_from_center = haversine_distance_miles(center_lat, center_lng, pt_lat, pt_lng)
            bearing_from_center = calculate_bearing_degrees(center_lat, center_lng, pt_lat, pt_lng)

            # Check if corner point (max distance)
            is_corner = abs(r_offset) == 3 and abs(c_offset) == 3

            points.append(
                GridPoint(
                    point_id=f"{prefix_id}_row{row_idx+1}_col{col_idx+1}",
                    latitude=pt_lat,
                    longitude=pt_lng,
                    frame_type=FrameType.BUSINESS_CENTERED_POLAR,
                    ring_radius_miles=round(dist_from_center, 3),
                    bearing_degrees=bearing_from_center,
                    bearing_label=f"R{r_offset:+d}_C{c_offset:+d}",
                    population_weight=1.0,
                    allowed_surface=allowed_surface,
                )
            )

    if len(points) != 49:
        raise ValueError(f"Square-49 contract violated: Expected 49 points, generated {len(points)}")

    return points


def generate_mfcf_49_hex(
    center_lat: float,
    center_lng: float,
    spacing_miles: float = 0.75,
    allowed_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT,
    prefix_id: str = "mfcf49_hex",
) -> List[GridPoint]:
    """
    Constructs a 49-point Market-Fixed Hexagonal Frame (MFCF-49-Hex):
      - Ring 0: Centroid (1 point)
      - Ring 1: 6 vertices at radius 1 * spacing
      - Ring 2: 12 points (6 vertices + 6 edge midpoints) at radius 2 * spacing
      - Ring 3: 18 points (6 vertices + 12 edge points) at radius 3 * spacing
      - Ring 4 perimeter subset: 12 points at radius 4 * spacing
      - Total: 1 + 6 + 12 + 18 + 12 = 49 points.
    """
    points: List[GridPoint] = [
        GridPoint(
            point_id=f"{prefix_id}_r0_center",
            latitude=round(center_lat, 6),
            longitude=round(center_lng, 6),
            frame_type=FrameType.MARKET_FIXED_H3,
            ring_radius_miles=0.0,
            bearing_degrees=0.0,
            bearing_label="CENTER",
            population_weight=1.0,
            allowed_surface=allowed_surface,
        )
    ]

    # Ring 1: 6 points (60 deg increments)
    for i in range(6):
        deg = i * 60.0
        lat, lng = geodesic_destination(center_lat, center_lng, spacing_miles, deg)
        points.append(
            GridPoint(
                point_id=f"{prefix_id}_r1_p{i+1}",
                latitude=lat,
                longitude=lng,
                frame_type=FrameType.MARKET_FIXED_H3,
                ring_radius_miles=round(spacing_miles, 3),
                bearing_degrees=deg,
                bearing_label=f"R1_{deg:.0f}",
                population_weight=0.9,
                allowed_surface=allowed_surface,
            )
        )

    # Ring 2: 12 points (30 deg increments)
    for i in range(12):
        deg = i * 30.0
        r_dist = spacing_miles * 2.0 if (i % 2 == 0) else spacing_miles * math.sqrt(3)
        lat, lng = geodesic_destination(center_lat, center_lng, r_dist, deg)
        points.append(
            GridPoint(
                point_id=f"{prefix_id}_r2_p{i+1}",
                latitude=lat,
                longitude=lng,
                frame_type=FrameType.MARKET_FIXED_H3,
                ring_radius_miles=round(r_dist, 3),
                bearing_degrees=deg,
                bearing_label=f"R2_{deg:.0f}",
                population_weight=0.8,
                allowed_surface=allowed_surface,
            )
        )

    # Ring 3: 18 points (20 deg increments)
    for i in range(18):
        deg = i * 20.0
        r_dist = spacing_miles * 3.0
        lat, lng = geodesic_destination(center_lat, center_lng, r_dist, deg)
        points.append(
            GridPoint(
                point_id=f"{prefix_id}_r3_p{i+1}",
                latitude=lat,
                longitude=lng,
                frame_type=FrameType.MARKET_FIXED_H3,
                ring_radius_miles=round(r_dist, 3),
                bearing_degrees=deg,
                bearing_label=f"R3_{deg:.0f}",
                population_weight=0.7,
                allowed_surface=allowed_surface,
            )
        )

    # Ring 4: 12 perimeter points (30 deg increments) to complete exactly 49 points
    for i in range(12):
        deg = i * 30.0
        r_dist = spacing_miles * 4.0
        lat, lng = geodesic_destination(center_lat, center_lng, r_dist, deg)
        points.append(
            GridPoint(
                point_id=f"{prefix_id}_r4_p{i+1}",
                latitude=lat,
                longitude=lng,
                frame_type=FrameType.MARKET_FIXED_H3,
                ring_radius_miles=round(r_dist, 3),
                bearing_degrees=deg,
                bearing_label=f"R4_{deg:.0f}",
                population_weight=0.6,
                allowed_surface=allowed_surface,
            )
        )

    if len(points) != 49:
        raise ValueError(f"MFCF-49-Hex contract violated: Expected 49 points, generated {len(points)}")

    return points


def compare_grid_geometries(
    center_lat: float,
    center_lng: float,
    square_step_miles: float = 1.0,
    bcrf_radii: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Computes rigorous spatial econometric diagnostics comparing:
      1. Legacy Square 7x7 (49 points)
      2. BCRF-49 Logarithmic Radial Rings (49 points)
      3. MFCF-49 Hexagonal Lattice (49 points)
    """
    sq_pts = generate_legacy_square_7x7(center_lat, center_lng, step_miles=square_step_miles)
    bcrf_pts = generate_bcrf_49(center_lat, center_lng, radii_miles=bcrf_radii)
    hex_pts = generate_mfcf_49_hex(center_lat, center_lng, spacing_miles=square_step_miles * 0.75)

    def stats_for_points(pts: List[GridPoint]) -> Dict[str, Any]:
        dists = sorted([p.ring_radius_miles for p in pts if p.ring_radius_miles is not None])
        n = len(dists)
        mean_d = sum(dists) / float(n)
        variance = sum((x - mean_d) ** 2 for x in dists) / float(n)
        std_d = math.sqrt(variance)

        # Near field: dist <= 1.0 mile
        near_field_count = sum(1 for d in dists if d <= 1.0)
        # Mid field: 1.0 < dist <= 4.0 miles
        mid_field_count = sum(1 for d in dists if 1.0 < d <= 4.0)
        # Far field: dist > 4.0 miles
        far_field_count = sum(1 for d in dists if d > 4.0)

        return {
            "total_points": n,
            "min_distance_mi": round(min(dists), 3),
            "p25_distance_mi": round(dists[int(n * 0.25)], 3),
            "median_distance_mi": round(dists[int(n * 0.50)], 3),
            "p75_distance_mi": round(dists[int(n * 0.75)], 3),
            "max_distance_mi": round(max(dists), 3),
            "mean_distance_mi": round(mean_d, 3),
            "std_distance_mi": round(std_d, 3),
            "corner_distortion_ratio": round(max(dists) / dists[int(n * 0.75)], 3) if dists[int(n * 0.75)] > 0 else 1.0,
            "near_field_samples_pct": round(near_field_count / float(n) * 100.0, 1),
            "mid_field_samples_pct": round(mid_field_count / float(n) * 100.0, 1),
            "far_field_samples_pct": round(far_field_count / float(n) * 100.0, 1),
        }

    return {
        "metadata": {
            "center_lat": center_lat,
            "center_lng": center_lng,
            "sample_size": 49,
        },
        "legacy_square_7x7": stats_for_points(sq_pts),
        "bcrf_49_logarithmic": stats_for_points(bcrf_pts),
        "mfcf_49_hexagonal": stats_for_points(hex_pts),
    }
