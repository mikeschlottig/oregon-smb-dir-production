// First-party relay for PostHog: the browser talks to leverageai.network/<RELAY_PREFIX>/*,
// this Worker forwards to PostHog. Follows PostHog's official Cloudflare Worker proxy
// (docs/advanced/proxy/cloudflare), adapted for a path prefix on the site's own Worker.
//
// - Assets (/static/*, /array/*) are fetched from PostHog's asset host and edge-cached.
// - Everything else (event ingestion, flags) is forwarded to the API host with the
//   visitor's IP in X-Forwarded-For; cookies and Authorization are stripped.
// - Retries: 3 attempts, exponential backoff with jitter. Ingestion POSTs retry only when
//   no response came back (network error), so an event is never delivered twice.

export const RELAY_PREFIX = "/lv-relay";

const DEFAULT_API_HOST = "us.i.posthog.com";
const DEFAULT_ASSET_HOST = "us-assets.i.posthog.com";
const MAX_ATTEMPTS = 3;

export type RelayEnv = {
  POSTHOG_API_HOST?: string;
  POSTHOG_ASSET_HOST?: string;
};

export type WaitUntilContext = {
  waitUntil: (promise: Promise<unknown>) => void;
};

type EdgeCache = {
  match: (request: Request) => Promise<Response | undefined>;
  put: (request: Request, response: Response) => Promise<void>;
};

class RelayUpstreamError extends Error {
  constructor(
    readonly upstream: string,
    readonly attempts: number,
    readonly lastError: unknown,
  ) {
    super(`PostHog relay: ${upstream} unreachable after ${attempts} attempts`);
    this.name = "RelayUpstreamError";
  }
}

const edgeCache = (): EdgeCache =>
  (globalThis as unknown as { caches: { default: EdgeCache } }).caches.default;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const backoff = (attempt: number) => 2 ** attempt * 200 + Math.random() * 200;

const log = (level: "warn" | "error", event: string, fields: Record<string, unknown>) =>
  console[level](JSON.stringify({ level, event, component: "posthog-relay", ...fields }));

export const isRelayPath = (pathname: string): boolean =>
  pathname === RELAY_PREFIX || pathname.startsWith(`${RELAY_PREFIX}/`);

/** Fetch with retries. `retryOnStatus` controls whether 502/503/504 responses are retried. */
async function fetchWithRetry(build: () => Request, upstream: string, retryOnStatus: boolean): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(build());
      if (retryOnStatus && [502, 503, 504].includes(response.status) && attempt < MAX_ATTEMPTS - 1) {
        log("warn", "relay_retry_status", { upstream, status: response.status, attempt });
        await sleep(backoff(attempt));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      log("warn", "relay_retry_network", { upstream, attempt, message: String(error) });
      if (attempt < MAX_ATTEMPTS - 1) await sleep(backoff(attempt));
    }
  }
  throw new RelayUpstreamError(upstream, MAX_ATTEMPTS, lastError);
}

async function retrieveAsset(request: Request, host: string, path: string, ctx: WaitUntilContext): Promise<Response> {
  const cache = edgeCache();
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetchWithRetry(() => new Request(`https://${host}${path}`), host, true);
  if (response.ok) ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

async function forwardRequest(request: Request, host: string, path: string): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("authorization");
  headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") ?? "");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : null;
  return fetchWithRetry(
    () => new Request(`https://${host}${path}`, { method: request.method, headers, body, redirect: "manual" }),
    host,
    !hasBody,
  );
}

export async function handleRelay(request: Request, env: RelayEnv, ctx: WaitUntilContext): Promise<Response> {
  const url = new URL(request.url);
  const path = (url.pathname.slice(RELAY_PREFIX.length) || "/") + url.search;
  const apiHost = env.POSTHOG_API_HOST ?? DEFAULT_API_HOST;
  const assetHost = env.POSTHOG_ASSET_HOST ?? DEFAULT_ASSET_HOST;
  try {
    return path.startsWith("/static/") || path.startsWith("/array/")
      ? await retrieveAsset(request, assetHost, path, ctx)
      : await forwardRequest(request, apiHost, path);
  } catch (error) {
    if (error instanceof RelayUpstreamError) {
      log("error", "relay_upstream_failed", { upstream: error.upstream, attempts: error.attempts });
      return new Response(null, { status: 502 });
    }
    throw error;
  }
}
