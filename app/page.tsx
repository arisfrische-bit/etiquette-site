import { supabase } from "@/lib/supabase";
import CountryShowcase from "./CountryShowcase";
import Link from "next/link";

export const instant = false;

// The most countries the homepage rotation will show
const MAX_SLIDES = 5;

const principles = [
  {
    title: "Drafted, then reviewed",
    text: "Every tip starts as a draft. Locals confirm it, challenge it, or push it down.",
  },
  {
    title: "Only residents vote",
    text: "You can vote on a country only if you live there and have been verified.",
  },
  {
    title: "Order shows what matters",
    text: "The tips locals care about most sit at the top of each list.",
  },
];

type Tip = { text: string; score: number; position: number; vote_count: number };

export default async function Home() {
  const { data, error } = await supabase
    .from("countries")
    .select(
      "id, slug, name, teaser, color, text_color, featured, items(text, score, position, vote_count)"
    )
    .order("id");
  if (error) throw new Error("Supabase error: " + error.message);

  const all = (data ?? []).map((c) => {
    const tips = c.items as Tip[];

    // The top-voted tip (ties: earlier position wins)
    const top = [...tips].sort(
      (a, b) => b.score - a.score || a.position - b.position
    )[0];

    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      color: c.color,
      text_color: c.text_color,
      featured: c.featured,
      teaser: top?.text ?? c.teaser,
      votes: tips.reduce((sum, t) => sum + t.vote_count, 0),
    };
  });

  // Most voted first (ties: earlier country first)
  const ranked = [...all].sort((a, b) => b.votes - a.votes || a.id - b.id);

  // Only featured countries compete, and only the top few are kept
  const chosen = new Set(
    ranked
      .filter((c) => c.featured)
      .slice(0, MAX_SLIDES)
      .map((c) => c.slug)
  );

  const countries = ranked.map((c) => ({
    slug: c.slug,
    name: c.name,
    color: c.color,
    text_color: c.text_color,
    teaser: c.teaser,
    featured: chosen.has(c.slug),
  }));

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <h1 className="font-display text-5xl sm:text-7xl font-semibold tracking-tight max-w-3xl">
          Know what locals appreciate before you land.
        </h1>
        <p className="mt-6 text-xl text-muted max-w-xl">
          Etiquette tips for every destination, ranked by the people who live there.
        </p>
      </section>

      <CountryShowcase countries={countries} />

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <h2 className="font-display text-3xl font-semibold mb-10">
          How the ranking works
        </h2>
                <div className="grid gap-10 sm:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title}>
              <h3 className="font-display text-xl font-semibold mb-2">{p.title}</h3>
              <p className="text-muted">{p.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10">
          <Link href="/about" className="underline underline-offset-4">
            Read how we verify locals
          </Link>
        </p>
      </section>
    </>
  );
}