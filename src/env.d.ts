/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** PostHog project token (public, client-side). Unset = analytics not rendered. */
  readonly PUBLIC_POSTHOG_TOKEN?: string;
  /** PostHog app host for toolbar/links. Defaults to https://us.posthog.com. */
  readonly PUBLIC_POSTHOG_UI_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
