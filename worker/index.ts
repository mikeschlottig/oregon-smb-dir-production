// Worker entry. Static assets are still served directly by Cloudflare: wrangler.jsonc sets
// assets.run_worker_first to ["/lv-relay/*"], so this script only runs for the PostHog relay.
import { handleRelay, isRelayPath, type RelayEnv, type WaitUntilContext } from "./posthog-relay";

type AssetBinding = {
  fetch: (request: Request) => Promise<Response>;
};

type Env = { ASSETS: AssetBinding } & RelayEnv;

export default {
  async fetch(request: Request, env: Env, ctx: WaitUntilContext): Promise<Response> {
    const url = new URL(request.url);
    if (isRelayPath(url.pathname)) return handleRelay(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
};
