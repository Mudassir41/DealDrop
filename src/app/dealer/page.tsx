"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DealFormData {
  storeName: string;
  storeCategory: string;
  storeAddress: string;
  storeCity: string;
  storePhone: string;
  productName: string;
  description: string;
  discountPct: number;
  originalPrice: number;
  unitsAvailable: number;
  durationMinutes: number;
  geofenceRadius: number;
  telegramEnabled: boolean;
}

const CATEGORIES = [
  { value: "food", label: "🍞 Food & Bakery", color: "bg-orange-50 border-orange-200" },
  { value: "grocery", label: "🥬 Grocery", color: "bg-green-50 border-green-200" },
  { value: "fashion", label: "👗 Fashion", color: "bg-purple-50 border-purple-200" },
  { value: "electronics", label: "📱 Electronics", color: "bg-blue-50 border-blue-200" },
  { value: "pharmacy", label: "💊 Pharmacy", color: "bg-red-50 border-red-200" },
  { value: "other", label: "📦 Other", color: "bg-gray-50 border-gray-200" },
];

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "End of day" },
];

const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
];

export default function DealerPage() {
  const [step, setStep] = useState<"store" | "deal" | "live">("store");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advisor, setAdvisor] = useState<any>(null);
  const [liveDeal, setLiveDeal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 12.9716, lng: 77.5946 }) // Default: Bangalore
      );
    } else {
      setLocation({ lat: 12.9716, lng: 77.5946 });
    }
  }, []);

  const [form, setForm] = useState<DealFormData>({
    storeName: "",
    storeCategory: "food",
    storeAddress: "",
    storeCity: "Bangalore",
    storePhone: "",
    productName: "",
    description: "",
    discountPct: 30,
    originalPrice: 100,
    unitsAvailable: 20,
    durationMinutes: 60,
    geofenceRadius: 1000,
    telegramEnabled: true,
  });

  const updateForm = (field: keyof DealFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Trigger advisor when category or discount changes
    if (field === "storeCategory" || field === "discountPct") {
      fetchAdvisor(
        field === "storeCategory" ? value : form.storeCategory,
        form.unitsAvailable,
        field === "discountPct" ? value : form.discountPct
      );
    }
  };

  const fetchAdvisor = async (category: string, units: number, discount: number) => {
    try {
      const res = await fetch(`/api/advisor?category=${category}&units=${units}&discount=${discount}`);
      const data = await res.json();
      setAdvisor(data);
    } catch {
      // Silent fail — advisor is enhancement, not critical
    }
  };

  const handleStoreSubmit = () => {
    if (!form.storeName.trim()) return;
    setStep("deal");
    fetchAdvisor(form.storeCategory, form.unitsAvailable, form.discountPct);
  };

  const handleGoLive = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: location?.lat || 12.9716,
          longitude: location?.lng || 77.5946,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create deal");
      setLiveDeal(data);
      setStep("live");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-lg font-bold text-brand-navy">Deal<span className="text-brand-orange">Drop</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {["Store", "Deal", "Live"].map((s, i) => {
                const stepOrder = ["store", "deal", "live"];
                const currentIdx = stepOrder.indexOf(step);
                const isActive = i <= currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${isActive ? "bg-brand-orange text-white" : "bg-gray-100 text-gray-400"}`}>
                      {i + 1}
                    </div>
                    {i < 2 && <div className={`w-6 h-[2px] ${isActive && i < currentIdx ? "bg-brand-orange" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Store Registration Step */}
        {step === "store" && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">Set up your store</h1>
            <p className="text-gray-500 mb-8">Tell us about your business. This takes about 30 seconds.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Store name</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => updateForm("storeName", e.target.value)}
                  placeholder="e.g. Mehta Bakery"
                  className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => updateForm("storeCategory", cat.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        form.storeCategory === cat.value
                          ? "border-brand-orange bg-orange-50 text-brand-orange ring-2 ring-brand-orange/20"
                          : `${cat.color} text-gray-600 hover:border-gray-300`
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">City</label>
                  <input
                    type="text"
                    value={form.storeCity}
                    onChange={(e) => updateForm("storeCity", e.target.value)}
                    placeholder="Bangalore"
                    className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Phone</label>
                  <input
                    type="tel"
                    value={form.storePhone}
                    onChange={(e) => updateForm("storePhone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Store address</label>
                <input
                  type="text"
                  value={form.storeAddress}
                  onChange={(e) => updateForm("storeAddress", e.target.value)}
                  placeholder="Shop #12, MG Road, Koramangala"
                  className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                />
              </div>

              <button
                onClick={handleStoreSubmit}
                disabled={!form.storeName.trim()}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-semibold text-base hover:bg-brand-orange-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Continue to Deal →
              </button>
            </div>
          </div>
        )}

        {/* Deal Form Step */}
        {step === "deal" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-brand-navy mb-2">Create flash deal</h1>
                <p className="text-gray-500">What are you selling today?</p>
              </div>
              <button onClick={() => setStep("store")} className="text-sm text-gray-400 hover:text-brand-navy transition-colors">
                ← Back
              </button>
            </div>

            {/* AI Advisor Card */}
            {advisor && (
              <div className="bg-brand-cream border border-orange-100 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🧠</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-1">AI Advisor</div>
                    <p className="text-sm text-brand-navy leading-relaxed">{advisor.message}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 border border-gray-100">
                        📊 {advisor.predictedRedemptions} predicted claims
                      </span>
                      <span className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 border border-gray-100">
                        🎯 {Math.round(advisor.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Product name</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => updateForm("productName", e.target.value)}
                  placeholder="e.g. Fresh Whole Wheat Bread"
                  className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="400g loaves, baked fresh this morning. Must sell today."
                  rows={2}
                  className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Original price (₹)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => updateForm("originalPrice", Number(e.target.value))}
                    className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Discount: {form.discountPct}%</label>
                  <input
                    type="range"
                    min={5}
                    max={90}
                    value={form.discountPct}
                    onChange={(e) => updateForm("discountPct", Number(e.target.value))}
                    className="w-full mt-3 accent-brand-orange"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5%</span>
                    <span className="font-semibold text-brand-orange">
                      Sale: ₹{Math.round(form.originalPrice * (1 - form.discountPct / 100))}
                    </span>
                    <span>90%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Units</label>
                  <input
                    type="number"
                    value={form.unitsAvailable}
                    onChange={(e) => updateForm("unitsAvailable", Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Duration</label>
                  <select
                    value={form.durationMinutes}
                    onChange={(e) => updateForm("durationMinutes", Number(e.target.value))}
                    className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Radius</label>
                  <select
                    value={form.geofenceRadius}
                    onChange={(e) => updateForm("geofenceRadius", Number(e.target.value))}
                    className="w-full px-4 py-3 bg-brand-cream border border-orange-100 rounded-xl text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                  >
                    {RADIUS_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Channel Toggle */}
              <div className="bg-brand-cream rounded-2xl p-5 border border-orange-100">
                <label className="block text-sm font-medium text-brand-navy mb-3">Notification channels</label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <div className="text-sm font-medium text-brand-navy">Telegram Bot</div>
                      <div className="text-xs text-gray-400">Free · Instant delivery</div>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full cursor-pointer transition-colors flex items-center px-1 ${form.telegramEnabled ? "bg-brand-emerald" : "bg-gray-200"}`}
                    onClick={() => updateForm("telegramEnabled", !form.telegramEnabled)}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.telegramEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoLive}
                disabled={!form.productName.trim() || isSubmitting}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-semibold text-base hover:bg-brand-orange-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Going Live...
                  </>
                ) : (
                  <>🚀 Go Live</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Deal Dashboard */}
        {step === "live" && liveDeal && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold text-brand-navy mb-2">Deal is live!</h1>
              <p className="text-gray-500">
                {liveDeal.notifyCount > 0
                  ? `${liveDeal.notifyCount} customers notified via Telegram`
                  : "Your deal is now visible on the map"}
              </p>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-brand-cream rounded-2xl p-5 text-center border border-orange-100">
                <div className="text-3xl font-bold text-brand-navy">{liveDeal.deal?.live_viewers || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Viewing now</div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-5 text-center border border-emerald-100">
                <div className="text-3xl font-bold text-brand-emerald">{liveDeal.deal?.units_claimed || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Claimed</div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-5 text-center border border-blue-100">
                <div className="text-3xl font-bold text-blue-600">{liveDeal.notifyCount || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Notified</div>
              </div>
            </div>

            {/* Deal Card Preview */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-1">{liveDeal.deal?.store_name}</div>
                  <h3 className="text-lg font-semibold text-brand-navy">{liveDeal.deal?.product_name}</h3>
                </div>
                <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                  {liveDeal.deal?.discount_pct}% OFF
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{liveDeal.deal?.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>📦 {(liveDeal.deal?.units_available || 0) - (liveDeal.deal?.units_claimed || 0)} remaining</span>
                <span>⏱ {form.durationMinutes} min window</span>
                <span>📍 {form.geofenceRadius}m radius</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/deals"
                className="flex-1 bg-brand-cream text-brand-navy py-3 rounded-xl font-semibold text-center text-sm hover:bg-orange-100 transition-colors border border-orange-100"
              >
                View on Map
              </Link>
              <button
                onClick={() => { setStep("deal"); setLiveDeal(null); }}
                className="flex-1 bg-brand-orange text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-orange-dark transition-colors"
              >
                Post Another Deal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
