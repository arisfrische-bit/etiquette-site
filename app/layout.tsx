import type { Metadata } from "next";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
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
          <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-display text-xl font-semibold">
              {SITE_NAME}
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/profile" className="underline-offset-4 hover:underline">
                Profile
              </Link>
              <Link href="/login" className="underline-offset-4 hover:underline">
                Log in
              </Link>
            </nav>
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