import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guildry",
  description: "Guildry - Your platform for building and managing guilds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
