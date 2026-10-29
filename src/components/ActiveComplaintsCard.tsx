"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Clock, CheckCircle2, ArrowUpRight } from "lucide-react";

interface ActiveComplaintsCardProps {
  isAdmin?: boolean;
  onRefresh?: () => void;
}

interface ComplaintSummaryItem {
  id: string;
  status: string;
  priority: string;
}

interface MetricData {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
  lastUpdated: string;
  source: "CITIZEN" | "ADMIN_JURISDICTION";
  summaryText: string;
}

export function ActiveComplaintsCard({ isAdmin = false, onRefresh }: ActiveComplaintsCardProps) {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setRefreshing(true);
      // If admin, fetch admin analytics; if citizen, fetch user's complaints count
      if (isAdmin) {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const json = await res.json();
          const m = json.metrics;
          setData({
            total: m.total,
            pending: m.pending,
            inProgress: m.inProgress,
            resolved: m.resolved,
            urgent: m.urgent,
            lastUpdated: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            source: "ADMIN_JURISDICTION",
            summaryText:
              m.total === 0
                ? "No civic complaints currently registered across the jurisdiction."
                : `${m.inProgress} active issues currently in progress with municipal field crews. ${m.urgent} flagged with urgent priority.`,
          });
        }
      } else {
        const res = await fetch("/api/complaints");
        if (res.ok) {
          const json = await res.json();
          const complaints: ComplaintSummaryItem[] = json.complaints || [];

          const pending = complaints.filter((c) => c.status === "PENDING" || c.status === "SUBMITTED").length;
          const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
          const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
          const urgent = complaints.filter((c) => c.priority === "URGENT" && c.status !== "RESOLVED").length;

          setData({
            total: complaints.length,
            pending,
            inProgress,
            resolved,
            urgent,
            lastUpdated: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            source: "CITIZEN",
            summaryText:
              complaints.length === 0
                ? "You haven't logged any civic complaints yet. Tap 'Report a Problem' to raise an issue."
                : `${inProgress} of your reported issues are actively being handled by municipal teams. ${resolved} successfully resolved.`,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load active complaint metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleManualRefresh = () => {
    fetchMetrics();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4EAF0] p-5 md:p-6 shadow-card relative overflow-hidden transition-all">
      {/* Subtle Top Decorative Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10243A] via-[#10BFA5] to-[#10243A]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-[#10BFA5]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#10243A] text-base md:text-lg">
              Active Complaints AI
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#10243A] text-white px-2 py-0.5 rounded-full">
              {isAdmin ? "Jurisdiction Live" : "My Tracked Issues"}
            </span>
          </div>
          <p className="text-xs text-[#657386] mt-0.5">
            Your Community at a Glance
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8A94A6]">
          {data?.lastUpdated && (
            <span>Updated {data.lastUpdated}</span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh metrics"
            className="p-1.5 rounded-lg border border-[#E4EAF0] hover:bg-[#F5F7FB] text-[#24364A] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics Grid - Strictly from DB */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {/* Pending */}
            <div className="bg-[#FEF3C7]/40 border border-[#FDE68A] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[#92400E]">
                <span className="text-xs font-semibold">Pending Review</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#92400E] mt-1.5">
                {data?.pending ?? 0}
              </div>
              <span className="text-[11px] text-[#92400E]/80">Awaiting action</span>
            </div>

            {/* In Progress */}
            <div className="bg-[#E0F2FE]/40 border border-[#BAE6FD] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[#0369A1]">
                <span className="text-xs font-semibold">In Progress</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#0369A1] mt-1.5">
                {data?.inProgress ?? 0}
              </div>
              <span className="text-[11px] text-[#0369A1]/80">Field team assigned</span>
            </div>

            {/* Resolved */}
            <div className="bg-[#D1FAE5]/40 border border-[#A7F3D0] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[#065F46]">
                <span className="text-xs font-semibold">Resolved</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#065F46] mt-1.5">
                {data?.resolved ?? 0}
              </div>
              <span className="text-[11px] text-[#065F46]/80">Verified completed</span>
            </div>

            {/* Urgent Priority */}
            <div className="bg-[#FFE4E6]/40 border border-[#FECDD3] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[#9F1239]">
                <span className="text-xs font-semibold">Urgent Hazards</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#9F1239] mt-1.5">
                {data?.urgent ?? 0}
              </div>
              <span className="text-[11px] text-[#9F1239]/80">Safety critical</span>
            </div>
          </div>

          {/* AI Narrative Contextual Note */}
          <div className="mt-4 p-3 bg-[#F5F7FB] border border-[#E4EAF0] rounded-xl flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-white border border-[#E4EAF0] text-[#10BFA5] shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-[#24364A] leading-relaxed">
              <strong className="font-semibold text-[#10243A]">AI Status Insight: </strong>
              {data?.summaryText}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
