import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display: Instrument Serif, a high-contrast editorial face for case-file
// headlines. Body: Manrope, a precise grotesk for reading and UI. Mono:
// JetBrains Mono for evidence coordinates, hashes, and status labels.
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
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
  title: "Tarka Sabha — Decision evidence workspace",
  description:
    "Turn a deal decision into a source-backed record: claims, code and document evidence, open questions, and review. The agent council is a review room inside the record.",
};

// Script to apply theme before React loads
const themeScript = `
  (function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[2px] focus:border focus:border-accent focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-text lg:focus:left-[16.5rem]"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <AuthProvider>
            <Navbar />

            <main id="main" className="pt-[57px] lg:pl-[15.5rem] lg:pt-0 print:pl-0 print:pt-0">
              {children}
            </main>

            <footer className="mt-24 border-t border-line print:hidden lg:pl-[15.5rem]">
              <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-accent-line bg-accent-soft font-display text-sm text-accent"
                    >
                      त
                    </span>
                    <span className="font-display text-lg text-text">Tarka Sabha</span>
                  </div>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                    A decision evidence workspace. Frame the decision, attach source-backed
                    evidence, and keep the review trail together — with an agent council
                    available as a review room inside the record.
                  </p>
                </div>

                <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    ['/workspaces', 'Workspaces'],
                    ['/diligence', 'Diligence'],
                    ['/history', 'Review rooms'],
                    ['/demo', 'Sample'],
                    ['/debate', 'New review'],
                    ['/personas', 'Agents'],
                    ['/providers', 'Providers'],
                    ['/feedback', 'Feedback'],
                  ].map(([href, label]) => (
                    <a
                      key={href}
                      href={href}
                      className="text-muted transition-colors hover:text-accent"
                    >
                      {label}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="border-t border-line">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
                  <p>© {new Date().getFullYear()} Tarka Sabha</p>
                  <p>Decision evidence, on the record.</p>
                </div>
              </div>
            </footer>

            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
