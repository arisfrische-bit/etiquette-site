"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Country = { slug: string; name: string; region: string | null; color: string };

// Lowercase and strip accents
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Lower number = better match
function rank(c: Country, q: string): number | null {
  const name = normalize(c.name);
  if (name.startsWith(q)) return 0;
  if (name.split(" ").some((w) => w.startsWith(q))) return 1;
  if (name.includes(q)) return 2;
  if (normalize(`${c.slug} ${c.region ?? ""}`).includes(q)) return 3;
  return null;
}

export default function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("countries")
        .select("slug, name, region, color")
        .order("name");
      setCountries(data ?? []);
    }
    load();
  }, []);

  // Close the dropdown when clicking elsewhere
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = normalize(query);

  const results = useMemo(() => {
    if (!q) return [];
    return countries
      .flatMap((c) => {
        const r = rank(c, q);
        return r === null ? [] : [{ c, r }];
      })
      .sort((a, b) => a.r - b.r || a.c.name.localeCompare(b.c.name))
      .slice(0, 6)
      .map((x) => x.c);
  }, [countries, q]);

  const showList = open && q.length > 0;

  function go(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showList && results[active]) {
        e.preventDefault();
        go(results[active].slug);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Search destinations"
        placeholder="Search destinations"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-20 overflow-hidden rounded-xl border border-line bg-white"
        >
          {results.length > 0 ? (
            results.map((c, i) => (
              <li
                key={c.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(c.slug);
                }}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${
                  i === active ? "bg-paper" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="flex-1">{c.name}</span>
                {c.region && <span className="text-sm text-muted">{c.region}</span>}
              </li>
            ))
          ) : (
            <li
              role="option"
              aria-selected={false}
              aria-disabled="true"
              className="px-4 py-3 text-sm text-muted"
            >
              No destination matches.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}