import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `About ${SITE_NAME}`,
  description:
    "How our etiquette tips are written, how locals rank them, and how we verify residents.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight">
        About {SITE_NAME}
      </h1>
      <p className="mt-6 text-xl">
        Guidebooks tell you where to go. They rarely tell you how to behave when you
        get there. We collect the small habits that locals appreciate, and let the
        people who live in each country decide which ones matter most.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-14 mb-3">
        How the tips are written
      </h2>
      <p>
        Each tip starts as a draft, written with the help of AI and reviewed by us
        before it is published. A draft can still be wrong or out of date, which is
        why locals have the final say. If a tip is wrong where you live, a thumbs
        down tells us.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-14 mb-3">
        How the ranking works
      </h2>
      <p>
        Tips are listed in the order locals vote for them. A thumbs up means the tip
        is true and it matters. A thumbs down means it is wrong, or too minor to
        include. Each person gets one vote per tip, and can change it at any time.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-14 mb-3">
        How we verify locals
      </h2>
      <p>
        When you create an account, you tell us which country you live in. You can
        vote only on that country, and only once you are verified. For now we
        confirm residents by hand, and we will add phone verification as the
        community grows.
      </p>
      <p className="mt-4">
        No system is perfect, so we call you a verified resident, not a guaranteed
        local.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-14 mb-3">
        Where we are today
      </h2>
      <p>
        This site is new. Many lists are still drafts, and few votes have been cast.
        Treat the order as a starting point, not a verdict. It will get more
        reliable with every local who joins.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-14 mb-3">
        Live in one of these countries?
      </h2>
      <p>
        <Link href="/login" className="underline underline-offset-4">
          Create an account
        </Link>{" "}
        and choose your country. Once we have verified you, you can vote on every tip
        for it.
      </p>
      <p className="mt-4">
        Spotted a mistake, or want to suggest a destination? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}