import { ChevronDown } from "lucide-react";
import heroImg from "@/images/hero-oregon.jpg";

export const Hero = () => (
  <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
    <div
      className="absolute inset-0 bg-cover bg-center scale-105"
      style={{ backgroundImage: `url(${heroImg.src ?? heroImg})` }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-foreground/75" />
    <div className="absolute inset-0 bg-gradient-to-r from-foreground/30 via-transparent to-foreground/30" />

    <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto animate-fade-in-up">
      <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs sm:text-sm mb-6 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
        Oregon's Premier Business Directory
      </span>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-[1.05]">
        Oregon
        <br />
        <span className="italic text-gold">Business Directory</span>
      </h1>

      <p className="text-xl md:text-2xl text-white/80 mb-3 font-light">
        Statewide coverage: I-5 hubs, Corvallis, Bend & Klamath Falls
      </p>
      <p className="text-base text-white/60 mb-10 max-w-2xl mx-auto">
        Oregon's most useful statewide business directory.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/city"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded font-medium transition-all hover:shadow-elegant"
        >
          Explore Cities
        </a>
        <a
          href="/contact"
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
