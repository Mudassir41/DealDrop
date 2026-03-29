"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function RetailerQRScanner() {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  useEffect(() => {
    // html5-qrcode scanner requires the DOM element to exist
    setScannerReady(true);
  }, []);

  useEffect(() => {
    if (!scannerReady) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [0] // QR_CODE
    };

    const scanner = new Html5QrcodeScanner("qr-reader", config, false);

    scanner.render(
      async (decodedText: string) => {
        // Pause scanning to process
        scanner.pause(true);
        setIsProcessing(true);
        setScanError(null);

        try {
          // Expected format: dealId-chatId-timestamp
          const parts = decodedText.split("-");
          if (parts.length < 3) throw new Error("Unrecognized QR code format.");

          const dealId = parts[0];

          const res = await fetch(`/api/deals/${dealId}/redeem`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qr_code: decodedText })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to redeem deal");

          setScanResult(data);
        } catch (err: any) {
          setScanError(err.message || "Invalid QR code read.");
          // Resume scanning after 3s on error
          setTimeout(() => {
            setScanError(null);
            scanner.resume();
          }, 3000);
        } finally {
          setIsProcessing(false);
        }
      },
      (error) => {
        // continuous scanning errors, safe to ignore
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scannerReady]);

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

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Scan Customer QR</h1>
          <p className="text-gray-400 text-sm">Align the QR code within the frame to redeem the deal and award Drop Points.</p>
        </div>

        {/* Scanner or Result */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          
          {scanResult ? (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                ✅
              </div>
              <h2 className="text-2xl font-bold text-brand-navy mb-2">Success!</h2>
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left border border-gray-100">
                <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Redeemed Item</div>
                <div className="font-semibold text-brand-navy text-lg">{scanResult.deal.product}</div>
                <div className="text-brand-orange font-bold text-sm">{scanResult.deal.discount}% OFF applying</div>
              </div>

              {scanResult.points_awarded > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 py-2 rounded-lg mb-6">
                  ✨ Customer earned +{scanResult.points_awarded} Drop Points
                </div>
              )}

              <button 
                onClick={() => {
                  setScanResult(null);
                  window.location.reload(); // Hard reset html5-qrcode
                }}
                className="w-full bg-brand-navy text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Scan Next Customer
              </button>
            </div>
          ) : (
            <>
              {isProcessing && (
                <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-medium text-brand-navy">Verifying deal...</p>
                </div>
              )}
              
              <div id="qr-reader" className="w-full overflow-hidden rounded-xl border-0 !border-none" />
              
              {scanError && (
                <div className="mt-4 bg-red-50 text-red-600 text-sm font-medium p-3 rounded-lg text-center animate-shake">
                  {scanError}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Override html5-qrcode default ugly styles */}
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader { border: none !important; }
        #qr-reader__scan_region { background: #000; border-radius: 12px; overflow: hidden; }
        #qr-reader__dashboard_section_csr span { display: none !important; }
        #qr-reader__dashboard_section_swaplink { display: none !important; }
        #html5-qrcode-button-camera-permission, #html5-qrcode-button-camera-start, #html5-qrcode-button-camera-stop {
          background: #FF6B35 !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          font-weight: 600 !important;
          margin-top: 10px !important;
          cursor: pointer !important;
        }
        #qr-reader__status_span { display: none !important; }
        #qr-reader__dashboard_section_csr select {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin-bottom: 10px;
          width: 100%;
        }
      `}} />
    </div>
  );
}
