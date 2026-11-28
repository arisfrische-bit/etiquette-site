"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Item = { id: number; text: string; score: number };

type Status = "out" | "unverified" | "other" | "verified";

function Thumb({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {down ? (
        <>
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </>
      ) : (
        <>
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </>
      )}
    </svg>
  );
}

export default function ItemList({
  items,
  countrySlug,
  countryName,
  color,
  textColor,
}: {
  items: Item[];
  countrySlug: string;
  countryName: string;
  color: string;
  textColor: string;
}) {
  const theme = { bg: color, fg: textColor };
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.score]))
  );
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<Status>("out");
  const [message, setMessage] = useState("");
  const runRef = useRef(0);

  useEffect(() => {
    const ids = items.map((i) => i.id);

    async function load() {
      // If a newer check starts while this one is running, this one is ignored
      const run = ++runRef.current;
      const stale = () => run !== runRef.current;

      const { data: fresh } = await supabase
        .from("items")
        .select("id, score")
        .in("id", ids);
      if (stale()) return;
      if (fresh) {
        setScores(Object.fromEntries(fresh.map((r) => [r.id, r.score])));
      }

      const { data: auth } = await supabase.auth.getSession();
      if (stale()) return;

      // Nobody logged in: clear everything
      if (!auth.session) {
        setStatus("out");
        setMyVotes({});
        setLoaded(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("home_country, verified")
        .maybeSingle();
      if (stale()) return;

      let next: Status;
      if (!profile?.verified || !profile.home_country) next = "unverified";
      else if (profile.home_country !== countrySlug) next = "other";
      else next = "verified";

      let votes: Record<number, number> = {};
      if (next === "verified") {
        const { data: mine } = await supabase
          .from("votes")
          .select("item_id, value")
          .in("item_id", ids);
        if (stale()) return;
        if (mine) {
          votes = Object.fromEntries(mine.map((v) => [v.item_id, v.value]));
        }
      }

      setStatus(next);
      setMyVotes(votes);
      setLoaded(true);
    }

    load();

    // Re-check whenever someone logs in or out
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(load, 0);
      }
    });

    return () => {
      runRef.current++;
      sub.subscription.unsubscribe();
    };
  }, [items, countrySlug]);

  const canVote = status === "verified";

  async function vote(itemId: number, value: 1 | -1) {
    if (!canVote) return;
    setMessage("");
    const current = myVotes[itemId] ?? 0;

    if (current === value) {
      const { error } = await supabase.from("votes").delete().eq("item_id", itemId);
      if (error) return setMessage(error.message);
      setMyVotes({ ...myVotes, [itemId]: 0 });
      setScores({ ...scores, [itemId]: scores[itemId] - value });
    } else {
      const { error } = await supabase
        .from("votes")
        .upsert({ item_id: itemId, value }, { onConflict: "user_id,item_id" });
      if (error) return setMessage(error.message);
      setMyVotes({ ...myVotes, [itemId]: value });
      setScores({ ...scores, [itemId]: scores[itemId] - current + value });
    }
  }

  const activeStyle = {
    background: theme.bg,
    color: theme.fg,
    borderColor: theme.bg,
  };
  const buttonClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-ink hover:text-ink";
  const linkClass = "underline underline-offset-4";

  return (
    <div>
      {loaded && (
        <p className="text-muted mb-6" role="status">
          {status === "out" && (
            <>
              Live here?
              <br />
              <Link href="/login" className={linkClass}>
                Log in
              </Link>{" "}
              to vote.
            </>
          )}
          {status === "unverified" && (
            <>
              Voting is for verified residents.
              <br />
              <Link href="/profile" className={linkClass}>
                Verify your phone number
              </Link>{" "}
              to vote.
            </>
          )}
          {status === "other" && (
            <>
              Voting here is for people verified in {countryName}.
              <br />
              Your phone number is from a different country.
            </>
          )}
          {status === "verified" && (
            <>
              You are verified with a {countryName} phone number.
              <br />
              Vote on each tip.
            </>
          )}
        </p>
      )}

      <ol className="divide-y divide-line border-y border-line">
        {items.map((item, i) => {
          const mine = canVote ? myVotes[item.id] ?? 0 : 0;
          return (
            <li key={item.id} className="flex items-start gap-5 py-6">
              <span className="font-display text-3xl font-semibold w-8 shrink-0 text-muted tabular-nums">
                {i + 1}
              </span>

              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-lg leading-relaxed">{item.text}</p>

                {canVote && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => vote(item.id, 1)}
                      aria-label="Thumbs up"
                      aria-pressed={mine === 1}
                      className={buttonClass}
                      style={mine === 1 ? activeStyle : undefined}
                    >
                      <Thumb />
                    </button>
                    <button
                      onClick={() => vote(item.id, -1)}
                      aria-label="Thumbs down"
                      aria-pressed={mine === -1}
                      className={buttonClass}
                      style={mine === -1 ? activeStyle : undefined}
                    >
                      <Thumb down />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {message && (
        <p
          role="status"
          className="mt-6 border-l-4 pl-4 py-1"
          style={{ borderColor: theme.bg }}
        >
          {message}
        </p>
      )}
    </div>
  );
}