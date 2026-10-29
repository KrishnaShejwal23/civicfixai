"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();

    if (!trimmed) {
      setError("Full Name is required and cannot be empty.");
      return;
    }

    if (trimmed.length < 2) {
      setError("Full Name must be at least 2 characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        return;
      }

      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10243A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6">
        <div className="text-center">
          <Logo size="md" className="justify-center mb-3" />
          <h2 className="text-xl font-bold text-[#10243A]">Complete Your Profile</h2>
          <p className="text-xs text-[#657386] mt-1">
            Please provide your full legal or preferred name to personalize your civic complaints and municipal records.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#24364A] mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A94A6]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Krishna Shejwal"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-[#F5F7FB] border border-[#E4EAF0] rounded-xl focus:bg-white text-[#24364A] transition"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-[#8A94A6] mt-1">
              Supports Unicode characters and regional scripts.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Saving..." : "Save and Continue to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
