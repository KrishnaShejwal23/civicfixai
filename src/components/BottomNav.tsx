"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, FileText, Cross, User, ShieldAlert } from "lucide-react";
import { triggerHaptic } from "@/lib/native-mobile";

interface BottomNavProps {
  user: {
    id: string;
    fullName: string;
    role: string;
  } | null;
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/", icon: Home },
    { label: "Report", href: "/report", icon: PlusCircle, isAction: true },
    { label: "Complaints", href: "/complaints", icon: FileText },
    { label: "Services", href: "/services/medical", icon: Cross },
    user?.role === "ADMIN"
      ? { label: "Admin", href: "/admin", icon: ShieldAlert }
      : { label: "Profile", href: user ? "/profile" : "/auth", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#10243A] border-t border-[#102D43] px-2 py-1.5 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around">
        {links.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => triggerHaptic("selection")}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-[#10BFA5] text-[#10243A] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-4 border-[#F5F7FB]">
                  <PlusCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-[#10BFA5] mt-0.5">
                  Report
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic("selection")}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? "text-[#10BFA5]" : "text-slate-400 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className={`text-[10px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
