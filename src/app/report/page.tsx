"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Mail,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useAuth } from "@/components/AppShell";
import { PhotoCapture } from "@/components/PhotoCapture";
import { InteractiveMap } from "@/components/InteractiveMap";
import { EmailModal } from "@/components/EmailModal";
import { triggerHaptic } from "@/lib/native-mobile";
import type { AIAnalysisResult } from "@/lib/gemini";

// Civic Categories Structure
const CATEGORIES: Record<string, { label: string; icon: string; issues: string[] }> = {
  "Roads & Transport": {
    label: "Roads & Transport",
    icon: "🛣️",
    issues: [
      "Potholes",
      "Damaged roads",
      "Broken footpaths",
      "Damaged traffic signals",
      "Damaged or unsafe speed breakers",
      "Unsafe pedestrian crossings",
      "Blocked public roads",
    ],
  },
  "Garbage & Sanitation": {
    label: "Garbage & Sanitation",
    icon: "🗑️",
    issues: [
      "Overflowing bins",
      "Uncollected waste",
      "Illegal dumping",
      "Dirty public areas",
      "Public toilet maintenance",
    ],
  },
  "Water & Drainage": {
    label: "Water & Drainage",
    icon: "💧",
    issues: [
      "Water leakage",
      "Broken water pipes",
      "Blocked drains",
      "Waterlogging",
      "Sewage overflow",
      "Water contamination concerns",
    ],
  },
  "Electricity & Lighting": {
    label: "Electricity & Lighting",
    icon: "💡",
    issues: [
      "Broken streetlights",
      "Dark public areas",
      "Damaged public electrical fixtures",
      "Exposed wiring or electrical hazards",
    ],
  },
  "Parks & Environment": {
    label: "Parks & Environment",
    icon: "🌳",
    issues: [
      "Damaged benches",
      "Broken playground equipment",
      "Fallen branches",
      "Hazardous trees",
      "Pollution",
      "Damaged public gardens",
    ],
  },
  "Public Facilities & Accessibility": {
    label: "Public Facilities & Accessibility",
    icon: "🚏",
    issues: [
      "Damaged bus stops",
      "Damaged public benches",
      "Inaccessible ramps",
      "Damaged public buildings",
      "Missing public signboards",
    ],
  },
  "Public Hazards": {
    label: "Public Hazards",
    icon: "⚠️",
    issues: [
      "Open manholes",
      "Fallen poles",
      "Dangerous debris",
      "Damaged barriers",
      "Other potentially dangerous public infrastructure",
    ],
  },
  "Other Civic Issue": {
    label: "Other Civic Issue",
    icon: "📋",
    issues: ["General civic grievance", "Noise disturbance", "Encroachment concern"],
  },
};

export default function ReportProblemPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Wizard Step: 1. Category -> 2. Description & Photo -> 3. Location -> 4. Review & Submit
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [category, setCategory] = useState<string>("Roads & Transport");
  const [subcategory, setSubcategory] = useState<string>("Potholes");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);

interface DuplicateComplaintItem {
  id: string;
  refNumber: string;
  title: string;
  status: string;
  address?: string;
  similarityScore?: number;
  reason?: string;
}

