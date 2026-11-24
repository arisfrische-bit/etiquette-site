"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthNav() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session);
      setReady(true);
      if (event === "SIGNED_OUT") setNotice(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Hide the notice after 5 seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(false), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav className="order-2 flex min-h-5 items-center gap-6 text-sm sm:order-3">
        {ready &&
          (signedIn ? (
            <>
              <Link href="/profile" className="underline-offset-4 hover:underline">
                Profile
              </Link>
              <button onClick={logOut} className="underline-offset-4 hover:underline">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="underline-offset-4 hover:underline">
              Log in
            </Link>
          ))}
      </nav>

      {notice && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
        >
          <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-ink px-5 py-3 text-sm text-paper">
            <span>You have been logged out.</span>
            <button
              onClick={() => setNotice(false)}
              className="underline underline-offset-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}