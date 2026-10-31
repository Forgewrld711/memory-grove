import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";

export const metadata: Metadata = {
  title: "Memory Grove",
  description:
    "A living, bilateral memory ecosystem for humans and their Muse agents.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
