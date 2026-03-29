import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealDrop — Hyperlocal Flash Sales Near You",
  description:
    "Discover time-sensitive deals from local retailers within 500m. Instant Telegram alerts. No app install needed.",
  keywords: ["deals", "local", "flash sale", "hyperlocal", "discounts", "telegram"],
  openGraph: {
    title: "DealDrop — Hyperlocal Flash Sales",
    description: "From overstock to sold out, in under 3 minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
