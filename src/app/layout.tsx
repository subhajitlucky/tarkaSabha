import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Newsreader } from "next/font/google";
import { Shell } from "@/components/Shell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display: Newsreader, a scholarly editorial face for research notes and
// case-file headlines. Body: Manrope, a precise grotesk for UI. Mono:
// JetBrains Mono for evidence coordinates, hashes, and status labels.
const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tarkasabha.vercel.app"
  ),
  title: "Tarka Sabha — Decision evidence workspace",
  description:
    "Turn a deal decision into a source-backed record: claims, code and document evidence, open questions, and review. The agent council is a review room inside the record.",
  openGraph: {
    type: "website",
    siteName: "Tarka Sabha",
    locale: "en_US",
    title: "Tarka Sabha — Decision evidence workspace",
    description:
      "Source-backed decision records, evidence, approvals, and diligence dossiers for technical M&A and private equity.",
  },
  twitter: {
    card: "summary",
    title: "Tarka Sabha — Decision evidence workspace",
    description:
      "Source-backed decision records, evidence, approvals, and diligence dossiers for technical M&A and private equity.",
  },
};

// Script to apply theme before React loads
const themeScript = `
  (function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-accent focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-text"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <AuthProvider>
            <Shell>{children}</Shell>
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
