"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Country = { slug: string; name: string };

export default function ProfilePage() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [savedCountry, setSavedCountry] = useState("");
  const [country, setCountry] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    async function load() {
      const { data: list } = await supabase
        .from("countries")
        .select("slug, name")
        .order("name");
      setCountries(list ?? []);

      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) {
        setChecking(false);
        return;
      }
      setSignedIn(true);
      setEmail(auth.session.user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("home_country, verified")
        .maybeSingle();
      if (data) {
        setSavedCountry(data.home_country ?? "");
        setCountry(data.home_country ?? "");
        setVerified(data.verified);
      }
      setChecking(false);
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({ home_country: country }, { onConflict: "user_id" });

    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }

    const changed = country !== savedCountry;
    if (changed) setVerified(false);
    setSavedCountry(country);
    setInfo(
      changed
        ? "Saved. We will check that you live there before you can vote."
        : "Saved."
    );
  }

  if (checking) return <div className="min-h-[24rem]" />;

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Your profile
        </h1>
        <p className="mt-3 text-muted">
          <Link href="/login" className="underline underline-offset-4">
            Log in
          </Link>{" "}
          to see and update your profile.
        </p>
      </div>
    );
  }

  const nameOf = (slug: string) =>
    countries.find((c) => c.slug === slug)?.name ?? slug;

  const changed = country !== savedCountry;
  const warnReset = verified && changed;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Your profile
      </h1>
      <p className="mt-3 text-muted">{email}</p>

      <div className="mt-8 border-l-4 border-ink py-1 pl-4" role="status">
        {!savedCountry && (
          <>
            <p className="font-medium">No country set yet</p>
            <p className="text-muted">Choose the country you live in to vote on its tips.</p>
          </>
        )}
        {savedCountry && !verified && (
          <>
            <p className="font-medium">Awaiting verification</p>
            <p className="text-muted">
              We are checking that you live in {nameOf(savedCountry)}. You can vote once
              you are verified.
            </p>
          </>
        )}
        {savedCountry && verified && (
          <>
            <p className="font-medium">Verified resident of {nameOf(savedCountry)}</p>
            <p className="text-muted">You can vote on the tips for {nameOf(savedCountry)}.</p>
          </>
        )}
      </div>

      <form onSubmit={save} className="mt-8 grid gap-5">
        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium">
            Country you live in
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setInfo("");
              setError("");
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-3"
          >
            <option value="">Choose a country</option>
            {countries.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {warnReset && (
          <p role="alert" className="border-l-4 border-[#B3261E] py-1 pl-4">
            Changing your country removes your verified status. You will need to be
            verified again.
          </p>
        )}
        {error && (
          <p role="alert" className="border-l-4 border-[#B3261E] py-1 pl-4">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="border-l-4 border-ink py-1 pl-4">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !country || !changed}
          className="w-full rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-40"
        >
          {busy ? "Please wait" : "Save"}
        </button>
      </form>
    </div>
  );
}