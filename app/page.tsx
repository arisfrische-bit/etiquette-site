import Link from "next/link";

const countries = [
  { slug: "japan", name: "Japan", flag: "🇯🇵" },
  { slug: "spain", name: "Spain", flag: "🇪🇸" },
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧" },
];

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2">Local Etiquette</h1>
      <p className="text-lg text-gray-500 mb-8">
        What the locals really appreciate, voted on by the locals themselves.
      </p>

      <div className="grid gap-4">
        {countries.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="border rounded-xl p-6 text-2xl hover:bg-gray-100 hover:text-black transition"
          >
            {c.flag} {c.name}
          </Link>
        ))}
      </div>
    <Link href="/login" className="block mt-8 text-gray-400 hover:underline">
      Log in or sign up
    </Link>
    </main>
  );
}