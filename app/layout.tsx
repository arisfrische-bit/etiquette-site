import type { Metadata } from "next";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
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
          <div className="mx-auto max-w-5xl px-6 py-8">
            Tips begin as drafts and are ranked by verified local residents.
          </div>
        </footer>
      </body>
    </html>
  );
}