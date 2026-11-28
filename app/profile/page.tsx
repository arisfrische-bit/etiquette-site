"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";
import { supabase } from "@/lib/supabase";
import { CONTACT_EMAIL } from "@/lib/site";

type CountryRow = { slug: string; name: string; calling_code: string | null };
type Step = "loading" | "out" | "number" | "code" | "uncovered" | "noted" | "verified";

const RESEND_SECONDS = 60;

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("already"))
    return "This number is already linked to another account.";
  if (m.includes("expired") || m.includes("invalid"))
    return "That code is wrong or has expired. Request a new one.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a few minutes and try again.";
  if (m.includes("sms") || m.includes("send"))
    return "We could not send a text to this number. Check it, or try again later.";
    // return `We could not send a text to this number. Details: ${message}`;
  return message;
}

export default function ProfilePage() {
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [verifiedSlug, setVerifiedSlug] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [iso, setIso] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Next.js keeps hidden pages alive, so clear everything whenever we leave
  useLayoutEffect(() => {
    return () => {
      setStep("loading");
      setPhone(undefined);
      setIso(undefined);
      setCode("");
      setError("");
      setBusy(false);
      setCooldown(0);
    };
  }, []);

  async function readProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("home_country, verified")
      .maybeSingle();
    if (data?.verified && data.home_country) {
      setVerifiedSlug(data.home_country);
      return true;
    }
    return false;
  }

  useEffect(() => {
    async function load() {
      const { data: list } = await supabase
        .from("countries")
        .select("slug, name, calling_code")
        .order("name");
      setCountries(list ?? []);

      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) {
        setStep("out");
        return;
      }
      setEmail(auth.session.user.email ?? "");
      setStep((await readProfile()) ? "verified" : "number");
    }
    load();
  }, []);

  // Count down before another text may be requested
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Which of our countries does this number belong to? (longest code wins)
  function countryForPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    return [...countries]
      .filter((c) => c.calling_code)
      .sort((a, b) => b.calling_code!.length - a.calling_code!.length)
      .find((c) => digits.startsWith(c.calling_code!));
  }

  async function sendCode() {
    setError("");
    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Enter a valid phone number for the country you picked.");
      return;
    }
    // No text is sent, and nothing is spent, for countries we do not cover
    if (!countryForPhone(phone)) {
      setStep("uncovered");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ phone });
    setBusy(false);
    if (error) {
      setError(friendly(error.message));
      return;
    }
    setCooldown(RESEND_SECONDS);
    setStep("code");
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code.trim(),
      type: "phone_change",
    });
    if (error) {
      setBusy(false);
      setError(friendly(error.message));
      return;
    }
    const ok = await readProfile();
    setBusy(false);
    if (ok) {
      setStep("verified");
    } else {
      setError(
        `Your number was confirmed, but we could not match it to a country we cover. Write to ${CONTACT_EMAIL}.`
      );
    }
  }

  async function saveInterest() {
    setError("");
    setBusy(true);
    const labels = en as Record<string, string>;
    const name = (iso && labels[iso]) || "Unknown";
    const { error } = await supabase
      .from("profiles")
      .upsert({ requested_country: name }, { onConflict: "user_id" });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("noted");
  }

  function startOver() {
    setPhone(undefined);
    setIso(undefined);
    setCode("");
    setError("");
    setStep("number");
  }

  const buttonClass =
    "w-full rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-50";
  const linkClass = "underline underline-offset-4";
  const heading = "font-display text-4xl font-semibold tracking-tight";

  if (step === "loading") return <div className="min-h-[24rem]" />;

  if (step === "out") {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className={heading}>Your profile</h1>
        <p className="mt-3 text-muted">
          <Link href="/login" className={linkClass}>
            Log in
          </Link>{" "}
          to verify your phone number and vote.
        </p>
      </div>
    );
  }

  if (step === "verified") {
    const name = countries.find((c) => c.slug === verifiedSlug)?.name ?? verifiedSlug;
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className={heading}>Your profile</h1>
        <p className="mt-3 text-muted">{email}</p>
        <div className="mt-8 border-l-4 border-ink py-1 pl-4" role="status">
          <p className="font-medium">Verified with a {name} phone number</p>
          <p className="text-muted">You can vote on the tips for {name}.</p>
        </div>
        <p className="mt-6">
          <Link href={`/${verifiedSlug}`} className={linkClass}>
            Go to the {name} tips
          </Link>
        </p>
        <p className="mt-10 text-sm text-muted">
          To change your country or number, write to {CONTACT_EMAIL}.
        </p>
      </div>
    );
  }

  if (step === "uncovered") {
    const labels = en as Record<string, string>;
    const name = (iso && labels[iso]) || "your country";
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className={heading}>We do not cover {name} yet</h1>
        <p className="mt-4 text-lg">
          You can still read every tip. Voting opens for a country once we add it.
          We choose which countries to add based on requests.
        </p>
        {error && (
          <p role="alert" className="mt-6 border-l-4 border-[#B3261E] py-1 pl-4">
            {error}
          </p>
        )}
        <div className="mt-8 grid gap-4">
          <button onClick={saveInterest} disabled={busy} className={buttonClass}>
            {busy ? "Please wait" : `Yes, let us know I want ${name}`}
          </button>
          <button onClick={startOver} className={linkClass}>
            Use a different number
          </button>
        </div>
      </div>
    );
  }

  if (step === "noted") {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className={heading}>Thank you</h1>
        <p className="mt-4 text-lg">
          We have noted your request. You can read every tip in the meantime.
        </p>
        <p className="mt-6">
          <Link href="/" className={linkClass}>
            Go to the homepage
          </Link>
        </p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className={heading}>Enter your code</h1>
        <p className="mt-3 text-muted">
          We sent a 6-digit code to <strong className="text-ink">{phone}</strong>.
        </p>
        <form onSubmit={confirmCode} className="mt-8 grid gap-5">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium">
              6-digit code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-lg tracking-widest"
            />
          </div>
          {error && (
            <p role="alert" className="border-l-4 border-[#B3261E] py-1 pl-4">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || code.length !== 6} className={buttonClass}>
            {busy ? "Please wait" : "Verify"}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <button
            onClick={sendCode}
            disabled={busy || cooldown > 0}
            className={`${linkClass} disabled:opacity-50 disabled:no-underline`}
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </button>
          <button onClick={startOver} className={linkClass}>
            Use a different number
          </button>
        </div>
      </div>
    );
  }

  // step === "number"
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className={heading}>Verify your phone number</h1>
      <p className="mt-3 text-muted">{email}</p>
      <p className="mt-4">
        Voting is for people who live in the country they vote on. Pick your country,
        and enter your number. We send a 6-digit code, and the country of your number
        becomes your country.
      </p>

      <div className="mt-8 grid gap-5">
        <div className="phone-field">
          <label className="mb-1 block text-sm font-medium">Phone number</label>
          <PhoneInput
            international
            countryCallingCodeEditable={false}
            flags={flags}
            labels={en}
            placeholder="Enter phone number"
            value={phone}
            onChange={setPhone}
            onCountryChange={setIso}
          />
        </div>

        {error && (
          <p role="alert" className="border-l-4 border-[#B3261E] py-1 pl-4">
            {error}
          </p>
        )}

        <button onClick={sendCode} disabled={busy || !phone} className={buttonClass}>
          {busy ? "Please wait" : "Send code"}
        </button>

        <p className="text-sm text-muted">
          We keep your number private and never show it to others. Standard message
          rates may apply. See our{" "}
          <Link href="/privacy" className={linkClass}>
            privacy page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}