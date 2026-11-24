"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Item = { id: number; text: string; score: number };

export default function ItemList({
  items,
  countrySlug,
  color,
  textColor,
}: {
  items: Item[];
  countrySlug: string;
  color: string;
  textColor: string;
}) {
  const theme = { bg: color, fg: textColor };
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.score]))
  );
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const ids = items.map((i) => i.id);

      const { data: fresh } = await supabase
        .from("items")
        .select("id, score")
        .in("id", ids);
      if (fresh) {
        setScores(Object.fromEntries(fresh.map((r) => [r.id, r.score])));
      }

      const { data: auth } = await supabase.auth.getSession();
      setSignedIn(!!auth.session);

      if (auth.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("home_country, verified")
          .maybeSingle();
        setEligible(!!profile?.verified && profile.home_country === countrySlug);

        const { data: mine } = await supabase
          .from("votes")
          .select("item_id, value")
          .in("item_id", ids);
        if (mine) {
          setMyVotes(Object.fromEntries(mine.map((v) => [v.item_id, v.value])));
        }
      }
      setLoaded(true);
    }
    load();
  }, [items, countrySlug]);

  async function vote(itemId: number, value: 1 | -1) {
    if (!signedIn || !eligible) return;
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
    "h-10 w-10 rounded-full border border-line text-muted hover:border-ink hover:text-ink";

  return (
    <div>
      {loaded && (
        <p className="text-muted mb-6" role="status">
          {!signedIn && (
            <>
              Live here?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>{" "}
              to vote.
            </>
          )}
          {signedIn && !eligible && (
            <>
              Only verified residents of this country can vote. Check your status on{" "}
              <Link href="/profile" className="underline underline-offset-4">
                your profile
              </Link>
              .
            </>
          )}
          {signedIn && eligible && "You are a verified resident. Vote on each tip."}
        </p>
      )}

      <ol className="divide-y divide-line border-y border-line">
        {items.map((item, i) => {
          const mine = myVotes[item.id] ?? 0;
          return (
            <li key={item.id} className="flex items-start gap-5 py-6">
              <span className="font-display text-3xl font-semibold w-8 shrink-0 text-muted tabular-nums">
                {i + 1}
              </span>
              <p className="flex-1 text-lg leading-relaxed">{item.text}</p>

              {eligible && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => vote(item.id, 1)}
                    aria-label="Upvote"
                    aria-pressed={mine === 1}
                    className={buttonClass}
                    style={mine === 1 ? activeStyle : undefined}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => vote(item.id, -1)}
                    aria-label="Downvote"
                    aria-pressed={mine === -1}
                    className={buttonClass}
                    style={mine === -1 ? activeStyle : undefined}
                  >
                    ▼
                  </button>
                </div>
              )}
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