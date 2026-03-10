import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealPulse — Universal Sales Intelligence Agent",
  description:
    "Close more deals — wherever your conversations happen. AI sales agent for HubSpot, WhatsApp, email & more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
