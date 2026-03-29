"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "deal_alert" | "deal_claimed" | "deal_expired";
  title: string;
  message: string;
  deal_id: string;
  read: boolean;
  time_ago: string;
  created_at: string;
}

function generateMockNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: "n1",
      type: "deal_alert",
      title: "🍞 50% OFF at Mehta Bakery",
      message: "Fresh Whole Wheat Bread — only 20 left! 500m from you.",
      deal_id: "demo-1",
      read: false,
      time_ago: "2 min ago",
      created_at: new Date(now - 2 * 60 * 1000).toISOString(),
    },
    {
      id: "n2",
      type: "deal_alert",
      title: "👗 60% OFF at StyleHub Fashion",
      message: "Cotton Kurtas end-of-season clearance. 32 units available.",
      deal_id: "demo-2",
      read: false,
      time_ago: "15 min ago",
      created_at: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "n3",
      type: "deal_claimed",
      title: "✅ Deal Claimed Successfully",
      message: "You claimed Organic Mangoes at FreshMart. Show this at the store.",
      deal_id: "demo-3",
      read: true,
      time_ago: "1 hour ago",
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    },
    {
      id: "n4",
      type: "deal_expired",
      title: "⏰ Deal Expired",
      message: "Vitamin D3 Supplements at PharmaCare — this deal has ended.",
      deal_id: "demo-4",
      read: true,
      time_ago: "3 hours ago",
      created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In MVP, generate mock notifications based on seed deals
    setNotifications(generateMockNotifications());
    setLoading(false);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-brand-navy">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-brand-navy">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-brand-orange text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-brand-orange font-medium hover:text-brand-orange-dark">
              Mark all read
            </button>
          )}
        </div>
      </nav>

      {/* Notification List */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🔔</span>
            <h3 className="text-lg font-semibold text-brand-navy mb-2">No notifications yet</h3>
            <p className="text-sm text-gray-500">
              Deals matching your profile will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <Link
                key={notif.id}
                href="/dashboard"
                className={`block rounded-2xl p-4 border transition-all deal-card ${
                  notif.read
                    ? "bg-white border-gray-100"
                    : "bg-orange-50 border-orange-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? "bg-gray-200" : "bg-brand-orange urgency-pulse"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${notif.read ? "text-gray-600" : "text-brand-navy"}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time_ago}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Telegram CTA */}
        <div className="mt-8 bg-brand-cream rounded-2xl p-5 border border-orange-100 text-center">
          <span className="text-3xl block mb-2">📱</span>
          <h3 className="font-semibold text-brand-navy text-sm mb-1">Get instant alerts</h3>
          <p className="text-xs text-gray-500 mb-3">
            Don&apos;t miss deals — get them pushed to Telegram the moment they go live.
          </p>
          <a
            href="https://t.me/dealdrop_alertbot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0088cc] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0077b5] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Connect Telegram Bot
          </a>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px]">Home</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[10px]">Deals</span>
          </Link>
          <Link href="/dealer" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Post</span>
          </Link>
          <Link href="/notifications" className="relative flex flex-col items-center gap-0.5 py-1 px-3 text-brand-orange">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <span className="text-[10px] font-medium">Alerts</span>
            {unreadCount > 0 && <span className="absolute top-0 right-2 w-2 h-2 bg-brand-orange rounded-full" />}
          </Link>
        </div>
      </nav>
    </div>
  );
}
