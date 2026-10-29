import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaddleLog",
  description: "Track your paddles, sessions, and paddle history. PaddleLog by LeewayPB.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/icons/rally-dark.png",
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
