"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  MapPin,
  Share2,
  Copy,
  Check,
  Navigation,
  Info,
} from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/emergency-data";
import { isNativeApp, getCurrentPositionNative, triggerHaptic } from "@/lib/native-mobile";

export default function EmergencyPage() {
  const [userAddress, setUserAddress] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAcquireLocation = async () => {
    setLocationLoading(true);
    triggerHaptic("selection");

    // 1. Native Capacitor Geolocation
    if (isNativeApp()) {
      try {
        const pos = await getCurrentPositionNative();
        if (pos) {
          setCoordinates({ lat: pos.latitude, lng: pos.longitude });
          triggerHaptic("success");
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.latitude}&lon=${pos.longitude}&zoom=18`
            );
            if (res.ok) {
              const data = await res.json();
              setUserAddress(data.display_name || `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`);
            } else {
              setUserAddress(`${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`);
            }
          } catch {
            setUserAddress(`${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`);
          } finally {
            setLocationLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn("Native location in emergency page failed, trying browser:", err);
      }
    }

    // 2. Browser Geolocation fallback
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinates({ lat, lng });
        triggerHaptic("success");

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
          );
          if (res.ok) {
            const data = await res.json();
            setUserAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } else {
            setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch {
          setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        triggerHaptic("warning");
        alert("GPS location permission was denied. You can manually enter your address below.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCopyLocation = () => {
    const textToCopy = `EMERGENCY DISPATCH LOCATION:\nAddress: ${userAddress || "Not entered"}\nCoordinates: ${
      coordinates ? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}` : "None"
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Emergency Location Coordinates",
        text: `Urgent emergency assistance requested at:\n${userAddress}\nCoordinates: ${
          coordinates ? `${coordinates.lat}, ${coordinates.lng}` : ""
        }`,
      });
    } else {
      handleCopyLocation();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Top Urgent Notice */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <PhoneCall className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
            Emergency Services Hotline &bull; Free Across India
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Dial 112
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-lg leading-relaxed">
              India&apos;s Single Unified Emergency Helpline for immediate Police, Fire, Medical, and Disaster Rescue dispatch.
            </p>
          </div>

          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-rose-50 text-rose-700 font-extrabold text-sm rounded-2xl shadow-lg transition transform hover:scale-105 active:scale-95 shrink-0"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 112 Now</span>
          </a>
        </div>
      </div>

      {/* 2. Dispatch Location Assistance Box */}
      <div className="bg-white rounded-3xl border border-[#E4EAF0] p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-bold text-[#10243A] text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#10BFA5]" />
              <span>Your Current Location for First Responders</span>
            </h3>
            <p className="text-xs text-[#657386] mt-0.5">
              Read these coordinates or your landmark to the emergency operator when on call.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAcquireLocation}
            disabled={locationLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#0DA68F] font-bold text-xs rounded-xl border border-[#10BFA5]/30 transition shrink-0 shadow-sm"
          >
            <Navigation className={`w-3.5 h-3.5 ${locationLoading ? "animate-spin" : ""}`} />
            <span>{locationLoading ? "Locating..." : "Detect My GPS Location"}</span>
          </button>
        </div>

        {/* Address / Coordinates Box */}
        <div className="p-4 bg-[#F5F7FB] border border-[#E4EAF0] rounded-2xl space-y-2">
          <label className="block text-[11px] font-bold text-[#657386] uppercase tracking-wider">
            Address / Nearby Landmark
          </label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="e.g. Near Symbiosis College Main Gate, Senapati Bapat Road, Shivajinagar, Pune"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4EAF0] bg-white text-[#24364A]"
          />
          {coordinates && (
            <div className="text-[11px] font-mono text-[#0DA68F] font-semibold pt-1">
              GPS Coordinates: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Action Buttons: Copy & Share */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleCopyLocation}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E4EAF0] hover:bg-[#F5F7FB] text-[#24364A] text-xs font-bold rounded-xl transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Location Copied!" : "Copy Location for Dispatch"}</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E4EAF0] hover:bg-[#F5F7FB] text-[#24364A] text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share via WhatsApp / SMS</span>
          </button>
        </div>

        {/* Transparent Disclaimer */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Transparent Safety Notice:</strong> Tapping &quot;Call&quot; initiates an authentic phone call from your device to India&apos;s government emergency service. CivicFix AI displays verified emergency numbers and coordinates to assist you, but cannot dispatch emergency personnel independently.
          </p>
        </div>
      </div>

      {/* 3. Verified Emergency Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EMERGENCY_CONTACTS.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#E4EAF0] p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {item.badge}
                </span>
                <span className="font-mono text-base font-extrabold text-[#10243A]">
                  {item.number}
                </span>
              </div>
              <h3 className="font-bold text-[#10243A] text-base mt-2">{item.name}</h3>
              <p className="text-xs text-[#657386] mt-1 leading-relaxed">{item.description}</p>
            </div>

            <a
              href={`tel:${item.number}`}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition bg-[#10243A] hover:bg-[#102D43] text-white"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Dial {item.number}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
