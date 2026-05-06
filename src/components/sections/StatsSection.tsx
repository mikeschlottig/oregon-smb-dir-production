import { cities } from "@/data/cities";
import { industries } from "@/data/industries";

const stats = [
  { value: String(cities.length), label: "Cities" },
  { value: String(industries.length), label: "Industries" },
  { value: "300mi", label: "I-5 Corridor" },
  { value: "∞", label: "Local Resources" },
];

export const StatsSection = () => (
  <section className="bg-primary text-primary-foreground py-16 px-4">
    <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="font-serif text-4xl md:text-5xl font-bold text-gold mb-1.5">{s.value}</div>
          <div className="text-primary-foreground/70 text-xs uppercase tracking-widest">{s.label}</div>
        </div>
      ))}
    </div>
  </section>
);

export default StatsSection;
