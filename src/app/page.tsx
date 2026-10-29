"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PlusCircle,
  PhoneCall,
  Cross,
  FileText,
  ArrowRight,
  MapPin,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/AppShell";
import { ActiveComplaintsCard } from "@/components/ActiveComplaintsCard";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface RecentComplaint {
  id: string;
  refNumber: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  address: string;
  priority: string;
  status: string;
  createdAt: string | Date;
  emailRecords?: {
    recipientName: string;
    sentAt?: string | Date | null;
  }[];
}

export default function HomePage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  // Time-based greeting based on real local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Citizen";

  const fetchRecentComplaints = useCallback(async () => {
    try {
      if (user) {
        const res = await fetch("/api/complaints");
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints?.slice(0, 5) || []);
        }
      }
    } catch (err) {
      console.error("Failed to load recent complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentComplaints();
  }, [fetchRecentComplaints]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              setUserLocation(`${addr.suburb || addr.neighbourhood || addr.city || "Urban Zone"}, ${addr.city || "Pune"}`);
            } else {
              setUserLocation(`${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`);
            }
          } catch {
            setUserLocation(`${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`);
          }
        },
        () => {
          // Graceful permission refusal
        }
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#10243A] to-[#102D43] text-white p-6 sm:p-8 rounded-3xl shadow-card relative overflow-hidden">
        {/* Subtle decorative vector backdrop */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <svg width="280" height="280" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs text-teal-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#10BFA5]" />
            <span>AI-Driven Civic Action & Transparency</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user ? (
              <>
                {getGreeting()}, {firstName} 👋
              </>
            ) : (
              "Welcome to CivicFix AI"
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Report civic issues in your neighborhood, trace resolution progress in real time, and route verified grievances directly to municipal authorities.
          </p>

          {/* Location prompt if not shared */}
          <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-[#10BFA5]" />
            {userLocation ? (
              <span className="font-medium text-white">{userLocation}</span>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                className="underline hover:text-white text-[#10BFA5] font-medium transition"
              >
                Share area location for local alerts
              </button>
            )}
          </div>
        </div>

        {/* Action Callouts */}
        <div className="relative z-10 flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <Link
            href="/report"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Report a Problem</span>
          </Link>

          {!user && (
            <Link
              href="/auth"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 backdrop-blur-sm transition"
            >
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Emergency & Health Discovery Quick Access Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* India 112 Unified Emergency Help Banner */}
        <Link
          href="/services/emergency"
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-rose-100 hover:border-rose-300 shadow-subtle hover:shadow-card transition flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  India 112 Help
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  24x7 Free
                </span>
              </div>
              <h3 className="font-bold text-[#10243A] text-sm mt-0.5">
                Emergency & Rapid Rescue
              </h3>
              <p className="text-[11px] text-[#657386] mt-0.5">
                Instant police, fire & ambulance dispatch coordinates
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition" />
        </Link>

        {/* Medical & Pharmacy Services Discovery */}
        <Link
          href="/services/medical"
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-[#E4EAF0] hover:border-[#10BFA5]/50 shadow-subtle hover:shadow-card transition flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#10BFA5] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Cross className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0DA68F] uppercase tracking-wider">
                  Health & Care
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#0B8573] text-[10px] font-bold">
                  Verified
                </span>
              </div>
              <h3 className="font-bold text-[#10243A] text-sm mt-0.5">
                Hospitals & Pharmacies
              </h3>
              <p className="text-[11px] text-[#657386] mt-0.5">
                Locate 24/7 chemist stores, clinics & medicine routing
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#10BFA5] transition" />
        </Link>
      </div>

      {/* 3. Active Complaints AI Metric Card */}
      <ActiveComplaintsCard isAdmin={user?.role === "ADMIN"} onRefresh={fetchRecentComplaints} />

      {/* 4. Recent Complaint Activity Section */}
      <div className="bg-white rounded-2xl border border-[#E4EAF0] p-5 md:p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#10243A] text-base">
              {user ? "Your Recent Complaints" : "Active Community Reports"}
            </h3>
            <p className="text-xs text-[#657386] mt-0.5">
              Transparent live status tracking directly linked with municipal records
            </p>
          </div>
          {user && complaints.length > 0 && (
            <Link
              href="/complaints"
              className="text-xs font-bold text-[#10243A] hover:text-[#10BFA5] flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-[#F5F7FB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F5F7FB] text-[#8A94A6] flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#24364A] text-sm">No complaints logged yet</h4>
            <p className="text-xs text-[#657386] max-w-sm mx-auto">
              Have you noticed a pothole, broken streetlight, or garbage overflow? Report it now and let Gemini AI assist your filing.
            </p>
            <div className="pt-2">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit First Complaint</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {complaints.map((item) => (
              <Link
                key={item.id}
                href={`/complaints/${item.id}`}
                className="block p-3.5 sm:p-4 rounded-xl border border-[#E4EAF0] hover:border-[#10BFA5] hover:bg-[#F5F7FB] transition group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#10243A] bg-[#EEF2F6] px-2 py-0.5 rounded">
                        {item.refNumber}
                      </span>
                      <span className="text-xs font-semibold text-[#657386]">
                        {item.category}
                      </span>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <h4 className="text-sm font-bold text-[#10243A] group-hover:text-[#10BFA5] transition">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#657386] flex items-center gap-1.5 truncate max-w-xl">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8A94A6]" />
                      <span>{item.address}</span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                    <StatusBadge status={item.status} size="sm" />
                    <span className="text-[11px] text-[#8A94A6]">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Subtle grey email indicator if accepted */}
                {item.emailRecords && item.emailRecords.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#E4EAF0] text-[11px] text-[#8A94A6] select-none">
                    Email sent to {item.emailRecords[0].recipientName} &bull;{" "}
                    {new Date(item.emailRecords[0].sentAt || item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
