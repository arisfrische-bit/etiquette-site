import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ItemList from "./ItemList";

export const instant = false;

export async function generateStaticParams() {
  const { data, error } = await supabase.from("countries").select("slug");
  if (error) throw new Error("Supabase error: " + error.message);
  return (data ?? []).map((c: { slug: string }) => ({ country: c.slug }));
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;

  const { data } = await supabase
    .from("countries")
    .select("name, tagline, color, text_color, items(id, text, position, score)")
    .eq("slug", country)
    .order("score", { referencedTable: "items", ascending: false })
    .order("position", { referencedTable: "items" })
    .single();

  if (!data) notFound();

  return (
    <>
      <section style={{ background: data.color, color: data.text_color }}>
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <Link href="/" className="text-sm underline underline-offset-4">
            All destinations
          </Link>
          <h1 className="font-display text-5xl sm:text-7xl font-semibold tracking-tight mt-6">
            {data.name}
          </h1>
          <p className="mt-4 text-xl max-w-xl">{data.tagline}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted mb-2">Ranked by verified local residents.</p>
        <ItemList
          items={data.items}
          countrySlug={country}
          countryName={data.name}
          color={data.color}
          textColor={data.text_color}
        />
      </div>
    </>
  );
}