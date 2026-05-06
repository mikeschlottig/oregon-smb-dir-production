import { useEffect, useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { text: "Home", href: "/" },
  { text: "Cities", href: "/#cities" },
  { text: "Best Of", href: "/best-of" },
  { text: "Blog", href: "/blog" },
  { text: "Reports", href: "/research" },
];

export const Navbar = ({ pathname = "/" }: { pathname?: string }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = onHome && !scrolled;

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent text-white"
          : "bg-card/95 backdrop-blur-md border-b border-border text-foreground shadow-soft"
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <MapPin className="w-5 h-5 text-accent" />
          <div className="leading-tight">
            <span className="block font-serif font-bold text-lg">Oregon SMB</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] opacity-70">
              Business Directory
            </span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-accent transition-colors">
              {l.text}
            </a>
          ))}
          <a
            href="/contact"
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            List Your Business
          </a>
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card text-foreground border-t border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3 text-sm font-medium">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="py-2 hover:text-accent">
                {l.text}
              </a>
            ))}
            <a
              href="/contact"
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded text-center"
            >
              List Your Business
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
