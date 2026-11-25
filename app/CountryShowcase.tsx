"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// How long each destination stays on screen, in milliseconds
const SLIDE_MS = 5000;

type Country = {
  slug: string;
  name: string;
  teaser: string | null;
  color: string;
  text_color: string;
  featured: boolean;
};

export default function CountryShowcase({ countries }: { countries: Country[] }) {
  const featured = countries.filter((c) => c.featured);
  const items = featured.length > 0 ? featured : countries;
  const count = items.length;

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [reduce, setReduce] = useState(false);

  const playing = count > 1 && !reduce && !hovered;

  // Respect "reduce motion" settings: no automatic rotation
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(m.matches);
    const onChange = () => setReduce(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  // Move to the next destination. Picking a dot restarts the clock.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(t);
  }, [playing, index, count]);

  if (count === 0) return null;
  const c = items[index % count];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{ background: c.color, color: c.text_color }}
      className="transition-colors duration-700 motion-reduce:transition-none"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16 min-h-[22rem] sm:min-h-[26rem] flex flex-col justify-between gap-10">
          <div key={c.slug} className="slide-in" aria-live={playing ? "off" : "polite"}>
                    <Link href={`/${c.slug}`} className="block w-full max-w-3xl">
            <h2 className="font-display text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05] h-[2.1em] flex items-end">
              <span className="line-clamp-2">{c.name}</span>
            </h2>
            <p className="mt-4 h-[5.25rem] sm:h-24 text-xl sm:text-2xl line-clamp-3">
              {c.teaser}
            </p>
            <span className="mt-6 inline-block text-lg underline underline-offset-4">
              Read the tips
            </span>
          </Link>
        </div>

        {count > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex">
              {items.map((item, i) => (
                <button
                  key={item.slug}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${item.name}`}
                  aria-current={i === index}
                  className="flex h-8 w-8 items-center justify-center"
                >
                  <span
                    className="block h-3 w-3 rounded-full border-2 border-current"
                    style={{ background: i === index ? "currentColor" : "transparent" }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}