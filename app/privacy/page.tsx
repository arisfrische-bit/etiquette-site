import type { Metadata } from "next";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy: ${SITE_NAME}`,
  description: "What information we collect, why, and how to have it deleted.",
};

const h2 = "font-display text-2xl font-semibold mt-12 mb-3";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight">
        Privacy
      </h1>
      <p className="mt-4 text-muted">Last updated: 28 November 2026</p>
      <p className="mt-6 text-xl">
        We collect as little as we can. You can read every tip on {SITE_NAME} without
        an account. This page explains what we keep when you create one.
      </p>

      <h2 className={h2}>What we collect</h2>
      <ul className="list-disc pl-6 grid gap-2">
        <li>
          <strong>Your email address and password.</strong> The password is stored in a
          scrambled form that we cannot read.
        </li>
        <li>
          <strong>The country you say you live in,</strong> and whether we have
          verified it.
        </li>
        <li>
          <strong>The name of your country, if it is not on our list,</strong> so we
          can decide which countries to add.
        </li>
        <li>
          <strong>Your votes</strong> on tips.
        </li>
      </ul>
      <p className="mt-4">
        If you only browse, we do not ask you for anything. We count visits to our
        pages, and our servers may record basic technical information, such as your IP
        address, as part of normal operation.
      </p>

      <h2 className={h2}>Why we collect it</h2>
      <ul className="list-disc pl-6 grid gap-2">
        <li>Your email lets you log in and lets us contact you about your account.</li>
        <li>
          Your country and verification status decide which tips you can vote on.
        </li>
        <li>Requests for missing countries help us decide where to expand.</li>
        <li>Your votes decide the order of the tips.</li>
        <li>Visit counts show us which pages are read, so we can improve the site.</li>
      </ul>

      <h2 className={h2}>What other people can see</h2>
      <p>
        Your email, country and individual votes are private. Other visitors see only
        the final order of the tips, never who voted for what.
      </p>

      <h2 className={h2}>Who handles your data</h2>
      <p>
        We use a few services to run the site. Supabase stores our database,
        including accounts. Vercel hosts the website, and its web analytics counts
        visits and shows us which pages are read. Resend sends our account emails,
        such as the confirmation message. Cloudflare Turnstile checks that sign-ups
        and logins come from a person, and not a bot. These services process data on
        our behalf, and may store it in data centers outside your country. We do not
        sell your information, and we do not show advertising.
      </p>

      <h2 className={h2}>Cookies and browser storage</h2>
      <p>
        We use browser storage to keep you logged in. Our bot check, provided by
        Cloudflare, may also use its own browser storage to do its job. We do not use
        advertising cookies.
      </p>

      <h2 className={h2}>Your choices</h2>
      <p>
        You can see and change your country on your profile page. To delete your
        account, email us. We will delete your account, your profile and your votes.
        You can also ask for a copy of the information we hold about you, or ask us to
        correct it.
      </p>

      <h2 className={h2}>How long we keep it</h2>
      <p>
        We keep your information for as long as your account exists. When we delete
        the account, the profile and votes go with it. Our email provider may keep
        delivery records of the messages it sent for a limited time.
      </p>

      <h2 className={h2}>Children</h2>
      <p>
        {SITE_NAME} is not meant for children under 16, and we do not knowingly
        collect their information.
      </p>

      <h2 className={h2}>Changes</h2>
      <p>
        If we change how we handle your information, we will update this page and
        change the date at the top.
      </p>

      <h2 className={h2}>Contact</h2>
      <p>
        Questions or deletion requests:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}