"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Animated counter component
function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-subtle border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-bold text-brand-navy">Deal<span className="text-brand-orange">Drop</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">How It Works</Link>
            <Link href="#features" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">Features</Link>
            <Link href="/deals" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">Browse Deals</Link>
            <Link href="/dealer" className="bg-brand-orange text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-orange-dark transition-colors shadow-sm">
              I&apos;m a Retailer
            </Link>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-3 bg-white border-t border-gray-100">
            <Link href="#how-it-works" className="block text-sm text-gray-600 py-2">How It Works</Link>
            <Link href="#features" className="block text-sm text-gray-600 py-2">Features</Link>
            <Link href="/deals" className="block text-sm text-gray-600 py-2">Browse Deals</Link>
            <Link href="/dealer" className="block bg-brand-orange text-white px-5 py-2.5 rounded-full text-sm font-semibold text-center">
              I&apos;m a Retailer
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-cream px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-brand-emerald rounded-full urgency-pulse"></span>
              <span className="text-sm font-medium text-brand-navy">Live deals happening right now near you</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-brand-navy leading-[1.1] mb-6">
              From overstock
              <br />
              to <span className="text-brand-orange">sold out</span>,
              <br />
              in 3 minutes.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-10 leading-relaxed">
              Local retailers post flash deals. You get instant Telegram alerts.
              No app to install. No algorithms. Just real deals, real close.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/onboard"
                className="bg-brand-orange text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-brand-orange-dark transition-all shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/30 text-center"
              >
                🛍️ I&apos;m a Buyer
              </Link>
              <Link
                href="/dealer"
                className="border-2 border-gray-200 text-brand-navy px-8 py-4 rounded-full text-base font-semibold hover:border-brand-orange hover:text-brand-orange transition-all text-center"
              >
                📦 I&apos;m a Retailer →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand-cream py-8 border-y border-orange-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-navy"><Counter end={3} suffix=" min" /></div>
              <div className="text-sm text-gray-500 mt-1">To go live</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-navy"><Counter end={500} suffix="m" /></div>
              <div className="text-sm text-gray-500 mt-1">Geofence reach</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-navy"><Counter end={4} /></div>
              <div className="text-sm text-gray-500 mt-1">Ad channels unified</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-navy"><Counter prefix="₹" end={0} /></div>
              <div className="text-sm text-gray-500 mt-1">To start (Telegram is free)</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">How DealDrop works</h2>
            <p className="text-gray-500 max-w-md mx-auto">Three steps. No friction. Just deals flowing from your shelf to their hands.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Retailer posts a deal",
                desc: "50% off bread, 30 units, 1 hour window. Fill the form, tap Go Live. That's it.",
                icon: "📦",
                color: "bg-orange-50 border-orange-100",
              },
              {
                step: "02",
                title: "AI matches nearby customers",
                desc: "Our matching agent finds subscribers within your geofence, filtered by their preferences.",
                icon: "🤖",
                color: "bg-emerald-50 border-emerald-100",
              },
              {
                step: "03",
                title: "Instant Telegram alert",
                desc: "Customer gets a message with deal details, directions, and a claim button. No app needed.",
                icon: "📱",
                color: "bg-blue-50 border-blue-100",
              },
            ].map((item) => (
              <div key={item.step} className={`deal-card rounded-2xl p-8 border ${item.color}`}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-brand-navy mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Architecture Section */}
      <section className="py-24 px-6 bg-brand-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">Powered by 6 autonomous agents</h2>
            <p className="text-gray-500 max-w-lg mx-auto">You post a deal. Six intelligent agents handle the rest — from validation to notification to analytics.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Deal Lifecycle", desc: "Validates, enriches, schedules expiry", icon: "🔄", status: "Always on" },
              { name: "Customer Match", desc: "PostGIS geo queries + persona scoring", icon: "🎯", status: "Per deal" },
              { name: "Notify Dispatch", desc: "Multi-channel with rate limiting", icon: "📨", status: "Real-time" },
              { name: "Ad Placement", desc: "Auto-campaigns on Google & Meta", icon: "📢", status: "On boost" },
              { name: "AI Advisor", desc: "Timing, pricing & channel suggestions", icon: "🧠", status: "Nightly + inline" },
              { name: "Analytics", desc: "Live counters, ROAS, channel attribution", icon: "📊", status: "Every 15 min" },
            ].map((agent) => (
              <div key={agent.name} className="bg-white rounded-2xl p-6 border border-gray-100 deal-card">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{agent.icon}</span>
                  <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">{agent.status}</span>
                </div>
                <h3 className="font-semibold text-brand-navy mb-1">{agent.name} Agent</h3>
                <p className="text-sm text-gray-500">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">Built for Indian retail</h2>
            <p className="text-gray-500 max-w-md mx-auto">Every feature designed for the neighbourhood retailer — bakeries, kirana stores, pharmacies, boutiques.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Ambient Push, Not Pull",
                desc: "Customers don't need to open an app. Deals arrive on Telegram the instant they go live.",
                tag: "Core Philosophy",
              },
              {
                title: "AI Deal Timer",
                desc: "Our advisor analyses your category and suggests the perfect flash sale window — Friday 5-7 PM for bakeries, weekend mornings for groceries.",
                tag: "Smart Timing",
              },
              {
                title: "Social Stampede Signals",
                desc: "Real-time counters show how many people are viewing and claiming. Authentic urgency, not manufactured scarcity.",
                tag: "Social Proof",
              },
              {
                title: "One-Click Ad Boost",
                desc: "A single Boost button triggers coordinated campaigns across Google, Instagram, and WhatsApp with auto-generated creative.",
                tag: "Amplification",
              },
              {
                title: "Persona-Driven Matching",
                desc: "Students see food deals. Parents see grocery offers. Every customer gets only what matters to them.",
                tag: "Personalisation",
              },
              {
                title: "Request Delivery",
                desc: "Can't visit the store? Request delivery right from the deal card. Quick commerce meets local retail.",
                tag: "Coming Soon",
              },
            ].map((feat) => (
              <div key={feat.title} className="bg-white rounded-2xl p-8 border border-gray-100 deal-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-orange-50 px-3 py-1.5 rounded-full">{feat.tag}</span>
                <h3 className="text-xl font-semibold text-brand-navy mt-4 mb-2">{feat.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram CTA */}
      <section className="py-24 px-6 bg-brand-navy text-white">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-5xl mb-6 block">📱</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get deals on Telegram</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            No app to download. No account to create. Just tap the button, pick your preferences, and start receiving deals.
          </p>
          <a
            href="https://t.me/dealdrop_alertbot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#0088cc] text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-[#0077b5] transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Open DealDrop Bot on Telegram
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-orange rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-sm font-semibold text-brand-navy">DealDrop</span>
          </div>
          <p className="text-sm text-gray-400">
            Built for Vashisht Hackathon 3.0 · IIITDM Kancheepuram · RetailTech Track
          </p>
          <div className="flex items-center gap-4">
            <Link href="/deals" className="text-sm text-gray-500 hover:text-brand-navy transition-colors">Deals</Link>
            <Link href="/dealer" className="text-sm text-gray-500 hover:text-brand-navy transition-colors">Dealers</Link>
            <a href="https://github.com/Mudassir41/DealDrop" target="_blank" className="text-sm text-gray-500 hover:text-brand-navy transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
