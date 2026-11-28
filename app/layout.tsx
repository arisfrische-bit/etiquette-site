import type { Metadata } from "next";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";
import SearchBox from "./SearchBox";
import AuthNav from "./AuthNav";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const body = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: `${SITE_NAME}: What Locals Really Appreciate`,
  description:
    "Etiquette tips for Japan, Spain and the UK, ranked by the people who live there.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} antialiased min-h-screen flex flex-col`}
      >
        <header className="border-b border-line">
          <div className="mx-auto max-w-5xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="order-1 font-display text-xl font-semibold"
            >
              {SITE_NAME}
            </Link>

            <AuthNav />

            <SearchBox className="order-3 w-full sm:order-2 sm:ml-auto sm:w-64" />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line text-sm text-muted">
          <div className="mx-auto max-w-5xl px-6 py-8 flex flex-wrap items-center justify-between gap-4">
            <p>Tips begin as drafts and are ranked by verified local residents.</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/about" className="underline-offset-4 hover:underline">
                About
              </Link>
              <Link href="/privacy" className="underline-offset-4 hover:underline">
                Privacy
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Feedback")}`}
                className="underline-offset-4 hover:underline"
              >
                Feedback: {CONTACT_EMAIL}
              </a>
            </nav>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}