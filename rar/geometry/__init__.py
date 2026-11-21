"""
RAR Spatial Geometry Package
"""
from .polar_grid_V_0_01 import generate_polar_grid, geodesic_destination
from .h3_grid_V_0_01 import generate_h3_disk_grid, generate_h3_bbox_grid
from .grid_system_49_V_0_01 import (
    generate_bcrf_49,
    generate_legacy_square_7x7,
    generate_mfcf_49_hex,
    compare_grid_geometries,
    DEFAULT_BCRF49_RADII_MILES,
    COMPASS_8_BEARINGS,
)

__all__ = [
    "generate_polar_grid",
    "geodesic_destination",
    "generate_h3_disk_grid",
    "generate_h3_bbox_grid",
    "generate_bcrf_49",
    "generate_legacy_square_7x7",
    "generate_mfcf_49_hex",
    "compare_grid_geometries",
    "DEFAULT_BCRF49_RADII_MILES",
    "COMPASS_8_BEARINGS",
]
