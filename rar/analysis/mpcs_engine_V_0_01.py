"""
RAR P2A Engine — Matched-Proximity Comparison Sets (MPCS) & Crossover Win Rate (CWR)
Version: 0.01
Author: Operations Orchestrator / Spatial Systems Architect

Mathematical Basis:
  1. Geodesic Distance (Haversine WGS84, Earth radius R = 3958.8 statute miles).
  2. Dual Coordinate Preservation:
       - Absolute Search Origin: S_i = (lat_i, lng_i)
       - Entity Canonical Position: B_j = (lat_j, lng_j)
       - Relative Space: D_ij = distance(S_i, B_j), Theta_ij = bearing(S_i, B_j)
  3. Matched-Proximity Comparison Sets (MPCS / Dataset C):
       Delta_d = |d_A - d_B| / ((d_A + d_B) / 2) <= tau  (default tau = 0.10)
  4. Crossover Win Rate (CWR):
       CWR_j = (Wins_j + 0.5 * Ties_j) / Total_Eligible_MPCS_Matchups_j
  5. Distance Inversion:
       A matchup where winner is strictly farther from S_i than loser:
       winner_rank < loser_rank AND winner_distance > loser_distance.
"""
from __future__ import annotations

import json
import math
import re
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


# Mean Earth radius in statute miles (WGS84 spherical approximation)
EARTH_RADIUS_MILES = 3958.7613


def haversine_distance_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Computes great-circle distance between two WGS84 points in statute miles.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    # Clip to [0, 1] for numerical stability
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_MILES * c


def calculate_bearing_degrees(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Computes initial bearing from point 1 to point 2 in degrees [0, 360).
    0 = North, 90 = East, 180 = South, 270 = West.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lng2 - lng1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)

    bearing_rad = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing_rad) + 360.0) % 360.0
    return round(bearing_deg, 2)


