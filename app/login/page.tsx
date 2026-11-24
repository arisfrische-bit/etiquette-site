"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signUp() {
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created. You are signed in.");
  }

  async function signIn() {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Welcome back.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMessage("Signed out.");
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <Link href="/" className="text-gray-400 hover:underline">
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Log in</h1>

      {userEmail ? (
        <div className="grid gap-4">
          <p>
            Signed in as <strong>{userEmail}</strong>
          </p>
          <button onClick={signOut} className="border rounded-xl p-3 hover:bg-gray-100 hover:text-black">
            Sign out
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-xl p-3 bg-white text-black"
          />
          <input
            type="password"
            placeholder="Password (at least 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-xl p-3 bg-white text-black"
          />
          <button onClick={signIn} className="border rounded-xl p-3 hover:bg-gray-100 hover:text-black">
            Log in
          </button>
          <button onClick={signUp} className="text-gray-400 hover:underline">
            No account? Sign up
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-gray-400">{message}</p>}
    </main>
  );
}