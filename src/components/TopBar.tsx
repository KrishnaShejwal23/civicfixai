"use client";

import React from "react";
import Link from "next/link";
import { PhoneCall, MapPin, Shield } from "lucide-react";
import { Logo } from "./Logo";

interface TopBarProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  detectedLocation?: string | null;
}

export function TopBar({ user, detectedLocation }: TopBarProps) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4EAF0] px-4 md:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Logo View */}
        <div className="md:hidden flex items-center">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Desktop Date and Location Summary */}
        <div className="hidden md:flex items-center gap-4 text-xs text-[#657386]">
          <div className="font-medium text-[#24364A]">{currentDate}</div>
          <div className="h-3 w-px bg-[#E4EAF0]" />
          {detectedLocation ? (
            <div className="flex items-center gap-1.5 text-teal-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#10BFA5]" />
              <span className="truncate max-w-[260px]">{detectedLocation}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#8A94A6]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location shared on demand</span>
            </div>
          )}
        </div>

        {/* Right side shortcuts */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Direct 112 Emergency Access (Never requires login) */}
          <Link
            href="/services/emergency"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-bold transition shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>112 Emergency</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E4EAF0]">
              {user.role === "ADMIN" && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-[#10243A] text-white flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-[#10BFA5] transition"
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </Link>
            </div>
          ) : (
            <Link
              href="/auth"
              className="text-xs font-semibold text-[#10243A] hover:text-[#10BFA5] transition px-2.5 py-1.5 rounded-lg"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
