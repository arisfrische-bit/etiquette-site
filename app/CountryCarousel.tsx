"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Country = {
  slug: string;
  name: string;
  teaser: string | null;
  color: string;
  text_color: string;
  region: string | null;
  featured: boolean;
};

// Lowercase and strip accents, so "espana" finds "España"
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function CountryCarousel({ countries }: { countries: Country[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const q = normalize(query);

  const shown = useMemo(() => {
    if (!q) {
      const featured = countries.filter((c) => c.featured);
      return featured.length > 0 ? featured : countries;
    }
    return countries.filter((c) =>
      normalize(`${c.name} ${c.slug} ${c.region ?? ""}`).includes(q)
    );
  }, [countries, q]);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, shown]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  const arrowClass =
    "h-10 w-10 rounded-full border border-line hover:border-ink disabled:opacity-30 disabled:hover:border-line";

  return (
    <section aria-label="Destinations">
      <div className="mx-auto max-w-5xl px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold">
            {q ? "Results" : "Destinations"}
          </h2>
          {(canPrev || canNext) && (
            <div className="flex gap-2">
              <button
                onClick={() => scrollByPage(-1)}
                disabled={!canPrev}
                aria-label="Previous destinations"
                className={arrowClass}
              >
                ←
              </button>
              <button
                onClick={() => scrollByPage(1)}
                disabled={!canNext}
                aria-label="Next destinations"
                className={arrowClass}
              >
                →
              </button>
            </div>
          )}
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a country or region, for example Japan or Asia"
          aria-label="Search destinations"
          className="w-full max-w-lg rounded-full border border-line bg-white px-5 py-3"
        />
        {q && (
          <p role="status" className="sr-only">
            {shown.length} {shown.length === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      {shown.length > 0 ? (
        <div
          ref={trackRef}
          onScroll={update}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              style={{ background: c.color, color: c.text_color }}
              className="group snap-start shrink-0 w-72 sm:w-80 min-h-64 flex flex-col justify-between gap-10 px-6 py-10"
            >
              <h3 className="font-display text-4xl font-semibold tracking-tight underline-offset-8 decoration-2 group-hover:underline">
                {c.name}
              </h3>
              {c.teaser && <p className="text-lg">{c.teaser}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-lg">
            No destination matches &ldquo;{query.trim()}&rdquo; yet.
          </p>
          <p className="text-muted mt-1">
            Check the spelling, or try a region such as Asia or Europe.
          </p>
        </div>
      )}
    </section>
  );
}