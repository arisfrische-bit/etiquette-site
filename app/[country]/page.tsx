import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    .select("name, tagline, items(id, text, position)")
    .eq("slug", country)
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

      <ol className="grid gap-3">
        {data.items.map((item: { id: number; text: string }, i: number) => (
          <li key={item.id} className="border rounded-xl p-5 flex gap-4">
            <span className="font-bold text-gray-400">{i + 1}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}