import type { Metadata } from "next";
import "./globals.css";
import AIChatBar from "@/components/AIChatBar";

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
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-1 pb-24">
          {children}
        </main>
        <AIChatBar />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
