import { MapPin } from "lucide-react";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";

export const Footer = () => {
  const half = Math.ceil(industries.length / 2);
  const left = industries.slice(0, half);
  const right = industries.slice(half);

  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-accent" />
              <div className="leading-tight">
                <span className="block font-serif font-bold text-lg">Oregon SMB</span>
                <span className="block text-[10px] uppercase tracking-[0.2em] opacity-60">
                  Business Directory
                </span>
              </div>
            </a>
            <p className="text-sm opacity-70 leading-relaxed mb-4">
              Oregon's premier business directory for cities along the I-5 corridor — from Ashland to Portland.
            </p>
            <div className="flex flex-col gap-1.5 text-sm opacity-60">
              <a href="/contact" className="hover:text-accent transition-colors">
                Contact us
              </a>
              <a href="mailto:leverage_labs_alpha@proton.me" className="hover:text-accent transition-colors">
                leverage_labs_alpha@proton.me
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-widest mb-4 opacity-60">
              Cities
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              {cities.map((c) => (
                <li key={c.slug}>
                  <a href={`/city/${c.slug}`} className="hover:text-accent transition-colors">
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-widest mb-4 opacity-60">
              Industries
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              {left.map((i) => (
                <li key={i.slug}>{i.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-widest mb-4 opacity-60">
              Resources
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              {right.map((i) => (
                <li key={i.slug}>{i.name}</li>
              ))}
              <li className="pt-2"><a href="/blog" className="hover:text-accent transition-colors">Blog</a></li>
              <li><a href="/research" className="hover:text-accent transition-colors">Research Reports</a></li>
              <li><a href="/best-of" className="hover:text-accent transition-colors">Best Of</a></li>
              <li><a href="/contact" className="hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs opacity-50">
          <span>© 2026 Oregon SMB Directory. All rights reserved.</span>
          <span>Serving the Northwest I-5 Corridor</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
