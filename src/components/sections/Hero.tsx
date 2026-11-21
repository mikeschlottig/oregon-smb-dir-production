import { ChevronDown } from "lucide-react";

/** Responsive WebP set built at build time by the page (astro:assets getImage). */
export interface HeroImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

// The hero photo was a CSS background: a 251 KB 1920 px JPEG sent to every device, found late by the browser and
// invisible to the image checks (P19 2026-11-21: home LCP 7.1 s on mobile). It is now a real <img> with a WebP
// srcset, fetched first.
export const Hero = ({ image }: { image: HeroImage }) => (
  <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes="100vw"
      width={image.width}
      height={image.height}
      alt="Low sun over a snow-capped peak, with fog lying in valleys of conifer forest"
      fetchPriority="high"
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-foreground/75" />
    <div className="absolute inset-0 bg-gradient-to-r from-foreground/30 via-transparent to-foreground/30" />

    <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto animate-fade-in-up">
      <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs sm:text-sm mb-6 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
        Statewide Oregon Business Directory
      </span>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-[1.05]">
        Oregon
        <br />
        <span className="italic text-gold">Business Directory</span>
      </h1>

      <p className="text-xl md:text-2xl text-white/80 mb-3 font-light">
        Regional collections across the Rogue Valley, Willamette Valley, Central Oregon & Portland Metro
      </p>
      <p className="text-base text-white/60 mb-10 max-w-2xl mx-auto">
        Oregon's most useful statewide business directory.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/city/"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded font-medium transition-all hover:shadow-elegant"
        >
          Explore Cities
        </a>
        <a
          href="/contact/"
          className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white px-8 py-3.5 rounded font-medium transition-all"
        >
          List Your Business
        </a>
      </div>
    </div>

    <a
      href="#scroll-banner"
      aria-label="Scroll to content"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors animate-bounce"
    >
      <ChevronDown className="w-6 h-6" />
    </a>
  </section>
);

export default Hero;
