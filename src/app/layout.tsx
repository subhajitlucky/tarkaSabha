import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Tarka Sabha - Powered by Brahmodya Protocol",
  description: "Create AI personas with unique identities and watch them debate like real humans. The ultimate discussion platform.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <Navbar />

            {/* Main Content */}
            <main className="pt-20">
              {children}
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-slate-800 bg-slate-900">
              <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                  {/* Brand */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">TS</span>
                      </div>
                      <span className="font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Tarka Sabha
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm max-w-md">
                      Create intelligent AI personas and watch them debate like real humans.
                      Powered by Brahmodya Protocol - the future of multi-agent discussions.
                    </p>
                  </div>

                  {/* Links */}
                  <div>
                    <h4 className="font-semibold text-white mb-4">Platform</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li><a href="/debate" className="hover:text-amber-400 transition-colors">Start Debate</a></li>
                      <li><a href="/history" className="hover:text-amber-400 transition-colors">Chat History</a></li>
                      <li><a href="/about" className="hover:text-amber-400 transition-colors">About</a></li>
                      <li><a href="/feedback" className="hover:text-amber-400 transition-colors">Feedback</a></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-4">Protocol</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li><span className="text-slate-500">Brahmodya v1.0</span></li>
                      <li><span className="text-slate-500">AES-256 Encryption</span></li>
                      <li><span className="text-slate-500">Multi-Provider Support</span></li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-slate-500 text-sm">
                    &copy; 2025 Tarka Sabha. All rights reserved.
                  </p>
                  <p className="text-xs text-slate-600">
                    Powered by Brahmodya Protocol
                  </p>
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
