"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PASSWORD_MIN_LENGTH } from "@/lib/site";

type State = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

    useLayoutEffect(() => {
    return () => {
      setPassword("");
      setConfirm("");
      setShow(false);
      setError("");
      setBusy(false);
      setState("checking");
    };
  }, []);

  useEffect(() => {
    let active = true;

    // The link from the email signs the person in for a moment, so we look for that
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState((s) => (data.session ? "ready" : s === "checking" ? "invalid" : s));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setState("ready");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    await supabase.auth.signOut({ scope: "others" });
    setState("done");
  }

  if (state === "checking") return <div className="min-h-[24rem]" />;

  if (state === "invalid") {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          This link is not valid
        </h1>
        <p className="mt-4 text-lg">
          It may have expired, or it may already have been used. Reset links work
          only once.
        </p>
        <p className="mt-6">
          <Link href="/forgot-password" className="underline underline-offset-4">
            Ask for a new link
          </Link>
        </p>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Password updated
        </h1>
        <p className="mt-4 text-lg">You are now logged in with your new password.</p>
        <p className="mt-6">
          <Link href="/" className="underline underline-offset-4">
            Go to the homepage
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-3 text-muted">
        Use at least {PASSWORD_MIN_LENGTH} characters.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-white py-3 pl-4 pr-20"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm underline underline-offset-4"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium">
            Type it again
          </label>
          <input
            id="confirm"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3"
          />
        </div>

        {error && (
          <p role="alert" className="border-l-4 border-[#B3261E] py-1 pl-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-50"
        >
          {busy ? "Please wait" : "Save new password"}
        </button>
      </form>
    </div>
  );
}