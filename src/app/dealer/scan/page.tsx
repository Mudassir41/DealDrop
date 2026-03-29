"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function RetailerScanner() {
  const [view, setView] = useState<"camera" | "manual">("camera");
  const [mode, setMode] = useState<"input" | "success">("input");
  const [otp, setOtp] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (view === "camera" && mode === "input") {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [view, mode]);

  function onScanSuccess(decodedText: string) {
    if (!isProcessing) {
      verifyCode(decodedText);
    }
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

  const verifyCode = async (code: string) => {
    if (!code || code.length < 4) return;
    setIsProcessing(true);
    setScanError(null);

    // Stop scanner while processing to avoid double scans
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }

    try {
      const res = await fetch(`/api/redeem-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid Code");
      setScanResult(data);
      setMode("success");
    } catch (err: any) {
      setScanError(err.message || "Invalid code. Please try again.");
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(otp);
  };

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dealer/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2">
            ← <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Retailer Mode
          </div>
        </div>

        {mode === "success" && scanResult ? (
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-brand-navy mb-2">Verified!</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-100">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Redeemed Deal</div>
              <div className="font-bold text-brand-navy text-lg">{scanResult.product_name}</div>
              <div className="text-brand-orange font-semibold text-sm">{scanResult.discount_pct}% OFF</div>
              {scanResult.store_name && (
                <div className="text-xs text-gray-500 mt-1">@ {scanResult.store_name}</div>
              )}
            </div>
            <button
              onClick={() => { setScanResult(null); setOtp(""); setMode("input"); setScanError(null); }}
              className="w-full bg-brand-navy text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Verify Next Deal
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setView("camera")}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${view === "camera" ? "text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5" : "text-gray-400 hover:text-brand-navy"}`}
              >
                📸 QR Scanner
              </button>
              <button
                onClick={() => setView("manual")}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${view === "manual" ? "text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5" : "text-gray-400 hover:text-brand-navy"}`}
              >
                ⌨️ Manual Code
              </button>
            </div>

            <div className="p-8">
              {view === "camera" ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-xl font-bold text-brand-navy mb-1">Scan QR Code</h1>
                    <p className="text-gray-400 text-xs">Point camera at the customer's DealDrop screen</p>
                  </div>
                  
                  <div id="reader" className="w-full rounded-2xl overflow-hidden border-4 border-gray-50" />
                  
                  {isProcessing && (
                    <div className="mt-4 text-center text-brand-orange font-bold animate-pulse">
                      Processing Scan...
                    </div>
                  )}

                  {scanError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 text-center">
                      {scanError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-xl font-bold text-brand-navy mb-1">Enter Manual Code</h1>
                    <p className="text-gray-400 text-xs">Type the 6-digit code shown on the customer's phone</p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-orange transition-colors text-brand-navy"
                    />

                    {scanError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 text-center">
                        {scanError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={otp.length < 4 || isProcessing}
                      className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold disabled:opacity-40 hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying...</>
                      ) : (
                        <>✓ Verify Deal</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
