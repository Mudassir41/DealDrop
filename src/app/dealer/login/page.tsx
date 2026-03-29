"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DealerLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // signInWithOtp sends a 6-digit code to the email (magic link OTP, not password)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      if (error) throw error;
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send code. Check your email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = "/dealer";
      }
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-navy">
          Retailer Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {step === "email"
            ? "Enter your email — we'll send a 6-digit code"
            : `Check your inbox at ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form className="space-y-5" onSubmit={handleSendMagicLink}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="store@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange sm:text-sm transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? "Sending..." : "Send Login Code →"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                No password needed. Just your email.
              </p>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  6-Digit Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange sm:text-sm tracking-[0.4em] text-center text-xl font-bold transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Check your spam folder if it doesn't arrive in 30 seconds.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? "Verifying..." : "Verify & Enter Portal →"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(null); }}
                className="w-full text-sm text-gray-400 hover:text-brand-orange transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Are you a buyer?{" "}
          <Link href="/dashboard" className="text-brand-orange hover:underline">
            Go to the deal feed →
          </Link>
        </p>
      </div>
    </div>
  );
}