interface SubmittedComplaintData {
  id: string;
  refNumber: string;
  title: string;
  category?: string;
  status: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    email: string;
    isVerified?: boolean;
  } | null;
}

  // Location State
  const [address, setAddress] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [city, setCity] = useState<string>("Pune");
  const [state, setState] = useState<string>("Maharashtra");
  const [pincode, setPincode] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(18.5204);
  const [longitude, setLongitude] = useState<number | null>(73.8567);

  // AI & Submission State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

  // Duplicate Warnings (non-blocking)
  const [duplicates, setDuplicates] = useState<DuplicateComplaintItem[]>([]);

  // Final Success State
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<SubmittedComplaintData | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      // Allow viewing or redirect
    }
  }, [user]);

  // Handle Photo selection
  const handlePhotoSelected = (b64: string | null, name: string | null, mime: string | null) => {
    setPhotoBase64(b64);
    setPhotoName(name);
    setPhotoMime(mime);
  };

  // Run Gemini AI Analysis
  const handleAnalyzeWithAI = async () => {
    if (!description || description.trim().length < 5) {
      setError("Please describe the issue in at least 5 words before running AI analysis.");
      return;
    }

    try {
      setAiAnalyzing(true);
      setError(null);

      const res = await fetch("/api/ai/analyze-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          imageBase64: photoBase64,
          imageMimeType: photoMime,
        }),
      });

      if (!res.ok) {
        throw new Error("AI analysis service temporarily unavailable.");
      }

      const data = await res.json();
      const a = data.analysis;

      setAiResult(a);
      if (a.conciseTitle && (!title || title.trim() === "")) {
        setTitle(a.conciseTitle);
      }
      if (a.suggestedCategory && CATEGORIES[a.suggestedCategory]) {
        setCategory(a.suggestedCategory);
        if (a.suggestedSubcategory) {
          setSubcategory(a.suggestedSubcategory);
        }
      }
      if (a.suggestedPriority) {
        setPriority(a.suggestedPriority);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze complaint with AI.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Check Duplicates before Step 4
  const checkDuplicates = async () => {
    try {
      const res = await fetch("/api/complaints/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subcategory,
          title,
          description,
          latitude,
          longitude,
          area,
          city,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDuplicates(data.duplicates || []);
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    }
  };

  const handleNextFromStep2 = () => {
    if (!title.trim()) {
      setError("Please enter a short title for this complaint.");
      return;
    }
    if (description.trim().length < 15) {
      setError("Please provide a description of at least 15 characters to explain the problem.");
      return;
    }
    setError(null);
    triggerHaptic("selection");
    setStep(3);
  };

  const handleNextFromStep3 = async () => {
    const fullAddress =
      address ||
      [area, landmark, city, state, pincode]
        .filter(Boolean)
        .join(", ");

    if (!fullAddress || fullAddress.length < 5) {
      setError("Please provide a confirmed problem address or drop a pin on the map.");
      triggerHaptic("warning");
      return;
    }

    setAddress(fullAddress);
    setError(null);
    triggerHaptic("selection");
    await checkDuplicates();
    setStep(4);
  };

  // Submit Complaint to Database
  const handleSubmitComplaint = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subcategory,
          title: title.trim(),
          description: description.trim(),
          photoUrl: photoBase64,
          photoName: photoName,
          address,
          building: null,
          street: null,
          area,
          landmark,
          city,
          state,
          pincode,
          latitude,
          longitude,
          priority,
          aiAnalysis: aiResult ? JSON.stringify(aiResult) : null,
          aiSuggested: !!aiResult,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit complaint.");
      }

      triggerHaptic("success");
      setSubmittedComplaint(data.complaint);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to persist complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 sm:p-8 shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-[#10BFA5] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0DA68F] rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grievance Officially Logged</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#10243A]">
              Complaint Submitted Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-[#657386] mt-1 max-w-md mx-auto">
              Your report has been saved to the municipal registry and routed to the responsible department.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 bg-[#F5F7FB] border border-[#E4EAF0] rounded-2xl max-w-sm mx-auto text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#657386]">Reference Number:</span>
              <span className="font-mono font-bold text-[#10243A] text-sm">
                {submittedComplaint.refNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#657386]">Category:</span>
              <span className="font-semibold text-[#24364A]">{submittedComplaint.category}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#657386]">Status:</span>
              <span className="font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                Submitted
              </span>
            </div>
            {submittedComplaint.department && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E4EAF0]">
                <span className="text-[#657386]">Target Department:</span>
                <span className="font-semibold text-[#10BFA5] text-[11px] truncate max-w-[160px]">
                  {submittedComplaint.department.name}
                </span>
              </div>
            )}
          </div>

          {/* Optional Department Email Callout (Section 14) */}
          <div className="p-5 bg-teal-50/60 border border-[#10BFA5]/30 rounded-2xl space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-[#10BFA5]/30 text-[#10BFA5] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#10243A] text-sm">
                  Would you also like to email the responsible department about this issue?
                </h4>
                <p className="text-xs text-[#657386] mt-0.5">
                  Send a formal, verified notice with ticket {submittedComplaint.refNumber} directly to the department inbox.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs rounded-xl shadow-sm transition"
              >
                Generate Email Draft
              </button>
              <button
                type="button"
                onClick={() => router.push("/complaints")}
                className="px-4 py-2 text-xs font-semibold text-[#657386] hover:text-[#24364A] transition"
              >
                Not Now, View My Complaints
              </button>
            </div>
          </div>

          {/* Direct Link to Track */}
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/complaints"
              className="px-5 py-2.5 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition"
            >
              Track in My Complaints
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 border border-[#E4EAF0] hover:bg-[#F5F7FB] text-[#24364A] text-xs font-bold rounded-xl transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Optional Email Review Modal */}
        {showEmailModal && (
          <EmailModal
            complaintId={submittedComplaint.id}
            refNumber={submittedComplaint.refNumber}
            departmentId={submittedComplaint.departmentId}
            onClose={() => setShowEmailModal(false)}
            onEmailSent={() => {
              setShowEmailModal(false);
              router.push("/complaints");
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Step Progress Indicator */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAF0] shadow-subtle">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#10BFA5]">
            Step {step} of 4
          </span>
          <span className="text-xs font-semibold text-[#657386]">
            {step === 1 && "Category & Issue Type"}
            {step === 2 && "Description & Photo"}
            {step === 3 && "Location & Map Pin"}
            {step === 4 && "Review & Submit"}
          </span>
        </div>
        <div className="w-full h-2 bg-[#F5F7FB] rounded-full overflow-hidden flex">
          <div
            className="bg-[#10BFA5] h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#10243A]">Select Civic Issue Category</h2>
            <p className="text-xs text-[#657386] mt-0.5">
              Choose the department category that best describes the problem.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.keys(CATEGORIES).map((catKey) => {
              const cat = CATEGORIES[catKey];
              const isSelected = category === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => {
                    setCategory(catKey);
                    setSubcategory(cat.issues[0]);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                    isSelected
                      ? "border-[#10BFA5] bg-teal-50/50 shadow-sm"
                      : "border-[#E4EAF0] hover:border-slate-300 bg-[#F5F7FB] hover:bg-white"
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? "text-[#10243A]" : "text-[#24364A]"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Specific Issue Type Subcategory */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#24364A] mb-2">
              Specific Issue Type in {category}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES[category]?.issues.map((iss) => (
                <button
                  key={iss}
                  type="button"
                  onClick={() => setSubcategory(iss)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    subcategory === iss
                      ? "bg-[#10243A] text-white border-[#10243A] font-semibold"
                      : "bg-white text-[#24364A] border-[#E4EAF0] hover:bg-[#F5F7FB]"
                  }`}
                >
                  {iss}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4EAF0] flex justify-end">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
            >
              <span>Continue to Details & Photo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DESCRIPTION, PHOTO & GEMINI AI ANALYSIS */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#10243A]">Describe the Civic Issue</h2>
            <p className="text-xs text-[#657386] mt-0.5">
              Add a clear description and optional photo. Gemini AI will structure and categorize your complaint.
            </p>
          </div>

          {/* Photo Capture & Upload */}
          <div>
            <label className="block text-xs font-bold text-[#24364A] mb-1.5">
              Photo Attachment (Optional but Recommended)
            </label>
            <PhotoCapture onPhotoSelected={handlePhotoSelected} initialPreview={photoBase64} />
          </div>

          {/* Issue Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#24364A]">
                Problem Description <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={aiAnalyzing || !description.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0DA68F] hover:text-[#0B8573] disabled:opacity-40 transition"
              >
                <Sparkles className={`w-3.5 h-3.5 ${aiAnalyzing ? "animate-spin" : ""}`} />
                <span>{aiAnalyzing ? "Analyzing with Gemini..." : "Analyze with Gemini AI"}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Deep pothole right on the curve near the flyover descent. Multiple two-wheelers skidding during rainy evening hours..."
              className="w-full text-xs p-3.5 rounded-xl border border-[#E4EAF0] focus:border-[#10BFA5] bg-[#F5F7FB] focus:bg-white text-[#24364A] transition leading-relaxed"
            />
          </div>

          {/* AI Structured Analysis Box */}
          {aiResult && (
            <div className="p-4 bg-teal-50/70 border border-[#10BFA5]/40 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#10BFA5]" />
                  <span className="text-xs font-bold text-[#10243A]">
                    Gemini AI Structured Analysis
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-[#0B8573] border border-teal-200 px-2 py-0.5 rounded-full">
                  AI Suggestion
                </span>
              </div>

              <p className="text-xs text-[#24364A]">
                <strong>Suggested Title:</strong> {aiResult.conciseTitle}
              </p>
              <p className="text-xs text-[#24364A]">
                <strong>Factual Summary:</strong> {aiResult.summary}
              </p>
              {aiResult.visualObservations?.length > 0 && (
                <p className="text-xs text-[#24364A]">
                  <strong>Visual Observations:</strong> {aiResult.visualObservations.join(", ")}
                </p>
              )}
              {aiResult.missingInformation?.length > 0 && (
                <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <strong>Helpful Context:</strong> {aiResult.missingInformation.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Complaint Title */}
          <div>
            <label className="block text-xs font-bold text-[#24364A] mb-1.5">
              Complaint Headline / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Pothole on Curve Causing Two-Wheeler Accidents"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4EAF0] focus:border-[#10BFA5] bg-[#F5F7FB] focus:bg-white text-[#24364A] transition"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-[#24364A] mb-1.5">
              Suggested Severity & Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    priority === p
                      ? p === "URGENT"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-[#10243A] text-white border-[#10243A]"
                      : "bg-[#F5F7FB] text-[#657386] border-[#E4EAF0] hover:bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 Footer */}
          <div className="pt-4 border-t border-[#E4EAF0] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#657386] hover:text-[#24364A] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep2}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
            >
              <span>Continue to Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION & MAP CONFIRMATION */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#10243A]">Confirm Problem Location</h2>
            <p className="text-xs text-[#657386] mt-0.5">
              Distinguish where the issue is located from your current position. You can use GPS or enter address manually.
            </p>
          </div>

          {/* Interactive Map Component */}
          <InteractiveMap
            initialLat={latitude}
            initialLng={longitude}
            initialAddress={address}
            onLocationChange={(loc) => {
              setLatitude(loc.lat);
              setLongitude(loc.lng);
              if (loc.formattedAddress) setAddress(loc.formattedAddress);
              if (loc.area) setArea(loc.area);
              if (loc.city) setCity(loc.city);
              if (loc.state) setState(loc.state);
              if (loc.pincode) setPincode(loc.pincode);
            }}
          />

          {/* Address Fields */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#24364A] mb-1">
                Full Confirmed Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, Street, Landmark, Area, City"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Shivajinagar"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Flyover"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 411016"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                />
              </div>
            </div>
          </div>

          {/* Step 3 Footer */}
          <div className="pt-4 border-t border-[#E4EAF0] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#657386] hover:text-[#24364A] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep3}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
            >
              <span>Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW, DUPLICATES CHECK & SUBMIT */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#10243A]">Review Your Grievance</h2>
            <p className="text-xs text-[#657386] mt-0.5">
              Confirm all details before submitting to the municipal database.
            </p>
          </div>

          {/* Non-Blocking Duplicate Warning (Section 11) */}
          {duplicates.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Notice: Possible Similar Grievance Already Reported Nearby</span>
              </div>
              <p className="text-xs text-amber-700">
                A similar issue was recently reported in this vicinity. If this is a separate occurrence or you have new details, you can safely continue.
              </p>
              <div className="space-y-1.5 pt-1">
                {duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="p-2.5 bg-white/80 rounded-xl text-xs border border-amber-200/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#10243A] mr-2">
                        {dup.refNumber}
                      </span>
                      <span className="text-[#24364A] font-medium">{dup.title}</span>
                      <span className="text-[11px] text-[#657386] block">
                        {dup.reason} ({dup.status})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Card */}
          <div className="bg-[#F5F7FB] p-4 sm:p-5 rounded-2xl border border-[#E4EAF0] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF0]">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORIES[category]?.icon}</span>
                <span className="text-xs font-bold text-[#10243A]">{category}</span>
                <span className="text-xs text-[#657386]">&bull; {subcategory}</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#10243A] border border-[#E4EAF0]">
                {priority} Priority
              </span>
            </div>

            <h3 className="font-bold text-sm text-[#10243A]">{title}</h3>
            <p className="text-xs text-[#24364A] leading-relaxed whitespace-pre-wrap">
              {description}
            </p>

            <div className="pt-2 text-xs text-[#657386] flex items-start gap-1.5 border-t border-[#E4EAF0]">
              <MapPin className="w-3.5 h-3.5 text-[#10BFA5] shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>

            {photoBase64 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-[#657386] block mb-1.5">
                  Attached Photo:
                </span>
                <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-[#E4EAF0]">
                  <Image
                    src={photoBase64}
                    alt="Attachment preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Final Submission Button */}
          <div className="pt-4 border-t border-[#E4EAF0] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#657386] hover:text-[#24364A] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitComplaint}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-extrabold text-xs sm:text-sm rounded-xl transition shadow-md disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
              <span>{submitting ? "Submitting to Registry..." : "Confirm & Submit Grievance"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
