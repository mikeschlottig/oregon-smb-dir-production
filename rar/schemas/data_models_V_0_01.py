"""
RAR Schema Definitions — Strict Boundaries & Provenance
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SearchSurface(str, Enum):
    """
    Search surfaces must remain strictly isolated.
    Maps Viewport observations must never be merged with Search UULE observations.
    """
    GOOGLE_MAPS_VIEWPORT = "google_maps_viewport"
    GOOGLE_SEARCH_UULE = "google_search_uule"


class FrameType(str, Enum):
    """
    Dual-Frame geometry types for RAR spatial modeling.
    """
    BUSINESS_CENTERED_POLAR = "business_centered_polar"
    MARKET_FIXED_H3 = "market_fixed_h3"


class GridPoint(BaseModel):
    """
    Canonical spatial coordinate point for a local search scan.
    """
    point_id: str = Field(..., description="Unique deterministic point identifier")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="WGS84 Latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="WGS84 Longitude")
    frame_type: FrameType = Field(..., description="Sampling frame type")
    
    # Business-Centered Polar metadata
    ring_radius_miles: Optional[float] = Field(None, ge=0.0, description="Radius from business centroid in miles")
    bearing_degrees: Optional[float] = Field(None, ge=0.0, lt=360.0, description="Bearing angle in degrees (0=N, 90=E)")
    bearing_label: Optional[str] = Field(None, description="Cardinal label (e.g. N, NE, E, SE)")
    
    # Market-Fixed H3 metadata
    h3_index: Optional[str] = Field(None, description="Uber H3 hexadecimal cell index")
    h3_resolution: Optional[int] = Field(None, ge=0, le=15, description="H3 cell resolution level")
    population_weight: float = Field(default=1.0, ge=0.0, description="Relative population/commercial density weight")

    # Surface restriction
    allowed_surface: SearchSurface = Field(
        default=SearchSurface.GOOGLE_MAPS_VIEWPORT,
        description="Strict surface target. Observations must never cross surfaces."
    )


class BusinessEntity(BaseModel):
    """
    Target business profile for calibration.
    """
    business_id: str = Field(..., description="Internal entity identifier")
    canonical_name: str
    latitude: float
    longitude: float
    cid: Optional[str] = None
    place_id: Optional[str] = None
    primary_category: Optional[str] = None


class SamplingProfile(BaseModel):
    """
    Configuration profile for generating spatial grids.
    """
    profile_id: str
    target_entity: Optional[BusinessEntity] = None
    frame_type: FrameType
    target_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT
    query_string: str
    viewport_zoom: int = Field(default=14, ge=3, le=21)
    extra_metadata: Dict[str, Any] = Field(default_factory=dict)


class AcquisitionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    ACQUISITION_FAILED = "ACQUISITION_FAILED"
    PAGE_PARSE_ERROR = "PAGE_PARSE_ERROR"
    UNRANKED_BEYOND_HORIZON = "UNRANKED_BEYOND_HORIZON"
    CHALLENGE_DETECTED = "CHALLENGE_DETECTED"


class BusinessResult(BaseModel):
    """
    Individual extracted business entity from search results.
    """
    rank: int = Field(..., ge=1, le=100, description="1-indexed rank position")
    name: str = Field(..., description="Business display name")
    cid: Optional[str] = Field(None, description="Google Customer ID / ludocid")
    place_id: Optional[str] = Field(None, description="Google Place ID")
    address: Optional[str] = Field(None, description="Physical address snippet")
    rating: Optional[float] = Field(None, ge=1.0, le=5.0, description="Average review rating")
    reviews_count: Optional[int] = Field(None, ge=0, description="Total review count")
    category: Optional[str] = Field(None, description="Primary GBP category")
    maps_url: Optional[str] = Field(None, description="Direct URL to listing")


class RawArtifactReference(BaseModel):
    """
    Cryptographically verifiable pointer to raw evidence files on disk.
    """
    html_sha256: str
    html_path: str
    screenshot_sha256: Optional[str] = None
    screenshot_path: Optional[str] = None
    timestamp: str


class RankObservation(BaseModel):
    """
    Canonical atomic ranking observation for a single coordinate pin.
    """
    observation_id: str
    scan_id: str
    point_id: str
    status: AcquisitionStatus
    requested_coordinate: tuple[float, float]
    viewport_zoom: int
    search_surface: SearchSurface = SearchSurface.GOOGLE_MAPS_VIEWPORT
    query: str
    timestamp: str
    ranked_businesses: List[BusinessResult] = Field(default_factory=list)
    artifact_ref: Optional[RawArtifactReference] = None
    censoring_horizon: int = Field(default=20, description="Max extracted rank depth")


class ScanStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED"
    ABORTED_CIRCUIT_BREAKER = "ABORTED_CIRCUIT_BREAKER"
    FAILED = "FAILED"


class ScanManifest(BaseModel):
    """
    Immutable manifest summarizing the complete multi-point geo-grid scan.
    """
    scan_id: str
    profile_id: str
    query_string: str
    target_surface: SearchSurface
    frame_type: FrameType
    status: ScanStatus
    start_time: str
    end_time: Optional[str] = None
    total_points: int
    completed_points: int = 0
    failed_points: int = 0
    manifest_sha256: Optional[str] = None
    point_ids: List[str] = Field(default_factory=list)


