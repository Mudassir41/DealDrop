"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import Leaflet to avoid SSR issues
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
}

const CATEGORY_FILTERS = [
  { value: "all", label: "All Deals", icon: "🔥" },
  { value: "food", label: "Food", icon: "🍞" },
  { value: "grocery", label: "Grocery", icon: "🥬" },
  { value: "fashion", label: "Fashion", icon: "👗" },
  { value: "electronics", label: "Electronics", icon: "📱" },
  { value: "pharmacy", label: "Pharmacy", icon: "💊" },
];

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const remaining = deal.units_available - deal.units_claimed;
  const urgency = remaining <= 5;
  const salePrice = deal.original_price ? Math.round(deal.original_price * (1 - deal.discount_pct / 100)) : null;

  return (
    <div
      onClick={onClick}
      className="deal-card bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-400 mb-1">{deal.store_name}</div>
          <h3 className="text-base font-semibold text-brand-navy truncate">{deal.product_name}</h3>
        </div>
        <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ml-3">
          {deal.discount_pct}% OFF
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{deal.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {salePrice && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-brand-navy">₹{salePrice}</span>
              <span className="text-sm text-gray-400 line-through">₹{deal.original_price}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        <span className={`text-xs px-2 py-1 rounded-full ${urgency ? "bg-red-50 text-red-500 urgency-pulse" : "bg-gray-50 text-gray-500"}`}>
          📦 {remaining} left
        </span>
        <span className="text-xs text-gray-400">
          ⏱ {timeRemaining(deal.expires_at)}
        </span>
        <span className="text-xs text-gray-400">
          👀 {deal.live_viewers}
        </span>
        {deal.distance && (
          <span className="text-xs text-gray-400 ml-auto">
            📍 {deal.distance >= 1000 ? `${(deal.distance / 1000).toFixed(1)}km` : `${deal.distance}m`}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      let url = "/api/deals";
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("category", activeFilter);
      if (userLocation) {
        params.set("lat", userLocation.lat.toString());
        params.set("lng", userLocation.lng.toString());
        params.set("radius", "5000");
      }
      if (params.toString()) url += `?${params}`;

      const res = await fetch(url);
      const data = await res.json();
      setDeals(data.deals || []);
    } catch {
      // Use empty array on error
    } finally {
      setLoading(false);
    }
  }, [activeFilter, userLocation]);

  useEffect(() => {
    // Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 12.9716, lng: 77.5946 }) // Default: Bangalore
      );
    } else {
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchDeals]);

  const filteredDeals = activeFilter === "all" ? deals : deals.filter((d) => d.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-lg font-bold text-brand-navy">Deal<span className="text-brand-orange">Drop</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://t.me/dealdrop_alertbot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088cc] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0077b5] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Get Alerts
            </a>
            <Link href="/dealer" className="text-sm text-gray-500 hover:text-brand-navy transition-colors">
              For Retailers →
            </Link>
          </div>
        </div>

        {/* Category Filters */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === cat.value
                    ? "bg-brand-orange text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* Map */}
        <div className="flex-1 min-h-[300px] lg:min-h-0">
          {userLocation && (
            <DealMap
              deals={filteredDeals}
              center={userLocation}
              onDealClick={setSelectedDeal}
            />
          )}
        </div>

        {/* Deal List Sidebar */}
        <div className="w-full lg:w-[380px] bg-white border-l border-gray-100 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-navy">
                {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""} near you
              </h2>
              <button onClick={fetchDeals} className="text-xs text-brand-orange hover:text-brand-orange-dark transition-colors">
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="text-gray-500 text-sm">No active deals in this category right now.</p>
                <p className="text-gray-400 text-xs mt-2">Check back soon or subscribe on Telegram for alerts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onClick={() => setSelectedDeal(deal)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/deals/${selectedDeal.id}/claim`, { method: "POST" });
                    setSelectedDeal(null);
                    fetchDeals();
                  } catch {}
                }}
                className="flex-1 bg-brand-orange text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-orange-dark transition-colors shadow-lg shadow-brand-orange/20"
              >
                ✅ Claim Deal
              </button>
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="flex-1 border-2 border-gray-200 text-brand-navy py-3.5 rounded-xl font-semibold text-sm hover:border-brand-orange hover:text-brand-orange transition-all"
              >
                🚚 Request Delivery
              </button>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDeal.latitude},${selectedDeal.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-brand-orange font-medium mt-4 hover:text-brand-orange-dark transition-colors"
            >
              📍 Get Directions →
            </a>
          </div>
        </div>
      )}

      {/* Delivery Request Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDeliveryModal(false)} />
          <div className="relative bg-white max-w-sm w-full mx-4 rounded-3xl p-6 text-center animate-slide-up">
            <span className="text-5xl block mb-4">🚚</span>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Delivery Requested!</h3>
            <p className="text-sm text-gray-500 mb-6">
              We&apos;ll notify the retailer and connect you with a delivery partner.
              Estimated delivery: 15-30 minutes.
            </p>
            <div className="bg-emerald-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center text-emerald-600 text-sm font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full urgency-pulse" />
                Looking for delivery partner...
              </div>
            </div>
            <button
              onClick={() => setShowDeliveryModal(false)}
              className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-orange-dark transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
