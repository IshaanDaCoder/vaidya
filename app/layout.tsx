import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vaidya — Talk to a verified doctor, from anywhere in India",
  description:
    "Vaidya connects patients across India with verified doctors for online consultation. Your first consultation is free.",
};

const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("vaidya-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
      // The no-flash theme script below intentionally mutates this
      // element's class list before React hydrates, so a mismatch here
      // is expected and safe to suppress — this is the standard pattern
      // for theme-toggle scripts (e.g. next-themes uses the same fix).
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