def extract_coords_from_business(biz: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    """
    Extracts canonical (latitude, longitude) from a business result dict.
    Supports:
      1. Direct keys ('latitude', 'longitude' or 'lat', 'lng')
      2. Google Maps URL pattern: '!3d{lat}!4d{lng}'
    """
    if "latitude" in biz and "longitude" in biz and biz["latitude"] is not None and biz["longitude"] is not None:
        return float(biz["latitude"]), float(biz["longitude"])
    if "lat" in biz and "lng" in biz and biz["lat"] is not None and biz["lng"] is not None:
        return float(biz["lat"]), float(biz["lng"])

    maps_url = biz.get("maps_url") or ""
    match = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", maps_url)
    if match:
        return float(match.group(1)), float(match.group(2))

    return None


class MPCSMatchup(BaseModel):
    """
    Atomic head-to-head comparison at a shared search origin with neutralized proximity.
    """
    origin_id: str
    origin_latitude: float
    origin_longitude: float
    entity_a_id: str
    entity_a_name: str
    entity_a_rank: int
    entity_a_dist_miles: float
    entity_a_bearing_deg: float
    entity_b_id: str
    entity_b_name: str
    entity_b_rank: int
    entity_b_dist_miles: float
    entity_b_bearing_deg: float
    delta_distance_miles: float
    relative_distance_delta: float
    rank_gap: int = Field(..., description="Rank B - Rank A. Positive means A outranks B.")
    winner_id: Optional[str] = Field(None, description="Entity ID of winner (lower rank number), or None if tied")
    winner_name: Optional[str] = None
    loser_id: Optional[str] = None
    loser_name: Optional[str] = None
    is_distance_inversion: bool = Field(
        ..., description="True if winner was strictly farther from origin than loser"
    )
    inversion_distance_gap_miles: float = 0.0


class CWRRecord(BaseModel):
    """
    Crossover Win Rate (CWR) summary record for a single competitor.
    """
    entity_id: str
    entity_name: str
    place_id: Optional[str] = None
    cid: Optional[str] = None
    total_mpcs_matchups: int
    wins: int
    ties: int
    losses: int
    crossover_win_rate: float = Field(..., ge=0.0, le=1.0)
    avg_rank: float
    avg_distance_miles: float
    avg_rank_advantage: float = Field(
        ..., description="Average rank advantage over opponent in MPCS matchups"
    )
    distance_inversion_wins: int = Field(
        default=0, description="Wins achieved when entity was farther than opponent"
    )


class DistanceInversionRecord(BaseModel):
    """
    Documented case of non-proximity dominance.
    """
    origin_id: str
    winner_id: str
    winner_name: str
    winner_rank: int
    winner_dist_miles: float
    loser_id: str
    loser_name: str
    loser_rank: int
    loser_dist_miles: float
    rank_gap: int
    distance_penalty_miles: float
    relative_distance_delta: float


class HeadToHeadRecord(BaseModel):
    """
    Pairwise head-to-head record between two specific competitors across all matched origins.
    """
    entity_a_id: str
    entity_a_name: str
    entity_b_id: str
    entity_b_name: str
    total_matchups: int
    a_wins: int
    b_wins: int
    ties: int
    a_win_rate: float
    avg_rank_gap_for_a: float


class MPCSAnalysisResult(BaseModel):
    """
    Complete analytical output of an MPCS run over a sampling grid.
    """
    scan_id: str
    niche: str
    market: str
    proximity_threshold: float
    total_search_origins: int
    total_candidate_pairs: int
    total_matched_matchups: int
    match_rate_pct: float
    total_inversion_matchups: int
    cwr_leaderboard: List[CWRRecord]
    distance_inversions: List[DistanceInversionRecord]
    head_to_head_showdowns: List[HeadToHeadRecord]


def evaluate_mpcs_matchups(
    rankgrid_data: Dict[str, Any],
    threshold: float = 0.10,
    max_rank_cutoff: int = 20,
) -> Tuple[List[MPCSMatchup], int]:
    """
    Parses a rankgrid dictionary (e.g. Medford Extended Rankgrid), resolves
    business coordinates, computes pairwise proximity deltas, and extracts
    all valid MPCS matchups.

    Returns:
      (matched_pairs, total_candidate_pairs)
    """
    grid_points = rankgrid_data.get("grid_points", [])
    matched_matchups: List[MPCSMatchup] = []
    total_candidates = 0

    for pt in grid_points:
        origin_id = pt.get("point_id", "origin")
        origin_lat = float(pt.get("latitude", 0.0))
        origin_lng = float(pt.get("longitude", 0.0))

        raw_businesses = pt.get("ranked_businesses", [])
        # Filter businesses with rank <= max_rank_cutoff
        ranked_list = [b for b in raw_businesses if b.get("rank", 999) <= max_rank_cutoff]

        # Resolve coordinates for all businesses at this pin
        resolved_entities = []
        for b in ranked_list:
            coords = extract_coords_from_business(b)
            if coords is None:
                continue
            b_lat, b_lng = coords
            dist = haversine_distance_miles(origin_lat, origin_lng, b_lat, b_lng)
            bearing = calculate_bearing_degrees(origin_lat, origin_lng, b_lat, b_lng)
            entity_key = b.get("place_id") or b.get("cid") or b.get("name")
            resolved_entities.append({
                "entity_id": entity_key,
                "name": b.get("name", "Unknown"),
                "place_id": b.get("place_id"),
                "cid": b.get("cid"),
                "rank": int(b.get("rank", 99)),
                "latitude": b_lat,
                "longitude": b_lng,
                "distance_miles": dist,
                "bearing_deg": bearing,
            })

        # Pairwise comparison: N * (N - 1) / 2
        num_entities = len(resolved_entities)
        for i in range(num_entities):
            for j in range(i + 1, num_entities):
                total_candidates += 1
                ent_a = resolved_entities[i]
                ent_b = resolved_entities[j]

                d_a = ent_a["distance_miles"]
                d_b = ent_b["distance_miles"]

                mean_dist = (d_a + d_b) / 2.0
                if mean_dist < 1e-6:
                    delta_d = 0.0
                else:
                    delta_d = abs(d_a - d_b) / mean_dist

                # Condition for Matched-Proximity Comparison Set: Delta_d <= threshold
                if delta_d <= threshold:
                    # Rank comparison: lower rank number is superior
                    rank_a = ent_a["rank"]
                    rank_b = ent_b["rank"]
                    rank_gap = rank_b - rank_a  # Positive means A is ranked higher (e.g. 1 - 5 -> gap +4)

                    winner_id = None
                    winner_name = None
                    loser_id = None
                    loser_name = None
                    is_inversion = False
                    inversion_gap = 0.0

                    if rank_a < rank_b:
                        winner_id = ent_a["entity_id"]
                        winner_name = ent_a["name"]
                        loser_id = ent_b["entity_id"]
                        loser_name = ent_b["name"]
                        if d_a > d_b:
                            is_inversion = True
                            inversion_gap = d_a - d_b
                    elif rank_b < rank_a:
                        winner_id = ent_b["entity_id"]
                        winner_name = ent_b["name"]
                        loser_id = ent_a["entity_id"]
                        loser_name = ent_a["name"]
                        if d_b > d_a:
                            is_inversion = True
                            inversion_gap = d_b - d_a

                    matchup = MPCSMatchup(
                        origin_id=origin_id,
                        origin_latitude=origin_lat,
                        origin_longitude=origin_lng,
                        entity_a_id=ent_a["entity_id"],
                        entity_a_name=ent_a["name"],
                        entity_a_rank=rank_a,
                        entity_a_dist_miles=round(d_a, 3),
                        entity_a_bearing_deg=ent_a["bearing_deg"],
                        entity_b_id=ent_b["entity_b_id"] if "entity_b_id" in ent_b else ent_b["entity_id"],
                        entity_b_name=ent_b["name"],
                        entity_b_rank=rank_b,
                        entity_b_dist_miles=round(d_b, 3),
                        entity_b_bearing_deg=ent_b["bearing_deg"],
                        delta_distance_miles=round(abs(d_a - d_b), 4),
                        relative_distance_delta=round(delta_d, 4),
                        rank_gap=rank_gap,
                        winner_id=winner_id,
                        winner_name=winner_name,
                        loser_id=loser_id,
                        loser_name=loser_name,
                        is_distance_inversion=is_inversion,
                        inversion_distance_gap_miles=round(inversion_gap, 4),
                    )
                    matched_matchups.append(matchup)

    return matched_matchups, total_candidates


def compute_crossover_win_rates(
    matchups: List[MPCSMatchup],
    min_matchups: int = 1,
) -> List[CWRRecord]:
    """
    Aggregates Crossover Win Rate (CWR) across all eligible MPCS matchups.
    CWR = (Wins + 0.5 * Ties) / Total_Matchups
    """
    stats: Dict[str, Dict[str, Any]] = {}

    for m in matchups:
        # Process Entity A
        if m.entity_a_id not in stats:
            stats[m.entity_a_id] = {
                "name": m.entity_a_name,
                "total": 0,
                "wins": 0,
                "ties": 0,
                "losses": 0,
                "ranks": [],
                "distances": [],
                "rank_advantages": [],
                "inversion_wins": 0,
            }
        stats[m.entity_a_id]["total"] += 1
        stats[m.entity_a_id]["ranks"].append(m.entity_a_rank)
        stats[m.entity_a_id]["distances"].append(m.entity_a_dist_miles)
        stats[m.entity_a_id]["rank_advantages"].append(m.rank_gap)

        if m.winner_id == m.entity_a_id:
            stats[m.entity_a_id]["wins"] += 1
            if m.is_distance_inversion:
                stats[m.entity_a_id]["inversion_wins"] += 1
        elif m.winner_id is None:
            stats[m.entity_a_id]["ties"] += 1
        else:
            stats[m.entity_a_id]["losses"] += 1

        # Process Entity B
        if m.entity_b_id not in stats:
            stats[m.entity_b_id] = {
                "name": m.entity_b_name,
                "total": 0,
                "wins": 0,
                "ties": 0,
                "losses": 0,
                "ranks": [],
                "distances": [],
                "rank_advantages": [],
                "inversion_wins": 0,
            }
        stats[m.entity_b_id]["total"] += 1
        stats[m.entity_b_id]["ranks"].append(m.entity_b_rank)
        stats[m.entity_b_id]["distances"].append(m.entity_b_dist_miles)
        stats[m.entity_b_id]["rank_advantages"].append(-m.rank_gap)

        if m.winner_id == m.entity_b_id:
            stats[m.entity_b_id]["wins"] += 1
            if m.is_distance_inversion:
                stats[m.entity_b_id]["inversion_wins"] += 1
        elif m.winner_id is None:
            stats[m.entity_b_id]["ties"] += 1
        else:
            stats[m.entity_b_id]["losses"] += 1

    records: List[CWRRecord] = []
    for ent_id, d in stats.items():
        if d["total"] < min_matchups:
            continue
        cwr = (d["wins"] + 0.5 * d["ties"]) / float(d["total"])
        avg_r = sum(d["ranks"]) / float(len(d["ranks"]))
        avg_dist = sum(d["distances"]) / float(len(d["distances"]))
        avg_adv = sum(d["rank_advantages"]) / float(len(d["rank_advantages"]))

        records.append(
            CWRRecord(
                entity_id=ent_id,
                entity_name=d["name"],
                total_mpcs_matchups=d["total"],
                wins=d["wins"],
                ties=d["ties"],
                losses=d["losses"],
                crossover_win_rate=round(cwr, 4),
                avg_rank=round(avg_r, 2),
                avg_distance_miles=round(avg_dist, 2),
                avg_rank_advantage=round(avg_adv, 2),
                distance_inversion_wins=d["inversion_wins"],
            )
        )

    # Sort leaderboard: CWR descending, then total matchups descending
    records.sort(key=lambda r: (r.crossover_win_rate, r.total_mpcs_matchups, r.avg_rank_advantage), reverse=True)
    return records


def extract_distance_inversions(matchups: List[MPCSMatchup]) -> List[DistanceInversionRecord]:
    """
    Extracts all instances where a business won despite being farther away than its competitor.
    Sorted by rank gap descending, then distance penalty descending.
    """
    inversions = []
    for m in matchups:
        if m.is_distance_inversion and m.winner_id is not None:
            # Determine which entity was winner
            if m.winner_id == m.entity_a_id:
                w_id, w_name, w_rank, w_dist = m.entity_a_id, m.entity_a_name, m.entity_a_rank, m.entity_a_dist_miles
                l_id, l_name, l_rank, l_dist = m.entity_b_id, m.entity_b_name, m.entity_b_rank, m.entity_b_dist_miles
                rg = m.rank_gap
            else:
                w_id, w_name, w_rank, w_dist = m.entity_b_id, m.entity_b_name, m.entity_b_rank, m.entity_b_dist_miles
                l_id, l_name, l_rank, l_dist = m.entity_a_id, m.entity_a_name, m.entity_a_rank, m.entity_a_dist_miles
                rg = -m.rank_gap

            inversions.append(
                DistanceInversionRecord(
                    origin_id=m.origin_id,
                    winner_id=w_id,
                    winner_name=w_name,
                    winner_rank=w_rank,
                    winner_dist_miles=w_dist,
                    loser_id=l_id,
                    loser_name=l_name,
                    loser_rank=l_rank,
                    loser_dist_miles=l_dist,
                    rank_gap=rg,
                    distance_penalty_miles=round(w_dist - l_dist, 4),
                    relative_distance_delta=m.relative_distance_delta,
                )
            )

    inversions.sort(key=lambda x: (x.rank_gap, x.distance_penalty_miles), reverse=True)
    return inversions


def generate_head_to_head_matrix(
    matchups: List[MPCSMatchup],
    target_entity_ids: Optional[List[str]] = None,
) -> List[HeadToHeadRecord]:
    """
    Computes pairwise records between competitors who met under matched proximity.
    """
    pair_stats: Dict[Tuple[str, str], Dict[str, Any]] = {}

    for m in matchups:
        id_a, name_a = m.entity_a_id, m.entity_a_name
        id_b, name_b = m.entity_b_id, m.entity_b_name

        # Enforce canonical ordering (lexicographical) for pair key
        if id_a <= id_b:
            pair_key = (id_a, id_b)
            canonical_a_is_a = True
            n_a, n_b = name_a, name_b
        else:
            pair_key = (id_b, id_a)
            canonical_a_is_a = False
            n_a, n_b = name_b, name_a

        if pair_key not in pair_stats:
            pair_stats[pair_key] = {
                "name_a": n_a,
                "name_b": n_b,
                "total": 0,
                "a_wins": 0,
                "b_wins": 0,
                "ties": 0,
                "rank_gaps_for_a": [],
            }

        ps = pair_stats[pair_key]
        ps["total"] += 1

        if m.winner_id is None:
            ps["ties"] += 1
            ps["rank_gaps_for_a"].append(0)
        elif (m.winner_id == id_a and canonical_a_is_a) or (m.winner_id == id_b and not canonical_a_is_a):
            ps["a_wins"] += 1
            gap = m.rank_gap if canonical_a_is_a else -m.rank_gap
            ps["rank_gaps_for_a"].append(gap)
        else:
            ps["b_wins"] += 1
            gap = -m.rank_gap if canonical_a_is_a else m.rank_gap
            ps["rank_gaps_for_a"].append(gap)

    records: List[HeadToHeadRecord] = []
    for (id_a, id_b), s in pair_stats.items():
        if target_entity_ids and (id_a not in target_entity_ids and id_b not in target_entity_ids):
            continue
        tot = s["total"]
        a_wr = (s["a_wins"] + 0.5 * s["ties"]) / float(tot)
        avg_gap = sum(s["rank_gaps_for_a"]) / float(tot)
        records.append(
            HeadToHeadRecord(
                entity_a_id=id_a,
                entity_a_name=s["name_a"],
                entity_b_id=id_b,
                entity_b_name=s["name_b"],
                total_matchups=tot,
                a_wins=s["a_wins"],
                b_wins=s["b_wins"],
                ties=s["ties"],
                a_win_rate=round(a_wr, 4),
                avg_rank_gap_for_a=round(avg_gap, 2),
            )
        )

    records.sort(key=lambda r: r.total_matchups, reverse=True)
    return records


def run_full_mpcs_analysis(
    rankgrid_data: Dict[str, Any],
    threshold: float = 0.10,
    max_rank_cutoff: int = 20,
) -> MPCSAnalysisResult:
    """
    End-to-end execution function that takes raw rankgrid JSON data and outputs
    a fully calculated MPCSAnalysisResult with leaderboard, inversions, and showdowns.
    """
    scan_id = rankgrid_data.get("scan_id", "scan_unknown")
    niche = rankgrid_data.get("niche", "unknown_niche")
    market = rankgrid_data.get("market", "unknown_market")
    total_pins = len(rankgrid_data.get("grid_points", []))

    matched_matchups, total_candidates = evaluate_mpcs_matchups(
        rankgrid_data=rankgrid_data,
        threshold=threshold,
        max_rank_cutoff=max_rank_cutoff,
    )

    match_rate = (len(matched_matchups) / float(total_candidates) * 100.0) if total_candidates > 0 else 0.0

    cwr_leaderboard = compute_crossover_win_rates(matched_matchups)
    inversions = extract_distance_inversions(matched_matchups)
    top_entity_ids = [c.entity_id for c in cwr_leaderboard[:10]]
    showdowns = generate_head_to_head_matrix(matched_matchups, target_entity_ids=top_entity_ids)

    return MPCSAnalysisResult(
        scan_id=scan_id,
        niche=niche,
        market=market,
        proximity_threshold=threshold,
        total_search_origins=total_pins,
        total_candidate_pairs=total_candidates,
        total_matched_matchups=len(matched_matchups),
        match_rate_pct=round(match_rate, 2),
        total_inversion_matchups=len(inversions),
        cwr_leaderboard=cwr_leaderboard,
        distance_inversions=inversions,
        head_to_head_showdowns=showdowns,
    )
