"""
RAR Analysis Package — Spatial Econometrics & MPCS Analysis
"""
from rar.analysis.mpcs_engine_V_0_01 import (
    haversine_distance_miles,
    calculate_bearing_degrees,
    extract_coords_from_business,
    evaluate_mpcs_matchups,
    compute_crossover_win_rates,
    extract_distance_inversions,
    generate_head_to_head_matrix,
    MPCSAnalysisResult,
    MPCSMatchup,
    CWRRecord,
    DistanceInversionRecord,
)

__all__ = [
    "haversine_distance_miles",
    "calculate_bearing_degrees",
    "extract_coords_from_business",
    "evaluate_mpcs_matchups",
    "compute_crossover_win_rates",
    "extract_distance_inversions",
    "generate_head_to_head_matrix",
    "MPCSAnalysisResult",
    "MPCSMatchup",
    "CWRRecord",
    "DistanceInversionRecord",
]
