"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Clock,
  ArrowRight,
  Mail,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/AppShell";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { EmailModal } from "@/components/EmailModal";

interface ComplaintListItem {
  id: string;
  refNumber: string;
  category: string;
  subcategory: string;
  priority: string;
  title: string;
  description: string;
  address: string;
  status: string;
  createdAt: string | Date;
  departmentId?: string | null;
  emailRecords?: {
    recipientName: string;
    sentAt: string | Date;
  }[];
}

export default function MyComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Email modal state
  const [emailModalComplaint, setEmailModalComplaint] = useState<ComplaintListItem | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/complaints?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    } else {
      setLoading(false);
    }
  }, [user, fetchComplaints]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  if (!user && !loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#10243A] text-[#10BFA5] flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#10243A]">Sign In to View Your Complaints</h2>
        <p className="text-xs text-[#657386]">
          Your civic complaint records and live municipal status updates are securely linked with your authenticated citizen account.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
        >
          <span>Sign In / Create Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#10243A]">My Raised Complaints</h1>
          <p className="text-xs text-[#657386] mt-0.5">
            Track real-time official resolutions, status changes, and municipal correspondence.
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs rounded-xl shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E4EAF0] p-4 shadow-subtle space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by reference (CF-2026-...), title, or locality..."
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E4EAF0] bg-[#F5F7FB] focus:bg-white text-[#24364A] transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-[#657386] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {["ALL", "SUBMITTED", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-[#10243A] text-white"
                  : "bg-[#F5F7FB] text-[#657386] hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E4EAF0]/60">
          <span className="text-xs font-semibold text-[#657386] mr-1 flex items-center gap-1">
            <span>Category:</span>
          </span>
          {[
            { id: "ALL", label: "All Categories" },
            { id: "ROADS_TRAFFIC", label: "Roads & Traffic" },
            { id: "WATER_DRAINAGE", label: "Water & Drainage" },
            { id: "WASTE_SANITATION", label: "Waste & Sanitation" },
            { id: "ELECTRICITY_LIGHTING", label: "Electricity & Lighting" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${
                categoryFilter === cat.id
                  ? "bg-[#10BFA5] text-[#10243A]"
                  : "bg-[#F5F7FB] text-[#657386] hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-[#E4EAF0] animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4EAF0] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F5F7FB] text-[#8A94A6] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#10243A] text-base">No matching complaints found</h3>
          <p className="text-xs text-[#657386] max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search query or status filter."
              : "You have not submitted any complaints yet. Report civic issues to help improve your neighborhood."}
          </p>
          <div className="pt-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#10BFA5] text-[#10243A] font-bold text-xs rounded-xl transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Problem</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E4EAF0] hover:border-[#10BFA5] p-4 sm:p-5 shadow-card transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#10243A] bg-[#EEF2F6] px-2.5 py-0.5 rounded">
                      {item.refNumber}
                    </span>
                    <span className="text-xs font-semibold text-[#657386]">
                      {item.category} &bull; {item.subcategory}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <Link href={`/complaints/${item.id}`} className="block">
                    <h3 className="font-bold text-[#10243A] text-sm sm:text-base group-hover:text-[#10BFA5] transition">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-[#657386] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#657386] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8A94A6]" />
                      <span className="truncate max-w-xs">{item.address}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8A94A6]" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right Action / Status Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0 pt-2 sm:pt-0">
                  <StatusBadge status={item.status} />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailModalComplaint(item)}
                      title="Email Responsible Department"
                      className="p-1.5 rounded-lg border border-[#E4EAF0] hover:bg-[#F5F7FB] text-[#24364A] hover:text-[#10BFA5] text-xs transition flex items-center gap-1 font-semibold"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Email Dept</span>
                    </button>

                    <Link
                      href={`/complaints/${item.id}`}
                      className="p-1.5 rounded-lg border border-[#E4EAF0] hover:bg-[#10243A] hover:text-white text-[#24364A] transition"
                      title="View Details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* SECTION 15: SUBTLE GREY EMAIL INDICATOR
                  "display a single small, faint-grey, non-clickable line beneath the relevant complaint card
                   only when an associated email has been accepted successfully by the configured email provider."
                  Color: #8A94A6 */}
              {item.emailRecords && item.emailRecords.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#E4EAF0] text-[11px] text-[#8A94A6] select-none">
                  Email sent to {item.emailRecords[0].recipientName} &bull;{" "}
                  {new Date(item.emailRecords[0].sentAt || item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Email Modal Dialog */}
      {emailModalComplaint && (
        <EmailModal
          complaintId={emailModalComplaint.id}
          refNumber={emailModalComplaint.refNumber}
          departmentId={emailModalComplaint.departmentId}
          onClose={() => setEmailModalComplaint(null)}
          onEmailSent={() => {
            setEmailModalComplaint(null);
            fetchComplaints();
          }}
        />
      )}
    </div>
  );
}
