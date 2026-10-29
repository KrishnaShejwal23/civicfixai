"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  FileText,
  Cross,
  User,
  ShieldAlert,
  PhoneCall,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";

interface SidebarProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Report a Problem", href: "/report", icon: PlusCircle, highlight: true },
    { label: "My Complaints", href: "/complaints", icon: FileText, requireAuth: true },
    { label: "Services & Medical", href: "/services/medical", icon: Cross },
    { label: "Profile", href: "/profile", icon: User, requireAuth: true },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({
      label: "Admin Dashboard",
      href: "/admin",
      icon: ShieldAlert,
      requireAuth: true,
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#10243A] text-white shrink-0 border-r border-[#102D43] select-none">
      {/* Top Brand Header */}
      <div className="p-5 border-b border-[#102D43]">
        <Link href="/" className="block focus:outline-none focus:ring-2 focus:ring-[#10BFA5] rounded-lg">
          <Logo light showTagline size="md" />
        </Link>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-[#8A94A6] uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#10BFA5] text-white shadow-sm font-semibold"
                  : item.highlight
                  ? "bg-[#102D43] text-[#10BFA5] hover:bg-[#1A3957] hover:text-white"
                  : "text-slate-300 hover:bg-[#102D43] hover:text-white"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : item.highlight ? "text-[#10BFA5]" : "text-[#8A94A6]"
                }`}
              />
              <span className="truncate">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-[#10BFA5]/20 text-[#10BFA5] px-1.5 py-0.5 rounded">
                  New
                </span>
              )}
            </Link>
          );
        })}

        {/* Emergency Shortcut Card */}
        <div className="pt-6 px-1">
          <div className="bg-[#102D43]/80 border border-rose-500/30 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wide uppercase">
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>Emergency 112</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Immediate police, medical & fire rescue across India.
            </p>
            <Link
              href="/services/emergency"
              className="mt-2.5 block text-center bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition"
            >
              Emergency Help (112)
            </Link>
          </div>
        </div>
      </div>

      {/* User Section at Bottom */}
      <div className="p-3 border-t border-[#102D43] bg-[#102D43]/40">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg">
            <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#10BFA5] text-[#10243A] font-bold flex items-center justify-center shrink-0 text-xs">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">
                  {user.fullName || "Citizen User"}
                </div>
                <div className="text-[11px] text-[#8A94A6] truncate">{user.email}</div>
              </div>
            </Link>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#10243A] rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/auth"
              className="block w-full text-center bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold py-2 rounded-xl text-xs transition"
            >
              Sign In / Register
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
