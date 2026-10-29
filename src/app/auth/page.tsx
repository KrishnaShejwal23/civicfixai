"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle, PhoneCall } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (mode === "register") {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        errors.fullName = "Full Name is required and cannot be blank or whitespace only.";
      } else if (trimmedName.length < 2) {
        errors.fullName = "Full Name must be at least 2 characters.";
      }

      if (!confirmPassword) {
        errors.confirmPassword = "Confirm Password is required.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Password and Confirm Password do not match.";
      }
    }

    if (!email || !email.includes("@")) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (mode === "register" && password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,
            confirmPassword,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to create account.");
          return;
        }

        setSuccess("Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        // Login mode: Email and Password ONLY
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid email or password.");
          return;
        }

        if (data.requiresProfileCompletion) {
          router.push("/auth/complete-profile");
          return;
        }

        setSuccess("Signed in successfully! Loading your dashboard...");
        setTimeout(() => {
          router.push("/");
        }, 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#10243A] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner with 112 Emergency Shortcut (Never blocked by auth) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-2">
        <Link href="/" className="inline-block">
          <Logo light size="md" />
        </Link>
        <Link
          href="/services/emergency"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold hover:bg-rose-500/30 transition"
        >
          <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>112 Emergency Help</span>
        </Link>
      </div>

      {/* Main Authentication Box */}
      <div className="w-full max-w-md mx-auto my-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
        {/* Toggle Mode: Login vs Create Account */}
        <div className="flex bg-[#F5F7FB] p-1 rounded-2xl mb-6 border border-[#E4EAF0]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "login"
                ? "bg-[#10243A] text-white shadow-sm"
                : "text-[#657386] hover:text-[#10243A]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "register"
                ? "bg-[#10243A] text-white shadow-sm"
                : "text-[#657386] hover:text-[#10243A]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#10243A] tracking-tight">
            {mode === "register" ? "Join CivicFix AI" : "Welcome Back"}
          </h2>
          <p className="text-xs text-[#657386] mt-1">
            {mode === "register"
              ? "Report civic issues, verify departments, and monitor city repairs."
              : "Access your tracked complaints, community reports, and service requests."}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 1. Full Name - Mandatory on Registration */}
          {mode === "register" && (
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
                  className={`w-full text-xs pl-10 pr-3.5 py-2.5 bg-[#F5F7FB] border rounded-xl focus:bg-white text-[#24364A] transition ${
                    fieldErrors.fullName ? "border-rose-400" : "border-[#E4EAF0]"
                  }`}
                  autoComplete="name"
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>
          )}

          {/* 2. Email Address - Required */}
          <div>
            <label className="block text-xs font-bold text-[#24364A] mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A94A6]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full text-xs pl-10 pr-3.5 py-2.5 bg-[#F5F7FB] border rounded-xl focus:bg-white text-[#24364A] transition ${
                  fieldErrors.email ? "border-rose-400" : "border-[#E4EAF0]"
                }`}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* 3. Password - Required */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#24364A]">
                Password <span className="text-rose-500">*</span>
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => alert("Password reset link will be dispatched to your registered email address.")}
                  className="text-[11px] font-semibold text-[#10BFA5] hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A94A6]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimum 8 characters" : "Enter your password"}
                className={`w-full text-xs pl-10 pr-10 py-2.5 bg-[#F5F7FB] border rounded-xl focus:bg-white text-[#24364A] transition ${
                  fieldErrors.password ? "border-rose-400" : "border-[#E4EAF0]"
                }`}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A94A6] hover:text-[#24364A]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* 4. Confirm Password - Required on Registration */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-[#24364A] mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A94A6]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full text-xs pl-10 pr-10 py-2.5 bg-[#F5F7FB] border rounded-xl focus:bg-white text-[#24364A] transition ${
                    fieldErrors.confirmPassword ? "border-rose-400" : "border-[#E4EAF0]"
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A94A6] hover:text-[#24364A]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === "register" ? "Create Citizen Account" : "Sign In to CivicFix"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="mt-6 pt-4 border-t border-[#E4EAF0] text-center">
          <p className="text-[11px] text-[#657386]">
            Seed Test Accounts: <br />
            <span className="font-mono text-[#24364A]">krishna@civicfix.ai</span> (Citizen) &bull;{" "}
            <span className="font-mono text-[#24364A]">admin@civicfix.ai</span> (Admin) <br />
            Password: <span className="font-mono text-[#24364A]">Password123!</span>
          </p>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center py-3 text-slate-400 text-xs">
        CivicFix AI &bull; Smarter Cities. Better Communities. &bull; Secure Session
      </div>
    </div>
  );
}
