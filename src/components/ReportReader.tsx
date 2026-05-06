import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  ListOrdered,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import type { ReportBlock, ReportSection, ResearchReport } from "@/data/content";

const Block = ({ block }: { block: ReportBlock }) => {
  switch (block.type) {
    case "lede":
      return (
        <p className="text-xl md:text-2xl font-serif italic text-foreground/90 leading-relaxed border-l-4 border-accent pl-6 my-8">
          {block.text}
        </p>
      );
    case "p":
      return <p className="text-foreground/90 text-lg leading-relaxed mb-5">{block.text}</p>;
    case "h3":
      return (
        <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-10 mb-4">
          {block.text}
        </h3>
      );
    case "list":
      return (
        <ul className="space-y-2.5 mb-6 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-foreground/90 text-lg leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "numbered":
      return (
        <ol className="space-y-4 mb-6">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-4 text-foreground/90 text-lg leading-relaxed">
              <span className="font-serif font-bold text-2xl text-primary leading-none mt-1 w-8 flex-shrink-0">
                {i + 1}
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      );
    case "callout": {
      const tone =
        block.tone === "accent" ? "border-accent bg-accent/10" : "border-primary bg-primary/5";
      return (
        <aside className={`my-8 rounded-xl border-l-4 ${tone} p-6`}>
          <p className="text-[11px] uppercase tracking-widest text-accent font-semibold mb-2">
            {block.title}
          </p>
          <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground">
            {block.text}
          </p>
        </aside>
      );
    }
    case "table":
      return (
        <figure className="my-8 -mx-2 md:mx-0">
          {block.caption && (
            <figcaption className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3 px-2">
              {block.caption}
            </figcaption>
          )}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {block.headers.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 font-semibold text-foreground border-b border-border whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-4 py-3 align-top text-foreground/90 ${
                          ci === 0 ? "font-medium" : ""
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
  }
};

export const ReportReader = ({ report }: { report: ResearchReport }) => {
  const sections: ReportSection[] = useMemo(() => {
    if (report.sections?.length) return report.sections;
    if (report.body) {
      return [
        {
          id: "summary",
          label: "Executive Summary",
          title: "Executive Summary",
          blocks: report.body.split("\n\n").map((t) => ({ type: "p" as const, text: t })),
        },
      ];
    }
    return [];
  }, [report]);

  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
    window.scrollTo({ top: 0 });
  }, [report.slug]);

  const total = sections.length;
  const current = sections[page];

  const goto = (i: number) => {
    setPage(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <article className="px-4 pb-12">
      <div className="container mx-auto max-w-6xl grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">
            <ListOrdered className="w-4 h-4" /> Sections
          </p>
          <ol className="space-y-1">
            {sections.map((s, i) => {
              const active = i === page;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => goto(i)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-start gap-3 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`font-serif font-bold w-5 flex-shrink-0 ${
                        active ? "text-gold" : "text-muted-foreground"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-snug">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {report.citySlug && report.industrySlug && (
            <a
              href={`/city/${report.citySlug}/${report.industrySlug}`}
              className="mt-6 inline-flex items-center gap-2 text-sm text-accent hover:text-primary transition-colors"
            >
              <Building2 className="w-4 h-4" /> View related listings
            </a>
          )}
        </aside>

        <div className="min-w-0">
          {/* Mobile TOC — sidebar is hidden below lg */}
          <details className="lg:hidden mb-8 rounded-xl border border-border bg-card shadow-soft">
            <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-accent" />
                Table of Contents
                <span className="text-muted-foreground font-normal">({total})</span>
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Section {page + 1}
              </span>
            </summary>
            <ol className="border-t border-border py-2">
              {sections.map((s, i) => {
                const active = i === page;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => goto(i)}
                      className={`w-full text-left px-5 py-2.5 text-sm flex items-start gap-3 transition-colors ${
                        active
                          ? "bg-primary/5 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`font-serif font-bold w-6 flex-shrink-0 ${
                          active ? "text-accent" : "text-muted-foreground"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-snug">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </details>

          {current && (
            <>
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <p className="text-[11px] uppercase tracking-widest text-accent font-semibold">
                  Section {page + 1} of {total}
                </p>
                <p className="text-xs text-muted-foreground">{current.label}</p>
              </div>
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                <FileText className="w-5 h-5 text-accent flex-shrink-0" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                  {current.title}
                </h2>
              </div>

              <div>
                {current.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </div>

              <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                <Button
                  variant="outline"
                  onClick={() => goto(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {page > 0 ? sections[page - 1].label : "Start"}
                </Button>

                <Pagination className="m-0 w-auto">
                  <PaginationContent>
                    {sections.map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={i === page}
                          onClick={(e) => {
                            e.preventDefault();
                            goto(i);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>

                <Button
                  onClick={() => goto(Math.min(total - 1, page + 1))}
                  disabled={page === total - 1}
                  className="w-full sm:w-auto"
                >
                  {page < total - 1 ? sections[page + 1].label : "End"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default ReportReader;
