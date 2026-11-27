"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase";
import { CONTACT_EMAIL, PASSWORD_MIN_LENGTH } from "@/lib/site";

type Mode = "login" | "signup";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const OTHER = "__other";

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect.";
  if (m.includes("already registered"))
    return "An account with this email already exists. Try logging in.";
  if (m.includes("captcha"))
    return "The security check failed. Please try again.";
  if (m.includes("rate limit"))
    return "Too many attempts. Wait a few minutes and try again.";
  if (m.includes("not confirmed"))
    return "Please confirm your email first. Check your inbox, and your spam folder.";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [otherCountry, setOtherCountry] = useState("");
  const [countries, setCountries] = useState<{ slug: string; name: string }[]>([]);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  function goHome() {
    router.replace("/");
    router.refresh();
  }

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getSession();
      if (auth.session) {
        goHome();
        return;
      }
      const { data } = await supabase
        .from("countries")
        .select("slug, name")
        .order("name");
      setCountries(data ?? []);
      setChecking(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A security token works only once, so get a fresh one after each attempt
  function resetCaptcha() {
    turnstileRef.current?.reset();
    setCaptchaToken(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captchaToken ?? undefined },
      });
      if (error) {
        setError(friendly(error.message));
        setBusy(false);
        resetCaptcha();
        return;
      }
      goHome();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            home_country: country === OTHER ? "" : country,
            requested_country: country === OTHER ? otherCountry : "",
          },
          captchaToken: captchaToken ?? undefined,
        },
      });
      if (error) {
        setError(friendly(error.message));
        setBusy(false);
        resetCaptcha();
        return;
      }
      if (!data.session) {
        setSentTo(email);
        setBusy(false);
        resetCaptcha();
        return;
      }
      goHome();
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setInfo("");
  }

  if (checking) return <div className="min-h-[24rem]" />;

  if (sentTo) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-4 text-lg">
          We have sent a message to <strong>{sentTo}</strong>. Open it and click the
          link to confirm your account.
        </p>
        <p className="mt-4 text-muted">
          Nothing after a few minutes? Check your spam folder, or write to{" "}
          {CONTACT_EMAIL}. If you already have an account with this address, log in
          instead.
        </p>
        <div className="mt-8 flex flex-wrap gap-6">
          <button
            onClick={() => {
              setSentTo(null);
              setMode("login");
            }}
            className="underline underline-offset-4"
          >
            Go to log in
          </button>
          <button
            onClick={() => setSentTo(null)}
            className="underline underline-offset-4"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    `pb-3 -mb-px border-b-2 font-medium ${
      active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>
      <p className="mt-3 text-muted">
        {mode === "login"
          ? "Log in to vote on tips for the country you live in."
          : "Only verified residents can vote on a country's tips."}
      </p>

      <div role="tablist" className="mt-8 flex gap-8 border-b border-line">
        <button
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
          className={tabClass(mode === "login")}
        >
          Log in
        </button>
        <button
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => switchMode("signup")}
          className={tabClass(mode === "signup")}
        >
          Create account
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-white py-3 pl-4 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm underline underline-offset-4"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "login" && (
            <p className="mt-2 text-sm">
              <Link href="/forgot-password" className="underline underline-offset-4">
                Forgot password?
              </Link>
            </p>
          )}
        </div>

        {mode === "signup" && (
          <div>
            <label htmlFor="country" className="mb-1 block text-sm font-medium">
              Country you live in
            </label>
            <select
              id="country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3"
            >
              <option value="">Choose a country</option>
              {countries.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value={OTHER}>My country is not listed</option>
            </select>

            {country === OTHER ? (
              <div className="mt-4">
                <label
                  htmlFor="other-country"
                  className="mb-1 block text-sm font-medium"
                >
                  Which country?
                </label>
                <input
                  id="other-country"
                  type="text"
                  required
                  maxLength={60}
                  value={otherCountry}
                  onChange={(e) => setOtherCountry(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-4 py-3"
                />
                <p className="mt-1 text-sm text-muted">
                  You can still read every tip. We add countries based on requests,
                  and we will note yours.
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                We check your country before you can vote on its tips.
              </p>
            )}
          </div>
        )}

        {SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={SITE_KEY}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            options={{ theme: "light", appearance: "interaction-only" }}
          />
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
          disabled={busy || (!!SITE_KEY && !captchaToken)}
          className="w-full rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-50"
        >
          {busy ? "Please wait" : mode === "login" ? "Log in" : "Create account"}
        </button>

        {mode === "signup" && (
          <p className="text-sm text-muted">
            By creating an account, you agree to how we handle your information, as
            described in our{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              privacy page
            </Link>
            .
          </p>
        )}
      </form>
    </div>
  );
}