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
  title: "Tarka Sabha — A council of reasoning agents",
  description:
    "Describe an outcome, assemble agents with distinct roles, and let them work the problem with real tools. They deliberate, you get a deliverable scored against a rubric.",
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

            <main id="main" className="pt-[61px]">
              {children}
            </main>

            <footer className="mt-24 border-t border-line">
              <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[2fr_1fr_1fr]">
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
                    A council of reasoning agents. Describe an outcome, give each agent a
                    role and the tools to check its work, and read the deliverable they
                    argue their way to.
                  </p>
                </div>

                <nav aria-label="Platform">
                  <h2 className="eyebrow mb-4">Platform</h2>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      ['/debate', 'New council'],
                      ['/history', 'Archive'],
                      ['/dashboard', 'Dashboard'],
                      ['/about', 'About'],
                      ['/feedback', 'Feedback'],
                    ].map(([href, label]) => (
                      <li key={href}>
                        <a href={href} className="text-muted transition-colors hover:text-accent">
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div>
                  <h2 className="eyebrow mb-4">Under the hood</h2>
                  <ul className="space-y-2.5 font-mono text-xs text-subtle">
                    <li>Brahmodya v1.0</li>
                    <li>AES-256-GCM key storage</li>
                    <li>Server-side turn runner</li>
                    <li>Rubric-scored deliverables</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-line">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle sm:flex-row sm:items-center sm:justify-between">
                  <p>© {new Date().getFullYear()} Tarka Sabha</p>
                  <p>tarka · reasoning &nbsp;·&nbsp; sabhā · assembly</p>
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
