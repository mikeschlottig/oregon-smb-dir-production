"""
Market-Fixed Competitive Frame — Uber H3 Hexagonal Tessellation
Used to measure true market-wide competitive visibility across fixed geographic points.
"""
from typing import List, Optional
import h3
from rar.schemas.data_models_V_0_01 import GridPoint, FrameType, SearchSurface


def generate_h3_disk_grid(
    center_lat: float,
    center_lng: float,
    k_rings: int = 3,
    resolution: int = 8,
    allowed_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT,
    prefix_id: str = "h3",
) -> List[GridPoint]:
    """
    Generates a Market-Fixed Hexagonal Grid around a market center point using H3 grid disks.
    
    - resolution=8: ~0.74 km^2 per hexagon (inter-cell distance ~920m) - Ideal for suburban/metro.
    - resolution=9: ~0.10 km^2 per hexagon (inter-cell distance ~350m) - Ideal for dense urban core.
    - k_rings=3: 37 hexagons (1 + 6 + 12 + 18)
    - k_rings=4: 61 hexagons
    """
    origin_cell = h3.latlng_to_cell(center_lat, center_lng, resolution)
    cells = h3.grid_disk(origin_cell, k_rings)

    grid_points: List[GridPoint] = []
    for cell in sorted(cells):
        c_lat, c_lng = h3.cell_to_latlng(cell)
        point_id = f"{prefix_id}_res{resolution}_{cell}"
        
        grid_points.append(
            GridPoint(
                point_id=point_id,
                latitude=round(c_lat, 6),
                longitude=round(c_lng, 6),
                frame_type=FrameType.MARKET_FIXED_H3,
                h3_index=cell,
                h3_resolution=resolution,
                population_weight=1.0,
                allowed_surface=allowed_surface,
            )
        )

    return grid_points


def generate_h3_bbox_grid(
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
    resolution: int = 8,
    allowed_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT,
    prefix_id: str = "h3_bbox",
) -> List[GridPoint]:
    """
    Generates a Market-Fixed Hexagonal Grid bounded by a geographic bounding box.
    """
    # GeoJSON polygon: [ [ [lng, lat], [lng, lat], ... ] ]
    polygon = [
        [
            (min_lng, min_lat),
            (max_lng, min_lat),
            (max_lng, max_lat),
            (min_lng, max_lat),
            (min_lng, min_lat),
        ]
    ]

    # h3 v4 expects LatLngPoly or list of coordinates
    cells = h3.polygon_to_cells(
        h3.LatLngPoly(
            [(min_lat, min_lng), (min_lat, max_lng), (max_lat, max_lng), (max_lat, min_lng)]
        ),
        resolution,
    )

    grid_points: List[GridPoint] = []
    for cell in sorted(cells):
        c_lat, c_lng = h3.cell_to_latlng(cell)
        point_id = f"{prefix_id}_res{resolution}_{cell}"
        
        grid_points.append(
            GridPoint(
                point_id=point_id,
                latitude=round(c_lat, 6),
                longitude=round(c_lng, 6),
                frame_type=FrameType.MARKET_FIXED_H3,
                h3_index=cell,
                h3_resolution=resolution,
                population_weight=1.0,
                allowed_surface=allowed_surface,
            )
        )

    return grid_points
