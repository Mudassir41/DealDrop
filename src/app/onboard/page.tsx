"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


const PERSONAS = [
  { id: "student", emoji: "🎓", label: "Student", desc: "Hostel life, budget eats, tech deals", color: "bg-blue-50 border-blue-200" },
  { id: "parent", emoji: "👨‍👩‍👧", label: "Parent / Family", desc: "Groceries, pharmacy, kids' stuff", color: "bg-green-50 border-green-200" },
  { id: "worker", emoji: "💼", label: "Office Worker", desc: "Lunch deals, quick pickups", color: "bg-purple-50 border-purple-200" },
  { id: "homemaker", emoji: "🏠", label: "Homemaker", desc: "Grocery, household, daily needs", color: "bg-orange-50 border-orange-200" },
  { id: "hunter", emoji: "🛍️", label: "Deal Hunter", desc: "Everything with big discounts!", color: "bg-red-50 border-red-200" },
];

const CATEGORIES = [
  { id: "food", emoji: "🍞", label: "Food & Bakery" },
  { id: "grocery", emoji: "🥬", label: "Grocery" },
  { id: "fashion", emoji: "👗", label: "Fashion" },
  { id: "electronics", emoji: "📱", label: "Electronics" },
  { id: "pharmacy", emoji: "💊", label: "Pharmacy" },
];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const syncToSupabase = async (profile: any, loc: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona: profile.persona,
            categories: profile.categories,
            latitude: loc?.lat,
            longitude: loc?.lng,
          }),
        });
      }
    } catch (e) {
      console.warn("Could not sync profile to cloud, remaining in local mode.");
    }
  };

  const handleComplete = () => {
    setLoading(true);
    const finalCategories = selectedCategories.length > 0 ? selectedCategories : CATEGORIES.map(c => c.id);
    
    // 1. Initial Local Save
    const profile = {
      persona: selectedPersona,
      categories: finalCategories,
      onboarded: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("dealdrop_profile", JSON.stringify(profile));

    // 2. Location + Deep Sync
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          localStorage.setItem("dealdrop_location", JSON.stringify(loc));
          await syncToSupabase(profile, loc);
          router.push("/dashboard");
        },
        async () => {
          await syncToSupabase(profile, null);
          router.push("/dashboard");
        }
      );
    } else {
      syncToSupabase(profile, null).then(() => router.push("/dashboard"));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-lg font-bold text-brand-navy">Deal<span className="text-brand-orange">Drop</span></span>
          </Link>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full transition-colors ${s <= step ? "bg-brand-orange" : "bg-gray-200"}`} />
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-lg mx-auto px-6 py-8 w-full">
        {/* Step 1: Persona Selection */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">Who are you?</h1>
            <p className="text-gray-500 mb-8">Pick what describes you best. We&apos;ll show deals that actually matter to you.</p>

            <div className="space-y-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedPersona === p.id
                      ? "border-brand-orange bg-orange-50 ring-2 ring-brand-orange/20"
                      : `${p.color} hover:border-gray-300`
                  }`}
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <div className="font-semibold text-brand-navy">{p.label}</div>
                    <div className="text-sm text-gray-500">{p.desc}</div>
                  </div>
                  {selectedPersona === p.id && (
                    <span className="ml-auto text-brand-orange text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedPersona}
              className="w-full mt-8 bg-brand-orange text-white py-4 rounded-xl font-semibold text-base hover:bg-brand-orange-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Category Preferences */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-brand-navy">What interests you?</h1>
              <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-brand-navy">← Back</button>
            </div>
            <p className="text-gray-500 mb-8">Select categories. Skip to get everything.</p>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedCategories.includes(cat.id)
                      ? "border-brand-orange bg-orange-50 ring-2 ring-brand-orange/20"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="font-medium text-sm text-brand-navy">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => setStep(3)}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-semibold text-base hover:bg-brand-orange-dark transition-colors shadow-sm"
              >
                Continue →
              </button>
              <button
                onClick={() => { setSelectedCategories([]); setStep(3); }}
                className="w-full text-sm text-gray-400 hover:text-brand-navy transition-colors py-2"
              >
                Skip — show me everything
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location + Telegram */}
        {step === 3 && (
          <div className="animate-fade-in text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📍</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-navy mb-2">Almost there!</h1>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Allow location access so we can find deals near you. We&apos;ll never share your exact location.
            </p>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-brand-orange text-white py-4 rounded-xl font-semibold text-base hover:bg-brand-orange-dark transition-colors shadow-lg shadow-brand-orange/20 mb-4 disabled:opacity-50"
            >
              {loading ? "Syncing..." : "📍 Enable Location & Start"}
            </button>

            <a
              href="https://t.me/dealdrop_alertbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#0088cc] text-sm font-medium hover:text-[#0077b5] transition-colors mb-6"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Also get alerts on Telegram →
            </a>

            <div className="bg-brand-cream rounded-2xl p-5 border border-orange-100 text-left">
              <div className="text-sm font-semibold text-brand-navy mb-2">Your profile:</div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 border border-gray-100">
                  {PERSONAS.find(p => p.id === selectedPersona)?.emoji} {PERSONAS.find(p => p.id === selectedPersona)?.label}
                </span>
                {(selectedCategories.length > 0 ? selectedCategories : CATEGORIES.map(c => c.id)).map((catId) => {
                  const cat = CATEGORIES.find(c => c.id === catId);
                  return (
                    <span key={catId} className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 border border-gray-100">
                      {cat?.emoji} {cat?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
