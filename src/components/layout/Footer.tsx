import { MapPin } from "lucide-react";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { publisher } from "@/data/publisher";

/**
 * Site footer, modelled on Deedline (C:\Dev\directory_websites\real_estate; P20 D, 2026-11-21): brand and operator,
 * Directory / Trust / For machines columns, the city and industry links every page should carry, and one plain line
 * on where ratings come from. Column titles are h2 so no page's outline skips a level (STD-SEO-001 row 3).
 */
const CONTENT_SIGNAL = "ai-input=yes, search=yes, ai-train=no";

const heading = "font-sans font-semibold text-xs uppercase tracking-widest mb-4 opacity-60";
const link = "hover:text-accent transition-colors";

const columns: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: "Directory",
    links: [
      ["All cities", "/city/"],
      ["Services", "/services/"],
      ["Research reports", "/research/"],
      ["Blog", "/blog/"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["About and data", "/about/"],
      ["Editorial policy", publisher.editorialPolicyUrl],
      ["Contact and corrections", "/contact/"],
      ["Privacy", "/privacy/"],
      ["Accessibility", "/accessibility/"],
    ],
  },
  {
    title: "For machines",
    links: [
      ["llms.txt", "/llms.txt"],
      ["llms-full.txt", "/llms-full.txt"],
      ["index.json", "/index.json"],
      ["Site JSON-LD", "/jsonld.json"],
      ["Sitemap", "/sitemap-index.xml"],
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-accent" />
              <div className="leading-tight">
                <span className="block font-serif font-bold text-lg">Oregon SMB</span>
                <span className="block text-[10px] uppercase tracking-[0.2em] opacity-60">Business Directory</span>
              </div>
            </a>
            <p className="text-sm opacity-70 leading-relaxed mb-4">{publisher.description}</p>
            <div className="flex flex-col gap-1.5 text-sm opacity-70">
              <span>Operated by {publisher.legalOperator}, {publisher.locationLabel}</span>
              <a href={`mailto:${publisher.supportEmail}`} className={link}>{publisher.supportEmail}</a>
              <a href={`tel:${publisher.supportPhone}`} className={link}>{publisher.supportPhoneDisplay}</a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h2 className={heading}>{col.title}</h2>
              <ul className="space-y-2 text-sm opacity-80">
                {col.links.map(([label, href]) => (
                  <li key={href}><a href={href} className={link}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-sm">
          <div>
            <h2 className={heading}>Cities</h2>
            <p className="opacity-80 leading-relaxed">
              {cities.map((c, i) => (
                <span key={c.slug}>
                  {i > 0 && <span className="opacity-40"> · </span>}
                  <a href={`/city/${c.slug}/`} className={link}>{c.name}</a>
                </span>
              ))}
            </p>
          </div>
          <div>
            <h2 className={heading}>Industries</h2>
            <p className="opacity-80 leading-relaxed">
              {industries.map((ind, i) => (
                <span key={ind.slug}>
                  {i > 0 && <span className="opacity-40"> · </span>}
                  <a href={`/services/${ind.slug}/`} className={link}>{ind.name}</a>
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs opacity-60 leading-relaxed">
          <p>
            Ratings and review counts come from public Google Maps listings; each listing shows the date its rating was
            read. {publisher.name} is not affiliated with Google. Payment does not purchase a ranking. To correct a
            listing, email <a href={`mailto:${publisher.supportEmail}`} className="underline">{publisher.supportEmail}</a>.
          </p>
          <p>
            Content signal: <code>{CONTENT_SIGNAL}</code>. Directory data is free to read and cite with attribution to{" "}
            {publisher.name}.{" "}
            <a href="/about/" className={link}>
              Copyright © 2026 {publisher.legalOperator}. All rights reserved.
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
