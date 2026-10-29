"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { setupNativeMobileShell } from "@/lib/native-mobile";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Initialize native mobile Capacitor plugins (Status Bar color & Splash Screen)
    setupNativeMobileShell();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isAuthPage = pathname.startsWith("/auth");

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser: fetchUser,
        logout: handleLogout,
      }}
    >
      <div className="flex h-screen w-screen overflow-hidden bg-[#F5F7FB] select-none">
        {/* Desktop Sidebar (hidden on mobile, hidden on standalone auth pages) */}
        {!isAuthPage && (
          <Sidebar user={user} onLogout={handleLogout} />
        )}

        {/* Main Content Area with Notch Safe-Area Support */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {!isAuthPage && <TopBar user={user} />}

          <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          {!isAuthPage && <BottomNav user={user} />}
        </div>
      </div>
    </AuthContext.Provider>
  );
}
