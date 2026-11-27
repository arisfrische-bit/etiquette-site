"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase";
import { CONTACT_EMAIL } from "@/lib/site";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("captcha")) return "The security check failed. Please try again.";
  if (m.includes("only request this once") || m.includes("rate limit"))
    return "Please wait a minute before asking for another email.";
  return message;
}

export default function ForgotPasswordPage() {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  function resetCaptcha() {
    turnstileRef.current?.reset();
    setCaptchaToken(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken ?? undefined,
    });

    setBusy(false);
    resetCaptcha();
    if (error) {
      setError(friendly(error.message));
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-4 text-lg">
          If an account exists for <strong>{sentTo}</strong>, we have sent a link to
          reset your password. The link works once, and expires after a short time.
        </p>
        <p className="mt-4 text-muted">
          Nothing after a few minutes? Check your spam folder, or write to{" "}
          {CONTACT_EMAIL}.
        </p>
        <div className="mt-8 flex flex-wrap gap-6">
          <Link href="/login" className="underline underline-offset-4">
            Back to log in
          </Link>
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

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Forgot your password?
      </h1>
      <p className="mt-3 text-muted">
        Enter your email, and we will send you a link to choose a new one.
      </p>

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

        <button
          type="submit"
          disabled={busy || (!!SITE_KEY && !captchaToken)}
          className="w-full rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-50"
        >
          {busy ? "Please wait" : "Send reset link"}
        </button>

        <p className="text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Back to log in
          </Link>
        </p>
      </form>
    </div>
  );
}