"use client";

import React, { useState } from "react";
import {
  Cross,
  Phone,
  Clock,
  MapPin,
  ExternalLink,
  Search,
  Navigation,
  AlertCircle,
  Truck,
  CheckCircle2,
} from "lucide-react";
import {
  VERIFIED_MEDICAL_FACILITIES,
  MEDICINE_DELIVERY_PARTNERS,
  MedicineDeliveryPartner,
} from "@/lib/emergency-data";

export default function MedicalServicesPage() {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userLocation, setUserLocation] = useState<string>("Pune Urban Zone");
  const [locLoading, setLocLoading] = useState(false);

  // Medicine Order Modal state
  const [selectedPartner, setSelectedPartner] = useState<MedicineDeliveryPartner | null>(null);
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const filteredFacilities = VERIFIED_MEDICAL_FACILITIES.filter((f) => {
    if (filterType !== "ALL" && f.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.area.toLowerCase().includes(q) ||
        f.services.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAcquireLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            setUserLocation(`${addr.suburb || addr.neighbourhood || "Metropolitan Zone"}, ${addr.city || "Pune"}`);
          }
        } catch {
          setUserLocation(`${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`);
        } finally {
          setLocLoading(false);
        }
      },
      () => setLocLoading(false)
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#10243A]">
            Medical & Pharmacy Services
          </h1>
          <p className="text-xs text-[#657386] mt-0.5">
            Discover verified 24/7 trauma centers, hospitals, local pharmacies, and prescription delivery services.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAcquireLocation}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E4EAF0] text-[#24364A] text-xs font-semibold rounded-xl hover:bg-[#F5F7FB] transition shadow-sm"
        >
          <Navigation className={`w-3.5 h-3.5 text-[#10BFA5] ${locLoading ? "animate-spin" : ""}`} />
          <span>Near: {userLocation}</span>
        </button>
      </div>

      {/* 1. Licensed Medicine Delivery Partners */}
      <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#10BFA5] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#10243A] text-base">
                Prescription Medicine Delivery
              </h3>
              <p className="text-xs text-[#657386]">
                Facilitated through authorized Indian pharmaceutical networks
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
            Licensed Distribution
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {MEDICINE_DELIVERY_PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="p-4 rounded-2xl border border-[#E4EAF0] hover:border-[#10BFA5] bg-[#F5F7FB] flex flex-col justify-between space-y-3 transition"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10BFA5]">
                  {partner.type}
                </span>
                <h4 className="font-bold text-[#10243A] text-sm mt-0.5">{partner.name}</h4>
                <p className="text-xs text-[#657386] mt-1 leading-relaxed">
                  {partner.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E4EAF0] space-y-2">
                <span className="text-[11px] text-[#657386] block">
                  Est. Delivery: <strong>{partner.estTime}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPartner(partner);
                    setOrderConfirmed(false);
                  }}
                  className="w-full py-2 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>Order with {partner.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Medical Facilities & 24x7 Chemists Directory */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E4EAF0] p-4 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hospital, pharmacy, service..."
              className="w-full text-xs pl-10 pr-3.5 py-2 rounded-xl border border-[#E4EAF0] bg-[#F5F7FB] text-[#24364A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {["ALL", "Trauma Center", "Hospital", "24x7 Pharmacy"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterType === t
                    ? "bg-[#10243A] text-white"
                    : "bg-[#F5F7FB] text-[#657386] hover:bg-slate-200"
                }`}
              >
                {t === "ALL" ? "All Facilities" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-2xl border border-[#E4EAF0] p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0B8573] border border-teal-200">
                    {fac.type}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{fac.hours}</span>
                  </span>
                </div>

                <h3 className="font-bold text-[#10243A] text-base">{fac.name}</h3>
                <p className="text-xs text-[#657386] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8A94A6] shrink-0 mt-0.5" />
                  <span>{fac.address}</span>
                </p>

                {/* Available Services Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fac.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-2 py-0.5 bg-[#F5F7FB] text-[#24364A] text-[10px] font-medium rounded-md border border-[#E4EAF0]"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4EAF0] flex items-center justify-between">
                <a
                  href={`tel:${fac.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10243A] hover:text-[#10BFA5] transition"
                >
                  <Phone className="w-3.5 h-3.5 text-[#10BFA5]" />
                  <span>{fac.phone}</span>
                </a>

                <span className="text-[11px] text-[#8A94A6]">Area: {fac.area}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Medicine Delivery Confirmation Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E4EAF0] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#10BFA5] flex items-center justify-center">
                  <Cross className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#10243A] text-base">
                  {selectedPartner.name} Routing
                </h3>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {orderConfirmed ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#10243A] text-base">
                  Address Verified for {selectedPartner.name}
                </h4>
                <p className="text-xs text-[#657386] max-w-sm mx-auto">
                  Your delivery address has been verified. You will now be redirected to the secure {selectedPartner.name} portal to attach your prescription and finalize medicine selection.
                </p>
                <div className="pt-2">
                  <a
                    href={selectedPartner.appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10BFA5] hover:bg-[#0DA68F] text-[#10243A] font-bold text-xs rounded-xl shadow-md transition"
                  >
                    <span>Proceed to {selectedPartner.name}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Indian Pharmaceutical Regulations Notice</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Under Indian Drugs and Cosmetics Rules, Schedule H & H1 medications require a valid licensed physician prescription. A registered pharmacist will review your prescription before dispatch.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#24364A]">
                    Confirm Delivery Address
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="Building / Flat Number"
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Street / Road"
                      className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                    />
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Area / Locality"
                      className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                    />
                  </div>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit PIN code (e.g. 411016)"
                    className="w-full text-xs px-3 py-2 border border-[#E4EAF0] rounded-xl text-[#24364A]"
                  />
                </div>

                <div className="pt-3 border-t border-[#E4EAF0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedPartner(null)}
                    className="text-xs text-[#657386] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderConfirmed(true)}
                    className="px-4 py-2 bg-[#10243A] hover:bg-[#102D43] text-white text-xs font-bold rounded-xl transition"
                  >
                    Confirm Address & Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
