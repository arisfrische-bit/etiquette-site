"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [country, setCountry] = useState("");
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    async function load() {
      const { data: list } = await supabase
        .from("countries")
        .select("slug, name")
        .order("name");
      setOptions(list ?? []);

      const { data: auth } = await supabase.auth.getSession();
      setSignedIn(!!auth.session);
      if (!auth.session) return;
      const { data } = await supabase
        .from("profiles")
        .select("home_country, verified")
        .maybeSingle();
      if (data) {
        setCountry(data.home_country ?? "");
        setVerified(data.verified);
      }
    }
    load();
  }, []);

  async function save() {
    setMessage("");
    const { error } = await supabase
      .from("profiles")
      .upsert({ home_country: country }, { onConflict: "user_id" });
    if (error) return setMessage(error.message);
    setVerified(false);
    setMessage("Saved. Your country is now awaiting verification.");
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <Link href="/" className="text-gray-400 hover:underline">
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Your profile</h1>

      {signedIn === false && (
        <p>
          Please <Link href="/login" className="underline">log in</Link> first.
        </p>
      )}

      {signedIn && (
        <div className="grid gap-4">
          <label className="text-gray-400">Which country do you live in?</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border rounded-xl p-3 bg-white text-black"
          >
            <option value="">Choose a country</option>
            {options.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            onClick={save}
            disabled={!country}
            className="border rounded-xl p-3 hover:bg-gray-100 hover:text-black disabled:opacity-40"
          >
            Save
          </button>
          <p>
            Status:{" "}
            <strong>{verified ? "Verified resident ✓" : "Not yet verified"}</strong>
          </p>
        </div>
      )}

      {message && <p className="mt-4 text-gray-400">{message}</p>}
    </main>
  );
}