"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Building2,
  MapPin,
  RefreshCw,
  Plus,
  Flame,
  FileText,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AppShell";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface AdminMetrics {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

interface CategoryBreakdownItem {
  category: string;
  count: number;
  percentage: number;
}

interface HotspotItem {
  area: string;
  city: string;
  complaintCount: number;
  severity: string;
}

interface AdminAuditItem {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: string | Date;
  complaint?: {
    refNumber: string;
  } | null;
}

interface DepartmentItem {
  id: string;
  name: string;
  categoryType: string;
  jurisdiction: string;
  email: string;
  phone?: string | null;
  verificationSource?: string | null;
  isVerified?: boolean;
}

interface AdminComplaintItem {
  id: string;
  refNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  priority: string;
  status: string;
  adminNotes?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  createdAt: string | Date;
  departmentId?: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  department?: {
    id: string;
    name: string;
    email: string;
    jurisdiction?: string | null;
  } | null;
  statusHistory?: {
    id: string;
    status: string;
    notes?: string | null;
    createdAt: string | Date;
    changedBy?: {
      fullName: string;
      role: string;
    } | null;
  }[];
  emailRecords?: {
    id: string;
    sentAt: string | Date;
    sendStatus: string;
  }[];
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  // Tab: "complaints" | "hotspots" | "departments" | "emails"
  const [activeTab, setActiveTab] = useState<"complaints" | "hotspots" | "departments" | "emails">("complaints");

  // Analytics & Metrics
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [recentAudit, setRecentAudit] = useState<AdminAuditItem[]>([]);

