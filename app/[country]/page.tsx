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
    .select("name, tagline, items(id, text, position, score)")
    .eq("slug", country)
    .order("score", { referencedTable: "items", ascending: false })
    .order("position", { referencedTable: "items" })
    .single();

  if (!data) notFound();

  return (
    <main className="max-w-2xl mx-auto p-8">
      <Link href="/" className="text-gray-400 hover:underline">
        ← All countries
      </Link>

      <h1 className="text-4xl font-bold mt-4 mb-2">{data.name}</h1>
      <p className="text-lg text-gray-400 mb-8">{data.tagline}</p>

      <ItemList items={data.items} />
    </main>
  );
}