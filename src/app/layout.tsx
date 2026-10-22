import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Literata } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display: Fraunces, a warm variable serif with optical sizing and a "wonk"
// axis. Body: Literata, designed for long-form reading on screens. Mono:
// JetBrains Mono for the protocol/metadata labels.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Literata({
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
    } else if (saved === 'dark') {
      document.documentElement.classList.remove('light');
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[3px] focus:border focus:border-accent focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-text"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <AuthProvider>
            <Navbar />

            <main id="main" className="pt-[61px] print:pt-0">
              {children}
            </main>

            <footer className="mt-24 border-t border-line print:hidden">
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
                    ['/history', 'Review rooms'],
                    ['/demo', 'Sample'],
                    ['/debate', 'New review'],
                    ['/personas', 'Agents'],
                    ['/providers', 'Providers'],
                    ['/dashboard', 'Dashboard'],
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
