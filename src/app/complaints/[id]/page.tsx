"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Mail,
  AlertCircle,
  Building2,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { EmailModal } from "@/components/EmailModal";

interface StatusHistoryRecord {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: string | Date;
  changedBy?: {
    fullName: string;
    role: string;
  } | null;
}

interface ComplaintDetail {
  id: string;
  refNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  priority: string;
  status: string;
  departmentId?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  photoName?: string | null;
  createdAt: string | Date;
  department?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    jurisdiction?: string | null;
    isVerified?: boolean;
  } | null;
  statusHistory?: StatusHistoryRecord[];
}

export default function ComplaintDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reopen / Note Form
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/complaints/${id}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access denied. You do not have permission to view this complaint.");
        } else if (res.status === 404) {
          setError("Complaint record not found.");
        } else {
          setError("Failed to retrieve complaint record.");
        }
        return;
      }

      const data = await res.json();
      setComplaint(data.complaint);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load complaint.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id, fetchComplaint]);

  const handleAddNote = async (action: "NOTE" | "REOPEN") => {
    if (!noteText.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await fetch(`/api/complaints/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: noteText.trim() }),
      });

      if (!res.ok) {
        alert("Failed to submit note.");
        return;
      }

      setNoteText("");
      await fetchComplaint();
    } catch {
      alert("Error submitting note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-[#8A94A6]">
        Loading complaint record...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#10243A]">Access Restricted</h2>
        <p className="text-xs text-[#657386]">{error || "Could not access this record."}</p>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10243A] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Complaints</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#657386] hover:text-[#10243A] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Complaints</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowEmailModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#0DA68F] border border-[#10BFA5]/30 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Department</span>
        </button>
      </div>

      {/* Main Grievance Card */}
      <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4EAF0]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#10243A] bg-[#EEF2F6] px-2.5 py-1 rounded">
                {complaint.refNumber}
              </span>
              <span className="text-xs font-semibold text-[#657386]">
                {complaint.category} &bull; {complaint.subcategory}
              </span>
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10243A] mt-2">
              {complaint.title}
            </h1>
          </div>

          <StatusBadge status={complaint.status} size="md" />
        </div>

        {/* Issue Details & Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#24364A] uppercase tracking-wider mb-1">
                Citizen Issue Description
              </h3>
              <p className="text-xs sm:text-sm text-[#24364A] leading-relaxed whitespace-pre-wrap bg-[#F5F7FB] p-4 rounded-2xl border border-[#E4EAF0]">
                {complaint.description}
              </p>
            </div>

            {complaint.photoUrl && (
              <div>
                <h3 className="text-xs font-bold text-[#24364A] uppercase tracking-wider mb-1">
                  Photo Evidence Attached
                </h3>
                <div className="relative rounded-2xl overflow-hidden border border-[#E4EAF0] max-h-72 h-64 bg-slate-900 flex items-center justify-center">
                  <Image
                    src={complaint.photoUrl}
                    alt={complaint.photoName || "Complaint photo"}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Metadata Column */}
          <div className="space-y-4">
            <div className="p-4 bg-[#F5F7FB] border border-[#E4EAF0] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-[#10243A] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10BFA5]" />
                <span>Confirmed Location</span>
              </h4>
              <p className="text-xs text-[#24364A] leading-relaxed">
                {complaint.address}
              </p>
              {complaint.latitude && complaint.longitude && (
                <div className="text-[11px] font-mono text-[#8A94A6]">
                  GPS: {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                </div>
              )}
            </div>

            {complaint.department && (
              <div className="p-4 bg-teal-50/60 border border-[#10BFA5]/30 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-[#0DA68F] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Assigned Authority</span>
                </h4>
                <p className="text-xs font-bold text-[#10243A]">
                  {complaint.department.name}
                </p>
                <p className="text-[11px] text-[#657386]">
                  Jurisdiction: {complaint.department.jurisdiction}
                </p>
                <p className="text-[11px] font-mono text-[#10BFA5]">
                  {complaint.department.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Status History Timeline */}
      <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#10BFA5]" />
          <h3 className="font-bold text-[#10243A] text-base">Resolution Audit History</h3>
        </div>

        <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4EAF0]">
          {complaint.statusHistory?.map((hist: StatusHistoryRecord) => (
            <div key={hist.id} className="relative space-y-1">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#10BFA5] border-2 border-white" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#10243A]">
                  Status: {hist.status.replace("_", " ")}
                </span>
                <span className="text-[11px] text-[#8A94A6]">
                  &bull; {new Date(hist.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {hist.changedBy && (
                  <span className="text-[11px] text-[#657386]">
                    by {hist.changedBy.fullName} ({hist.changedBy.role})
                  </span>
                )}
              </div>
              {hist.notes && (
                <p className="text-xs text-[#24364A] bg-[#F5F7FB] p-2.5 rounded-xl border border-[#E4EAF0]">
                  {hist.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Citizen Add Note / Request Reopen */}
        <div className="pt-4 border-t border-[#E4EAF0] space-y-3">
          <h4 className="text-xs font-bold text-[#24364A]">Add Supplementary Citizen Note</h4>
          <textarea
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add additional details, landmark directions, or update regarding ground situation..."
            className="w-full text-xs p-3 rounded-xl border border-[#E4EAF0] focus:border-[#10BFA5] bg-[#F5F7FB] focus:bg-white text-[#24364A]"
          />
          <div className="flex items-center justify-end gap-2">
            {complaint.status === "RESOLVED" && (
              <button
                type="button"
                onClick={() => handleAddNote("REOPEN")}
                disabled={submittingNote || !noteText.trim()}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition disabled:opacity-50"
              >
                Request Reopen
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAddNote("NOTE")}
              disabled={submittingNote || !noteText.trim()}
              className="px-4 py-2 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
            >
              Submit Note
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal Dialog */}
      {showEmailModal && (
        <EmailModal
          complaintId={complaint.id}
          refNumber={complaint.refNumber}
          departmentId={complaint.departmentId}
          onClose={() => setShowEmailModal(false)}
          onEmailSent={() => {
            setShowEmailModal(false);
            fetchComplaint();
          }}
        />
      )}
    </div>
  );
}
