"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DealerDashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratedDeals, setRatedDeals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadMyDeals();
  }, []);

  const loadMyDeals = async () => {
    try {
      const savedIds = JSON.parse(localStorage.getItem("dealdrop_my_deals") || "[]");
      if (savedIds.length === 0) {
        setLoading(false);
        return;
      }
      
      const fetches = savedIds.map((id: string) => fetch(`/api/deals/${id}`).then(r => r.json()));
      const results = await Promise.all(fetches);
      const validDeals = results.map(r => r.deal).filter(Boolean);
      
      validDeals.sort((a,b) => new Date(b.created_at || b.starts_at).getTime() - new Date(a.created_at || a.starts_at).getTime());
      setDeals(validDeals);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    loadMyDeals();
  };

  const updateUnits = async (id: string, currentAvail: number, claimed: number) => {
    const amt = parseInt(prompt("Enter new total available stock amount:", currentAvail.toString()) || "");
    if (!isNaN(amt) && amt > 0) {
      if (amt < claimed) {
        alert(`Cannot set stock lower than already claimed units (${claimed})`);
        return;
      }
      await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units_available: amt })
      });
      loadMyDeals();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pb-20">
      <div className="max-w-xl w-full bg-white min-h-screen shadow-sm border-x border-gray-100 p-6 object-contain">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-brand-navy">My Store Deals</h1>
          <div className="flex gap-2">
            <Link href="/dealer/scan" className="bg-brand-navy text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 hover:bg-gray-800 transition-colors">
              <span>📷</span> Scan QR
            </Link>
            <Link href="/dealer" className="bg-brand-orange text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-orange-dark transition-colors">
              + New Deal
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading your deals...</p>
        ) : deals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-4xl block mb-4">🏪</span>
            <p className="text-gray-500 mb-4">You haven't posted any active deals from this device yet.</p>
            <Link href="/dealer" className="text-brand-orange font-medium hover:underline">Post your first deal →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map(deal => (
              <div key={deal.id} className="bg-white border text-left border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-brand-navy">{deal.product_name}</h3>
                    <p className="text-xs text-gray-500">{deal.store_name} · {deal.discount_pct}% OFF</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${deal.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {deal.status === 'active' ? 'LIVE' : 'ENDED'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-brand-navy">{deal.units_claimed || 0} / {deal.units_available}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium mt-1">Units Claimed</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-brand-navy">{deal.live_viewers || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium mt-1">Live Viewers</div>
                  </div>
                </div>

                {deal.status === 'active' && (
                  <div className="flex gap-2 border-t border-gray-100 pt-4 mt-2">
                    <button 
                      onClick={() => updateStatus(deal.id, 'sold_out')}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      Mark Sold Out
                    </button>
                    <button
                      onClick={() => updateUnits(deal.id, deal.units_available, deal.units_claimed || 0)}
                      className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Edit Stock
                    </button>
                  </div>
                )}
                
                {(deal.units_claimed || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {!ratedDeals[deal.id] ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Rate Buyers:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={async () => {
                                await fetch("/api/reviews", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    deal_id: deal.id,
                                    store_id: deal.id, // Demo fallback
                                    reviewer_type: "dealer",
                                    rating: star
                                  })
                                });
                                setRatedDeals(prev => ({ ...prev, [deal.id]: true }));
                              }}
                              className="text-lg hover:scale-110 transition-transform"
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-center font-medium text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                        Buyers Rated!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-around py-3">
          <Link href="/" className="text-sm font-semibold text-gray-400 hover:text-brand-navy">Back Home</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-400 hover:text-brand-navy">Feed</Link>
        </div>
      </nav>
    </div>
  );
}
