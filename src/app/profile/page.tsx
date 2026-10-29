"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
} from "lucide-react";
import { useAuth } from "@/components/AppShell";

interface SavedAddressItem {
  id: string;
  label: string;
  building?: string | null;
  street: string;
  area: string;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();

  // Full Name Editing
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Saved Addresses
  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // New Address Form State
  const [label, setLabel] = useState("Home");
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Pune");
  const state = "Maharashtra";
  const [pincode, setPincode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);

    const trimmed = fullName.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError("Full name must be at least 2 characters.");
      return;
    }

    try {
      setSavingName(true);
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error || "Failed to update profile name.");
        return;
      }

      setNameSuccess(true);
      await refreshUser();
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Failed to save profile changes.");
    } finally {
      setSavingName(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!street.trim() || !area.trim() || !city.trim() || !pincode.trim()) {
      setAddressError("Please fill in Street, Area, City, and 6-digit PIN code.");
      return;
    }

    try {
      setSavingAddress(true);
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          building: building.trim(),
          street: street.trim(),
          area: area.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setAddressError(d.error || "Failed to save address.");
        return;
      }

      setShowAddAddress(false);
      setBuilding("");
      setStreet("");
      setArea("");
      setLandmark("");
      setPincode("");
      await fetchAddresses();
    } catch (err: unknown) {
      setAddressError(err instanceof Error ? err.message : "Network error while saving address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to remove this saved address?")) return;

    try {
      await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      await fetchAddresses();
    } catch (err) {
      console.error("Delete address failed:", err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#10243A]">Account Management</h2>
        <p className="text-xs text-[#657386]">Please sign in to view and edit your profile.</p>
        <button
          onClick={() => router.push("/auth")}
          className="px-5 py-2.5 bg-[#10BFA5] text-[#10243A] font-bold text-xs rounded-xl"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#10243A]">Citizen Profile & Account</h1>
          <p className="text-xs text-[#657386] mt-0.5">
            Manage your personal identity, verified credentials, and saved addresses.
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Information Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#10243A] text-[#10BFA5] text-2xl font-extrabold flex items-center justify-center mx-auto shadow-md">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <h3 className="font-extrabold text-[#10243A] text-base">{user.fullName}</h3>
              <p className="text-xs text-[#657386] font-mono mt-0.5">{user.email}</p>
            </div>

            <div className="pt-2 border-t border-[#E4EAF0] space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#657386]">Account Type:</span>
                <span className="font-bold text-[#10243A] uppercase tracking-wider text-[11px] bg-[#EEF2F6] px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#657386]">Email Status:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Location Guidance Card */}
          <div className="bg-white rounded-3xl border border-[#E4EAF0] p-5 shadow-card space-y-2.5">
            <h4 className="text-xs font-bold text-[#10243A] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#10BFA5]" />
              <span>Privacy & Location Guidance</span>
            </h4>
            <p className="text-[11px] text-[#657386] leading-relaxed">
              Your GPS location is only requested when you tap a location action and is never stored permanently without your explicit consent. A civic issue&apos;s confirmed location is kept strictly separate from your private saved home address.
            </p>
          </div>
        </div>

        {/* Right Column: Edit Full Name & Saved Addresses */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Edit Full Name Card (Mandatory Persistence requirement) */}
          <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-bold text-[#10243A] text-base">Personal Identification</h3>
              <p className="text-xs text-[#657386] mt-0.5">
                Update your registered full name. This name personalizes your dashboard and official civic complaint filings.
              </p>
            </div>

            {nameSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full name updated and securely persisted to your profile!</span>
              </div>
            )}

            {nameError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{nameError}</span>
              </div>
            )}

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#24364A] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A94A6]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E4EAF0] focus:border-[#10BFA5] bg-[#F5F7FB] focus:bg-white text-[#24364A] transition"
                  />
                </div>
                <p className="text-[11px] text-[#8A94A6] mt-1">
                  Supports Unicode characters, legitimate punctuation, and regional Indian scripts.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingName}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingName ? "Saving..." : "Update Name"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Saved Addresses Card */}
          <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#10243A] text-base">Saved Addresses</h3>
                <p className="text-xs text-[#657386] mt-0.5">
                  Save convenient addresses for recurring local reports or medical service delivery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0DA68F] font-bold text-xs rounded-xl border border-[#10BFA5]/30 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddAddress ? "Close Form" : "Add Address"}</span>
              </button>
            </div>

            {/* Add Address Form Drawer */}
            {showAddAddress && (
              <form
                onSubmit={handleAddAddress}
                className="p-4 bg-[#F5F7FB] border border-[#E4EAF0] rounded-2xl space-y-3 animate-in fade-in duration-200"
              >
                <h4 className="text-xs font-bold text-[#10243A]">New Saved Address</h4>

                {addressError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {addressError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                      Label (e.g. Home, Work)
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                      Building / Flat No.
                    </label>
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="e.g. Flat 402"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                      Street Name
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Senapati Bapat Road"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#657386] mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Symbiosis"
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
                      placeholder="411016"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 text-xs text-[#657386]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-4 py-1.5 bg-[#10BFA5] text-[#10243A] font-bold text-xs rounded-xl shadow-sm"
                  >
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            {loadingAddresses ? (
              <p className="text-xs text-[#8A94A6]">Loading saved addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-xs text-[#8A94A6] py-3 text-center">
                No saved addresses yet. Tap &quot;Add Address&quot; above to save one.
              </p>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3.5 bg-[#F5F7FB] border border-[#E4EAF0] rounded-2xl flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#10243A]">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold bg-white text-[#10BFA5] border border-teal-200 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#24364A]">
                        {[addr.building, addr.street, addr.area, addr.landmark, addr.city, addr.state, addr.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
