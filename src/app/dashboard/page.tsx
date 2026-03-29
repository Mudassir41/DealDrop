"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const DealMap = dynamic(() => import("@/components/DealMap"), { ssr: false });

interface Deal {
  id: string;
  store_name: string;
  product_name: string;
  description: string;
  category: string;
  discount_pct: number;
  original_price: number | null;
  units_available: number;
  units_claimed: number;
  latitude: number;
  longitude: number;
  live_viewers: number;
  expires_at: string;
  distance?: number;
  score?: number;
}

interface Profile {
  persona: string;
  categories: string[];
}

const TABS = [
  { id: "foryou", label: "For You", icon: "✨" },
  { id: "nearby", label: "Nearby", icon: "📍" },
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "expiring", label: "Expiring", icon: "⏰" },
];

const PERSONA_LABELS: Record<string, { emoji: string; label: string }> = {
  student: { emoji: "🎓", label: "Student" },
  parent: { emoji: "👨‍👩‍👧", label: "Parent" },
  worker: { emoji: "💼", label: "Worker" },
  homemaker: { emoji: "🏠", label: "Homemaker" },
  hunter: { emoji: "🛍️", label: "Deal Hunter" },
};

const AREA_PRESETS = [
  { label: "Vandalur", lat: 12.9010, lng: 80.0990 },
  { label: "Tambaram", lat: 12.9249, lng: 80.1000 },
  { label: "Chromepet", lat: 12.9516, lng: 80.1462 },
  { label: "Guindy", lat: 13.0067, lng: 80.2206 },
  { label: "T. Nagar", lat: 13.0418, lng: 80.2341 },
  { label: "Anna Nagar", lat: 13.0850, lng: 80.2101 },
];

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("foryou");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Vandalur");

  // Load profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dealdrop_profile");
    if (!saved) {
      router.push("/onboard");
      return;
    }
    setProfile(JSON.parse(saved));

    const savedLoc = localStorage.getItem("dealdrop_location");
    const savedLabel = localStorage.getItem("dealdrop_location_label");
    if (savedLoc) {
      setLocation(JSON.parse(savedLoc));
      if (savedLabel) setLocationLabel(savedLabel);
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setLocationLabel("GPS Location");
          localStorage.setItem("dealdrop_location", JSON.stringify(loc));
        },
        () => {
          const fallback = { lat: 12.9010, lng: 80.0990 };
          setLocation(fallback);
          setShowLocationPicker(true);
        }
      );
    } else {
      setLocation({ lat: 12.9010, lng: 80.0990 });
      setShowLocationPicker(true);
    }
  }, [router]);

  const fetchFeed = useCallback(async () => {
    if (!profile || !location) return;
    try {
      const params = new URLSearchParams({
        persona: profile.persona,
        categories: profile.categories.join(","),
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        radius: "5000",
        tab: activeTab,
      });
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      setDeals(data.deals || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [profile, location, activeTab]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  const claimDeal = async (dealId: string) => {
    setClaiming(dealId);
    try {
      await fetch(`/api/deals/${dealId}/claim`, { method: "POST" });
      fetchFeed();
    } catch {
      // silent
    } finally {
      setClaiming(null);
      setSelectedDeal(null);
    }
  };

  if (!profile) return null;

  const personaInfo = PERSONA_LABELS[profile.persona] || PERSONA_LABELS.hunter;

  const setArea = (area: typeof AREA_PRESETS[0]) => {
    const loc = { lat: area.lat, lng: area.lng };
    setLocation(loc);
    setLocationLabel(area.label);
    localStorage.setItem("dealdrop_location", JSON.stringify(loc));
    localStorage.setItem("dealdrop_location_label", area.label);
    setShowLocationPicker(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Top Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <div className="text-sm font-bold text-brand-navy">DealDrop</div>
              <button
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="text-[10px] text-gray-400 flex items-center gap-1 hover:text-brand-orange transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full" />
                📍 {locationLabel} ▾
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-brand-cream text-brand-navy px-3 py-1.5 rounded-full font-medium border border-orange-100">
              {personaInfo.emoji} {personaInfo.label}
            </span>
            <Link href="/notifications" className="relative p-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange rounded-full" />
            </Link>
          </div>
        </div>

        {/* Location Picker Dropdown */}
        {showLocationPicker && (
          <div className="max-w-6xl mx-auto px-4 pb-3">
            <div className="bg-brand-cream rounded-xl p-3 border border-orange-100">
              <div className="text-xs font-medium text-brand-navy mb-2">📍 Select your area:</div>
              <div className="flex flex-wrap gap-2">
                {AREA_PRESETS.map((area) => (
                  <button
                    key={area.label}
                    onClick={() => setArea(area)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      locationLabel === area.label
                        ? "bg-brand-orange text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-brand-orange"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-orange text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content — responsive: side-by-side on desktop */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:h-[calc(100vh-120px)]">
        {/* Map — always visible on desktop, toggleable on mobile */}
        {(showMap || typeof window !== 'undefined') && location && (
          <div className={`${showMap ? 'block' : 'hidden lg:block'} w-full lg:flex-1 h-[250px] lg:h-full p-4`}>
            <DealMap deals={deals} center={location} onDealClick={setSelectedDeal} />
          </div>
        )}

        {/* Deal List */}
        <div className="w-full lg:w-[420px] lg:border-l lg:border-gray-100 overflow-y-auto p-4">
        {/* Greeting */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-brand-navy">
            {activeTab === "foryou" ? `${personaInfo.emoji} Deals for you` :
             activeTab === "nearby" ? "📍 Closest deals" :
             activeTab === "trending" ? "🔥 Hot right now" :
             "⏰ Expiring soon"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} near {locationLabel} · Refreshes every 15s
          </p>
        </div>

        {/* Deal Feed */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse border border-gray-100">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="text-lg font-semibold text-brand-navy mb-2">No deals yet</h3>
            <p className="text-sm text-gray-500 mb-4">No active deals match your preferences right now.</p>
            <a
              href="https://t.me/dealdrop_alertbot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0088cc] font-medium hover:text-[#0077b5]"
            >
              Get instant alerts on Telegram →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal, idx) => {
              const remaining = deal.units_available - deal.units_claimed;
              const urgency = remaining <= 5;
              const salePrice = deal.original_price
                ? Math.round(deal.original_price * (1 - deal.discount_pct / 100))
                : null;

              return (
                <div
                  key={deal.id}
                  className="deal-card bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => setSelectedDeal(deal)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{deal.store_name}</div>
                      <h3 className="text-base font-semibold text-brand-navy">{deal.product_name}</h3>
                    </div>
                    <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ml-3">
                      {deal.discount_pct}% OFF
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">{deal.description}</p>

                  {salePrice && (
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-bold text-brand-navy">₹{salePrice}</span>
                      <span className="text-sm text-gray-400 line-through">₹{deal.original_price}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                    <span className={`text-xs px-2 py-1 rounded-full ${urgency ? "bg-red-50 text-red-500 urgency-pulse" : "bg-gray-50 text-gray-500"}`}>
                      📦 {remaining} left
                    </span>
                    <span className="text-xs text-gray-400">⏱ {timeRemaining(deal.expires_at)}</span>
                    <span className="text-xs text-gray-400">👀 {deal.live_viewers}</span>
                    {deal.distance !== undefined && (
                      <span className="text-xs text-gray-400 ml-auto">
                        📍 {deal.distance >= 1000 ? `${(deal.distance / 1000).toFixed(1)}km` : `${deal.distance}m`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>{/* close deal list sidebar */}
      </div>{/* close flex container */}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedDeal(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
            <button
              onClick={() => setSelectedDeal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <span className="bg-brand-orange text-white px-4 py-1.5 rounded-full text-sm font-bold inline-block mb-4">
              {selectedDeal.discount_pct}% OFF
            </span>

            <h2 className="text-2xl font-bold text-brand-navy mb-1">{selectedDeal.product_name}</h2>
            <p className="text-sm text-brand-orange font-medium mb-4">{selectedDeal.store_name}</p>
            <p className="text-sm text-gray-500 mb-6">{selectedDeal.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-brand-cream rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-brand-navy">{selectedDeal.units_available - selectedDeal.units_claimed}</div>
                <div className="text-[10px] text-gray-500">Remaining</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-brand-emerald">{selectedDeal.live_viewers}</div>
                <div className="text-[10px] text-gray-500">Viewing</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{timeRemaining(selectedDeal.expires_at)}</div>
                <div className="text-[10px] text-gray-500">Left</div>
              </div>
            </div>

            {selectedDeal.original_price && (
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-brand-navy">
                  ₹{Math.round(selectedDeal.original_price * (1 - selectedDeal.discount_pct / 100))}
                </span>
                <span className="text-lg text-gray-400 line-through">₹{selectedDeal.original_price}</span>
              </div>
            )}

            <button
              onClick={() => claimDeal(selectedDeal.id)}
              disabled={claiming === selectedDeal.id}
              className="w-full bg-brand-orange text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-orange-dark transition-colors shadow-lg shadow-brand-orange/20 disabled:opacity-50 mb-3"
            >
              {claiming === selectedDeal.id ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Claiming...
                </span>
              ) : (
                "✅ Claim Deal"
              )}
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDeal.latitude},${selectedDeal.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-brand-orange font-medium hover:text-brand-orange-dark transition-colors"
            >
              📍 Get Directions →
            </a>
          </div>
        </div>
      )}

      {/* Bottom Navigation — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px]">Home</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 py-1 px-3 text-brand-orange">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" />
            </svg>
            <span className="text-[10px] font-medium">Deals</span>
          </Link>
          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 ${showMap ? "text-brand-orange" : "text-gray-400"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-[10px]">Map</span>
          </button>
          <Link href="/dealer" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Post</span>
          </Link>
          <Link href="/notifications" className="relative flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px]">Alerts</span>
            <span className="absolute top-0 right-2 w-2 h-2 bg-brand-orange rounded-full" />
          </Link>
        </div>
      </nav>
    </div>
  );
}
