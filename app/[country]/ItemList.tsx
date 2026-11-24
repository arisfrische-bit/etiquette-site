"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Item = { id: number; text: string; score: number };

export default function ItemList({ items }: { items: Item[] }) {
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.score]))
  );
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const ids = items.map((i) => i.id);

      // Fresh scores, because the page itself is built in advance
      const { data: fresh } = await supabase
        .from("items")
        .select("id, score")
        .in("id", ids);
      if (fresh) {
        setScores(Object.fromEntries(fresh.map((r) => [r.id, r.score])));
      }

      // Is someone signed in? If so, what have they voted?
      const { data: auth } = await supabase.auth.getSession();
      setSignedIn(!!auth.session);
      if (auth.session) {
        const { data: mine } = await supabase
          .from("votes")
          .select("item_id, value")
          .in("item_id", ids);
        if (mine) {
          setMyVotes(Object.fromEntries(mine.map((v) => [v.item_id, v.value])));
        }
      }
    }
    load();
  }, [items]);

  async function vote(itemId: number, value: 1 | -1) {
    if (!signedIn) {
      setMessage("Please log in to vote.");
      return;
    }
    setMessage("");
    const current = myVotes[itemId] ?? 0;

    if (current === value) {
      // Clicking the same arrow again removes your vote
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

  return (
    <div>
      <ol className="grid gap-3">
        {items.map((item, i) => {
          const mine = myVotes[item.id] ?? 0;
          return (
            <li key={item.id} className="border rounded-xl p-5 flex gap-4 items-center">
              <span className="font-bold text-gray-400">{i + 1}</span>
              <span className="flex-1">{item.text}</span>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => vote(item.id, 1)}
                  className={mine === 1 ? "text-green-500" : "text-gray-400 hover:text-white"}
                  aria-label="Upvote"
                >
                  ▲
                </button>
                <span className="font-bold">{scores[item.id] ?? 0}</span>
                <button
                  onClick={() => vote(item.id, -1)}
                  className={mine === -1 ? "text-red-500" : "text-gray-400 hover:text-white"}
                  aria-label="Downvote"
                >
                  ▼
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {message && <p className="mt-4 text-gray-400">{message}</p>}
    </div>
  );
}