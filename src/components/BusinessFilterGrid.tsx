import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessCard } from "@/components/cards/BusinessCard";
import type { Business } from "@/data/businesses";

type Props = {
  businesses: Business[];
  pageSlice?: Business[];
  citySlug: string;
  industrySlug: string;
  industryName: string;
};

export const BusinessFilterGrid = ({
  businesses,
  pageSlice,
  citySlug,
  industrySlug,
  industryName,
}: Props) => {
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState<string>("any");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.category).filter(Boolean))) as string[],
    [businesses],
  );

  const hasFilters =
    query !== "" || minRating !== "any" || category !== "all" || sortBy !== "rating";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minRating === "any" ? 0 : parseFloat(minRating);
    const source = hasFilters || !pageSlice ? businesses : pageSlice;
    let list = source.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if ((b.rating ?? 0) < min) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        (b.address ?? "").toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "reviews") return (b.reviews ?? 0) - (a.reviews ?? 0);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
    return list;
  }, [businesses, pageSlice, hasFilters, query, minRating, sortBy, category]);
  const reset = () => {
    setQuery("");
    setMinRating("any");
    setSortBy("rating");
    setCategory("all");
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 md:p-5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${industryName.toLowerCase()} by name, address…`}
              className="pl-9"
            />
          </div>
          {categories.length > 1 && (
            <div className="md:col-span-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className={categories.length > 1 ? "md:col-span-2" : "md:col-span-3"}>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger>
                <SelectValue placeholder="Min rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any rating</SelectItem>
                <SelectItem value="4.5">4.5★ & up</SelectItem>
                <SelectItem value="4">4★ & up</SelectItem>
                <SelectItem value="3.5">3.5★ & up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={categories.length > 1 ? "md:col-span-2" : "md:col-span-4"}>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top rated</SelectItem>
                <SelectItem value="reviews">Most reviewed</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filtered.length}</span> of{" "}
            {businesses.length}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="w-4 h-4" /> Clear filters
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No businesses match your filters.{" "}
          <button onClick={reset} className="text-accent underline">
            Reset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b, i) => (
            <BusinessCard
              key={i}
              business={b}
              citySlug={citySlug}
              industrySlug={industrySlug}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessFilterGrid;