  // Complaints Table State
  const [complaints, setComplaints] = useState<AdminComplaintItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Departments State
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  // Selected Complaint for Status Update Modal
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaintItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("IN_PROGRESS");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [assignedDeptId, setAssignedDeptId] = useState<string>("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Add Department Modal
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptType, setNewDeptType] = useState("ROADS");
  const [newDeptJurisdiction, setNewDeptJurisdiction] = useState("Citywide");
  const [newDeptEmail, setNewDeptEmail] = useState("");
  const [newDeptPhone, setNewDeptPhone] = useState("");
  const [newDeptSource, setNewDeptSource] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setHotspots(data.hotspots || []);
        setRecentAudit(data.recentActivity || []);
      }
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/complaints?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error("Failed to load admin complaints:", err);
    } finally {
      setLoadingComplaints(false);
    }
  }, [statusFilter, priorityFilter, searchTerm]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchAnalytics();
      fetchComplaints();
      fetchDepartments();
    }
  }, [user, fetchAnalytics, fetchComplaints, fetchDepartments]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !adminNotes.trim()) {
      alert("Official status update notes are mandatory for auditing.");
      return;
    }

    try {
      setSavingStatus(true);
      const res = await fetch("/api/admin/status-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          status: newStatus,
          notes: adminNotes.trim(),
          departmentId: assignedDeptId || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to update status.");
        return;
      }

      setSelectedComplaint(null);
      setAdminNotes("");
      await fetchComplaints();
      await fetchAnalytics();
    } catch {
      alert("Error saving status update.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptEmail.trim() || !newDeptSource.trim()) {
      alert("Please provide department name, official email, and verification source.");
      return;
    }

    try {
      setSavingDept(true);
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          categoryType: newDeptType,
          jurisdiction: newDeptJurisdiction.trim(),
          email: newDeptEmail.trim(),
          phone: newDeptPhone.trim(),
          verificationSource: newDeptSource.trim(),
        }),
      });

      if (res.ok) {
        setShowAddDept(false);
        setNewDeptName("");
        setNewDeptEmail("");
        setNewDeptPhone("");
        setNewDeptSource("");
        await fetchDepartments();
      } else {
        alert("Failed to create department.");
      }
    } finally {
      setSavingDept(false);
    }
  };

  // Authorization check: strictly require ADMIN role
  if (!authLoading && (!user || user.role !== "ADMIN")) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#10243A]">Admin Privileges Required</h2>
        <p className="text-xs text-[#657386]">
          This control center is restricted to verified municipal authorities and administrative personnel.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10243A] text-white text-xs font-bold rounded-xl"
        >
          <span>Return to Citizen Portal</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10243A] text-white p-6 sm:p-7 rounded-3xl shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#10BFA5]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Jurisdiction Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Municipal Administration Console</h1>
          <p className="text-xs text-slate-300">
            Audit grievances, manage field dispatch, inspect hotspot analytics, and maintain verified directories.
          </p>
        </div>

        <button
          onClick={() => {
            fetchAnalytics();
            fetchComplaints();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Metrics Row (Strictly Real DB Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E4EAF0] shadow-subtle">
          <span className="text-xs text-[#657386] font-medium">Total Lodged</span>
          <div className="text-2xl font-extrabold text-[#10243A] mt-1">{metrics?.total ?? 0}</div>
          <span className="text-[11px] text-[#8A94A6]">All time records</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#FDE68A] shadow-subtle">
          <span className="text-xs text-[#92400E] font-medium">Pending Review</span>
          <div className="text-2xl font-extrabold text-[#92400E] mt-1">{metrics?.pending ?? 0}</div>
          <span className="text-[11px] text-[#92400E]/70">Needs assignment</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#BAE6FD] shadow-subtle">
          <span className="text-xs text-[#0369A1] font-medium">In Progress</span>
          <div className="text-2xl font-extrabold text-[#0369A1] mt-1">{metrics?.inProgress ?? 0}</div>
          <span className="text-[11px] text-[#0369A1]/70">Field crews active</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#A7F3D0] shadow-subtle">
          <span className="text-xs text-[#065F46] font-medium">Resolved</span>
          <div className="text-2xl font-extrabold text-[#065F46] mt-1">{metrics?.resolved ?? 0}</div>
          <span className="text-[11px] text-[#065F46]/70">Verified fixed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#FECDD3] shadow-subtle col-span-2 sm:col-span-1">
          <span className="text-xs text-[#9F1239] font-medium">Urgent Hazards</span>
          <div className="text-2xl font-extrabold text-[#9F1239] mt-1">{metrics?.urgent ?? 0}</div>
          <span className="text-[11px] text-[#9F1239]/70">Critical safety queue</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E4EAF0] gap-2">
        {([
          { id: "complaints", label: "Complaints Registry", icon: FileText },
          { id: "hotspots", label: "Hotspot & Trends Analytics", icon: Flame },
          { id: "departments", label: "Verified Departments", icon: Building2 },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#10BFA5] text-[#10243A]"
                : "border-transparent text-[#657386] hover:text-[#10243A]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: COMPLAINTS REGISTRY */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-white rounded-2xl border border-[#E4EAF0] p-4 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ref, citizen name, address..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#E4EAF0] bg-[#F5F7FB] text-[#24364A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent Queue</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="bg-white rounded-2xl border border-[#E4EAF0] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FB] border-b border-[#E4EAF0] text-[#657386] font-semibold">
                  <tr>
                    <th className="p-3.5">Ref & Priority</th>
                    <th className="p-3.5">Complaint Title</th>
                    <th className="p-3.5">Citizen</th>
                    <th className="p-3.5">Category & Location</th>
                    <th className="p-3.5">Assigned Dept</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAF0] text-[#24364A]">
                  {loadingComplaints ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8A94A6]">
                        Loading municipal records...
                      </td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8A94A6]">
                        No complaints match your criteria.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F5F7FB]/70 transition">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#10243A]">{c.refNumber}</div>
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td className="p-3.5 font-bold text-[#10243A] max-w-xs truncate">
                          {c.title}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-[#657386]">
                          {c.user?.fullName}
                        </td>
                        <td className="p-3.5 max-w-xs truncate">
                          <span className="font-semibold text-[#10243A] block">{c.category}</span>
                          <span className="text-[#657386] text-[11px] truncate block">{c.address}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-[#657386]">
                          {c.department?.name || <span className="text-amber-600 font-semibold">Unassigned</span>}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedComplaint(c);
                              setNewStatus(c.status);
                              setAssignedDeptId(c.departmentId || "");
                              setAdminNotes(c.adminNotes || "");
                            }}
                            className="px-3 py-1.5 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-lg transition"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOTSPOT & TRENDS ANALYTICS */}
      {activeTab === "hotspots" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown (Real Data) */}
            <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#10243A] text-base">Category Volume Distribution</h3>
                <span className="text-xs text-[#8A94A6]">Real database counts</span>
              </div>

              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#24364A]">{item.category}</span>
                      <span className="font-bold text-[#10243A]">
                        {item.count} reports ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7FB] rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#10BFA5] h-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Hotspots Aggregation */}
            <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#10243A] text-base flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>Identified Grievance Hotspots</span>
                </h3>
                <span className="text-xs text-[#8A94A6]">Cluster by locality</span>
              </div>

              <div className="space-y-2.5">
                {hotspots.length === 0 ? (
                  <p className="text-xs text-[#8A94A6] py-8 text-center">
                    Insufficient geographic complaint records to cluster hotspots.
                  </p>
                ) : (
                  hotspots.map((hs, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#F5F7FB] border border-[#E4EAF0] rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <div>
                          <span className="text-xs font-bold text-[#10243A] block">{hs.area}</span>
                          <span className="text-[11px] text-[#657386]">{hs.city}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-[#10243A] block">
                          {hs.complaintCount} Reports
                        </span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          {hs.severity} Priority
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Audit Activity Stream */}
          <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
            <h3 className="font-bold text-[#10243A] text-base">Administrative Status Update Log</h3>
            <div className="space-y-2">
              {recentAudit.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-[#F5F7FB] border border-[#E4EAF0] rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#10243A] mr-2">
                      {a.complaint?.refNumber}
                    </span>
                    <span className="font-semibold text-[#24364A]">Status &rarr; {a.status}</span>
                    <span className="text-[#657386] ml-2 block sm:inline">({a.notes})</span>
                  </div>
                  <span className="text-[11px] text-[#8A94A6] shrink-0">
                    {new Date(a.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED DEPARTMENTS DIRECTORY */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#657386]">
              Database-backed directory of verified government departments and jurisdictions.
            </p>
            <button
              onClick={() => setShowAddDept(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#10BFA5] text-[#10243A] font-bold text-xs rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Verified Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-[#E4EAF0] p-5 shadow-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0B8573] border border-teal-200">
                    {dept.categoryType}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Authority
                  </span>
                </div>

                <h3 className="font-bold text-[#10243A] text-base">{dept.name}</h3>

                <div className="text-xs text-[#657386] space-y-1">
                  <div>
                    Jurisdiction: <strong className="text-[#24364A]">{dept.jurisdiction}</strong>
                  </div>
                  <div>
                    Official Email:{" "}
                    <strong className="text-[#10243A] font-mono">{dept.email}</strong>
                  </div>
                  {dept.phone && (
                    <div>
                      Helpline: <strong className="text-[#24364A]">{dept.phone}</strong>
                    </div>
                  )}
                  <div className="text-[11px] text-[#8A94A6] pt-1">
                    Source: {dept.verificationSource}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Status Update Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E4EAF0] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF0]">
              <div>
                <h3 className="font-bold text-[#10243A] text-base">
                  Update Complaint Status
                </h3>
                <span className="font-mono text-xs text-[#657386]">
                  Ref: {selectedComplaint.refNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#24364A] mb-1">
                  Official Status Transition
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A] font-semibold"
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="IN_PROGRESS">In Progress (Field Team Dispatched)</option>
                  <option value="RESOLVED">Resolved (Work Completed)</option>
                  <option value="REJECTED">Rejected (Authorized Non-Grievance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24364A] mb-1">
                  Assign Responsible Department
                </label>
                <select
                  value={assignedDeptId}
                  onChange={(e) => setAssignedDeptId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                >
                  <option value="">-- Retain Current Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.categoryType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24364A] mb-1">
                  Official Audit Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record mandatory action remarks (e.g. Dispatched Ward 14 asphalt repair vehicle)..."
                  className="w-full text-xs p-3 rounded-xl border border-[#E4EAF0] bg-[#F5F7FB] text-[#24364A]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4EAF0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#657386]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-5 py-2.5 bg-[#10243A] hover:bg-[#102D43] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {savingStatus ? "Saving Audit Trail..." : "Confirm Status Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E4EAF0] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF0]">
              <h3 className="font-bold text-[#10243A] text-base">Add Verified Department</h3>
              <button onClick={() => setShowAddDept(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#24364A] mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Municipal Pavement & Footpath Authority"
                  className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#24364A] mb-1">Category Type</label>
                  <select
                    value={newDeptType}
                    onChange={(e) => setNewDeptType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                  >
                    <option value="ROADS">ROADS</option>
                    <option value="SANITATION">SANITATION</option>
                    <option value="WATER">WATER</option>
                    <option value="ELECTRICITY">ELECTRICITY</option>
                    <option value="PARKS">PARKS</option>
                    <option value="HAZARDS">HAZARDS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#24364A] mb-1">Jurisdiction</label>
                  <input
                    type="text"
                    value={newDeptJurisdiction}
                    onChange={(e) => setNewDeptJurisdiction(e.target.value)}
                    placeholder="e.g. Citywide"
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#24364A] mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newDeptEmail}
                    onChange={(e) => setNewDeptEmail(e.target.value)}
                    placeholder="dept@civic.gov.in"
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#24364A] mb-1">Phone Helpline</label>
                  <input
                    type="text"
                    value={newDeptPhone}
                    onChange={(e) => setNewDeptPhone(e.target.value)}
                    placeholder="+91-20-..."
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24364A] mb-1">Verification Source</label>
                <input
                  type="text"
                  value={newDeptSource}
                  onChange={(e) => setNewDeptSource(e.target.value)}
                  placeholder="e.g. Official Municipal Gazette Notification 2026/8"
                  className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4EAF0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDept(false)}
                  className="px-3 py-1.5 text-xs text-[#657386]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="px-4 py-2 bg-[#10BFA5] text-[#10243A] font-bold text-xs rounded-xl"
                >
                  {savingDept ? "Saving..." : "Create Verified Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
