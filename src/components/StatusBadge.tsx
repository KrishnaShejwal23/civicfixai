import React from "react";
import { Clock, AlertCircle, CheckCircle2, RotateCcw, XCircle, Send } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    SUBMITTED: {
      label: "Submitted",
      bg: "bg-[#F1F5F9]",
      text: "text-[#334155]",
      border: "border-[#E2E8F0]",
      icon: <Send className="w-3.5 h-3.5" />,
    },
    PENDING: {
      label: "Pending Review",
      bg: "bg-[#FEF3C7]",
      text: "text-[#92400E]",
      border: "border-[#FDE68A]",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    IN_PROGRESS: {
      label: "In Progress",
      bg: "bg-[#E0F2FE]",
      text: "text-[#0369A1]",
      border: "border-[#BAE6FD]",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    RESOLVED: {
      label: "Resolved",
      bg: "bg-[#D1FAE5]",
      text: "text-[#065F46]",
      border: "border-[#A7F3D0]",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-[#F1F5F9]",
      text: "text-[#475569]",
      border: "border-[#CBD5E1]",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    REOPENED: {
      label: "Reopened",
      bg: "bg-[#F3E8FF]",
      text: "text-[#6B21A8]",
      border: "border-[#E9D5FF]",
      icon: <RotateCcw className="w-3.5 h-3.5" />,
    },
    URGENT: {
      label: "Urgent Priority",
      bg: "bg-[#FFE4E6]",
      text: "text-[#9F1239]",
      border: "border-[#FECDD3]",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  };

  const current = configs[normalized] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: null,
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs gap-1 font-medium"
      : "px-2.5 py-1 text-xs sm:text-sm gap-1.5 font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses} shadow-sm`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const norm = (priority || "MEDIUM").toUpperCase();
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    URGENT: { bg: "bg-red-50 text-red-700 border-red-200", text: "Urgent Priority", label: "Urgent" },
    HIGH: { bg: "bg-orange-50 text-orange-700 border-orange-200", text: "High Priority", label: "High" },
    MEDIUM: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Medium Priority", label: "Medium" },
    LOW: { bg: "bg-slate-50 text-slate-700 border-slate-200", text: "Low Priority", label: "Low" },
  };

  const s = styles[norm] || styles.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${s.bg}`}>
      {s.label}
    </span>
  );
}
