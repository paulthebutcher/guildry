import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guildry | Project Intelligence Platform",
  description:
    "AI-powered project intelligence for agencies, studios, and consultancies. Scope projects, staff teams, manage clients, and learn from retrospectives through natural language conversations.",
  keywords: [
    "project management",
    "project scoping",
    "team staffing",
    "client management",
    "project retrospectives",
    "AI assistant",
    "agency tools",
    "consultancy software",
  ],
  authors: [{ name: "Guildry" }],
  creator: "Guildry",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://guildry.com",
    title: "Guildry | Project Intelligence Platform",
    description:
      "AI-powered project intelligence for agencies, studios, and consultancies.",
    siteName: "Guildry",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guildry | Project Intelligence Platform",
    description:
      "AI-powered project intelligence for agencies, studios, and consultancies.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
