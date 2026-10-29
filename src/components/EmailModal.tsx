"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mail, Check, Copy, RefreshCw, Send, AlertCircle, X, ShieldCheck, CheckCircle2 } from "lucide-react";

interface EmailModalProps {
  complaintId: string;
  refNumber: string;
  departmentId?: string | null;
  onClose: () => void;
  onEmailSent?: () => void;
}

export function EmailModal({
  complaintId,
  refNumber,
  departmentId,
  onClose,
  onEmailSent,
}: EmailModalProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  // Editable Form Fields
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDraft = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, departmentId }),
      });

      if (!res.ok) {
        throw new Error("Failed to load official email draft.");
      }

      const data = await res.json();
      setRecipientName(data.draft.recipientName);
      setRecipientEmail(data.draft.recipientEmail);
      setSubject(data.draft.subject);
      setBodyText(data.draft.bodyText);
      setIsVerified(data.isVerified);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate draft.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [complaintId, departmentId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const handleCopy = () => {
    const fullText = `To: ${recipientEmail} (${recipientName})\nSubject: ${subject}\n\n${bodyText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId,
          departmentId,
          recipientEmail,
          recipientName,
          subject,
          bodyText,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.sendStatus === "UNCONFIGURED") {
          setError(data.errorMessage);
        } else {
          setError(data.errorMessage || "Failed to dispatch email.");
        }
        return;
      }

      setSuccessResult(
        "Email accepted by transactional email provider. A subtle status line has been added to your complaint card."
      );
      if (onEmailSent) onEmailSent();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error while sending email.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E4EAF0] shadow-elevated overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#E4EAF0] flex items-center justify-between bg-[#F5F7FB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10243A] text-[#10BFA5] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#10243A] text-sm md:text-base">
                Email Responsible Department
              </h3>
              <p className="text-xs text-[#657386]">
                Complaint Reference: <span className="font-mono font-semibold">{refNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice regarding email dispatch</p>
                <p className="mt-0.5">{error}</p>
                <p className="mt-1 text-[11px] text-amber-700">
                  Tip: You can use &quot;Copy Email&quot; below to send this directly from your personal email client.
                </p>
              </div>
            </div>
          )}

          {successResult ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#10243A] text-base">Transmission Successful</h4>
              <p className="text-xs text-[#657386] max-w-md mx-auto">{successResult}</p>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition"
                >
                  Close & Return
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-[#8A94A6] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#10BFA5]" />
              <p>Formulating formal complaint draft from verified department directory...</p>
            </div>
          ) : (
            <>
              {/* Department Verification Badge */}
              <div className="flex items-center justify-between p-3 bg-teal-50 border border-[#10BFA5]/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0DA68F]" />
                  <span className="text-xs font-semibold text-[#0DA68F]">
                    {isVerified ? "Verified Official Municipal Recipient" : "Manual / Unverified Recipient"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-[#10243A] hover:text-[#10BFA5] transition"
                >
                  {isEditing ? "Lock Fields" : "Edit Email"}
                </button>
              </div>

              {/* Recipient & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#24364A] mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    disabled={!isEditing}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl bg-white disabled:bg-slate-50 text-[#24364A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#24364A] mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    disabled={!isEditing}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl bg-white disabled:bg-slate-50 text-[#24364A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24364A] mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  disabled={!isEditing}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl bg-white disabled:bg-slate-50 text-[#24364A]"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-[#24364A] mb-1">
                  Email Message Body
                </label>
                <textarea
                  rows={8}
                  value={bodyText}
                  disabled={!isEditing}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl bg-white disabled:bg-slate-50 text-[#24364A] font-mono leading-relaxed"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!successResult && (
          <div className="p-4 border-t border-[#E4EAF0] bg-[#F5F7FB] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchDraft}
                disabled={loading || sending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E4EAF0] hover:bg-white text-xs font-medium text-[#24364A] rounded-xl transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Draft</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E4EAF0] hover:bg-white text-xs font-medium text-[#24364A] rounded-xl transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Email"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#657386] hover:text-[#24364A] transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={loading || sending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
                <span>{sending ? "Sending..." : "Send Email"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
