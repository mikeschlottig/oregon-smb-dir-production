/**
 * One breadcrumb trail per page, declared once.
 *
 * The visible trail and the BreadcrumbList JSON-LD are both derived from the same
 * array, so they cannot drift. Paths are normalised to the site's canonical form
 * (site-absolute, trailing slash) at construction, so a crumb URL always equals the
 * canonical URL of the page it points at.
 */

export interface Crumb {
  /** Human label. Also the JSON-LD ListItem name. */
  name: string;
  /**
   * Site-absolute path, e.g. "/city/albany/". Omitted on the final crumb, which is
   * the current page: Google wants the trail to end at the page you are on, and an
   * unlinked label is what a user expects to see there.
   */
  path?: string;
}

export interface VisibleCrumb {
  label: string;
  href?: string;
}

interface ListItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ListItem[];
}

/**
 * Canonical path form: leading slash, exactly one trailing slash, no double slashes.
 * The site's canonical URLs (SiteLayout) are `new URL(Astro.url.pathname, site)`,
 * and Astro's directory build format always yields a trailing slash, so crumbs must
 * match that or Google sees two URLs for one node.
 */
export function canonicalPath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "" || trimmed === "/") return "/";
  const withLead = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const collapsed = withLead.replace(/\/{2,}/g, "/");
  return collapsed.endsWith("/") ? collapsed : `${collapsed}/`;
}

/**
 * Builds the trail. Always starts at Home. The last entry passed in becomes the
 * current page and is stripped of its link.
 *
 * @param rest - crumbs below Home, in order, deepest last
 */
export function trail(rest: Crumb[]): Crumb[] {
  const items: Crumb[] = [{ name: "Home", path: "/" }, ...rest];
  return items.map((c, i) => {
    const isLast = i === items.length - 1;
    if (isLast) return { name: c.name };
    if (!c.path) {
      throw new Error(`Breadcrumb "${c.name}" is not the final crumb and has no path`);
    }
    return { name: c.name, path: canonicalPath(c.path) };
  });
}

/** The trail as the visible nav renders it: every crumb but the last is a link. */
export function visibleTrail(crumbs: Crumb[]): VisibleCrumb[] {
  return crumbs.map((c) => (c.path ? { label: c.name, href: c.path } : { label: c.name }));
}

/**
 * The trail as Google reads it.
 *
 * Shape follows Google's documented BreadcrumbList example: `name` on the ListItem,
 * `item` as an absolute URL string, and no `item` on the final crumb.
 *
 * @param crumbs - output of `trail()`
 * @param siteUrl - absolute origin, with or without a trailing slash
 */
export function breadcrumbListSchema(crumbs: Crumb[], siteUrl: string): BreadcrumbListSchema {
  const origin = siteUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => {
      const li: ListItem = {
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
      };
      if (c.path) li.item = `${origin}${c.path}`;
      return li;
    }),
  };
}
