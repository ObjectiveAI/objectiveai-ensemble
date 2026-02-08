import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import SonarlyTracker from "@/components/SonarlyTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ObjectiveAI",
    template: "%s | ObjectiveAI",
  },
  description:
    "Score everything. Rank everything. Simulate anyone. A REST API platform for scoring, ranking, and simulating preferences using ensembles of LLMs.",
  metadataBase: new URL("https://objective-ai.io"),
  openGraph: {
    type: "website",
    siteName: "ObjectiveAI",
    title: "ObjectiveAI",
    description:
      "Score everything. Rank everything. Simulate anyone. A REST API platform for scoring, ranking, and simulating preferences using ensembles of LLMs.",
    url: "https://objective-ai.io",
  },
  twitter: {
    card: "summary",
    title: "ObjectiveAI",
    description:
      "Score everything. Rank everything. Simulate anyone. A REST API platform using ensembles of LLMs.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SonarlyTracker />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
