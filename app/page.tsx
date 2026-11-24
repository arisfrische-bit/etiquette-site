import { supabase } from "@/lib/supabase";
import CountryShowcase from "./CountryShowcase";

export const instant = false;

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

export default async function Home() {
  const { data, error } = await supabase
    .from("countries")
    .select("slug, name, teaser, color, text_color, featured")
    .order("id");
  if (error) throw new Error("Supabase error: " + error.message);
  const countries = data ?? [];

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
      </section>
    </>
  );
}