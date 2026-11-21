"""
Generic HTTP_Proxy Rotation Adapter
Provides flexible proxy pooling, sticky session mapping, region matching, and health tracking.
Supports Generic HTTP proxies, Bright Data residential formatting, and Cloudflare datacenter endpoints.
"""
from enum import Enum
import time
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class ProxyType(str, Enum):
    GENERIC_HTTP = "generic_http"
    BRIGHT_DATA_RESIDENTIAL = "bright_data_residential"
    CLOUDFLARE_DATACENTER = "cloudflare_datacenter"


class ProxyNode(BaseModel):
    """
    Represents an egress proxy connection endpoint.
    """
    node_id: str
    proxy_url: str = Field(..., description="Fully qualified proxy URL: http://user:pass@host:port")
    proxy_type: ProxyType = ProxyType.GENERIC_HTTP
    region_tag: Optional[str] = Field(None, description="ISO Country / Region code, e.g. US-TX or US-CA")
    is_healthy: bool = True
    failure_count: int = 0
    max_consecutive_failures: int = 3
    quarantine_until: float = 0.0
    last_used: float = 0.0


class ProxyRotationManager:
    """
    Manages a pool of HTTP proxies with round-robin rotation, health quarantine, and sticky sessions.
    """
    def __init__(self, nodes: Optional[List[ProxyNode]] = None):
        self._nodes: Dict[str, ProxyNode] = {}
        self._index: int = 0
        self._sticky_sessions: Dict[str, str] = {}  # session_id -> node_id

        if nodes:
            for n in nodes:
                self.add_node(n)

    def add_node(self, node: ProxyNode):
        self._nodes[node.node_id] = node

    def get_healthy_nodes(self, region_tag: Optional[str] = None) -> List[ProxyNode]:
        now = time.time()
        candidates = []
        for n in self._nodes.values():
            if not n.is_healthy and now > n.quarantine_until:
                # Recover from quarantine
                n.is_healthy = True
                n.failure_count = 0

            if n.is_healthy:
                if region_tag is None or (n.region_tag and n.region_tag.startswith(region_tag)):
                    candidates.append(n)
        return candidates

    def get_proxy(
        self,
        session_id: Optional[str] = None,
        region_tag: Optional[str] = None,
    ) -> Optional[ProxyNode]:
        """
        Retrieves a proxy node. If session_id is provided, returns the pinned sticky node if healthy.
        Otherwise selects the next healthy node in round-robin order.
        """
        # Check sticky session
        if session_id and session_id in self._sticky_sessions:
            node_id = self._sticky_sessions[session_id]
            node = self._nodes.get(node_id)
            if node and node.is_healthy:
                node.last_used = time.time()
                return node

        healthy = self.get_healthy_nodes(region_tag=region_tag)
        if not healthy:
            return None

        # Round-robin selection
        selected = healthy[self._index % len(healthy)]
        self._index = (self._index + 1) % len(healthy)
        selected.last_used = time.time()

        if session_id:
            self._sticky_sessions[session_id] = selected.node_id

        return selected

    def report_result(self, node_id: str, success: bool, quarantine_duration_sec: float = 300.0):
        """
        Records the outcome of a request to manage node health and quarantine failing nodes.
        """
        node = self._nodes.get(node_id)
        if not node:
            return

        if success:
            node.failure_count = 0
            node.is_healthy = True
        else:
            node.failure_count += 1
            if node.failure_count >= node.max_consecutive_failures:
                node.is_healthy = False
                node.quarantine_until = time.time() + quarantine_duration_sec


def build_bright_data_proxy_url(
    customer_id: str,
    zone: str,
    password: str,
    country: str = "us",
    city: Optional[str] = None,
    session_id: Optional[str] = None,
    host: str = "brd.superproxy.io",
    port: int = 22225,
) -> str:
    """
    Constructs a Bright Data residential proxy URL with optional geo-targeting and session persistence.
    """
    username_parts = [f"lum-customer-{customer_id}", f"zone-{zone}", f"country-{country}"]
    if city:
        username_parts.append(f"city-{city}")
    if session_id:
        username_parts.append(f"session-{session_id}")

    username = "-".join(username_parts)
    return f"http://{username}:{password}@{host}:{port}"


def build_cloudflare_proxy_url(
    worker_host: str,
    auth_token: Optional[str] = None,
    port: int = 8080,
) -> str:
    """
    Constructs a Cloudflare proxy endpoint URL for datacenter/edge scraping workloads.
    """
    if auth_token:
        return f"http://cf-auth:{auth_token}@{worker_host}:{port}"
    return f"http://{worker_host}:{port}"
