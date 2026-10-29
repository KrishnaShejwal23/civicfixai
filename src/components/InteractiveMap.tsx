"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent, DragEndEvent } from "leaflet";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import { isNativeApp, getCurrentPositionNative, triggerHaptic } from "@/lib/native-mobile";

interface Coordinates {
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onLocationChange: (loc: {
    lat: number;
    lng: number;
    formattedAddress?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => void;
}

export function InteractiveMap({
  initialLat = 18.5204, // Default Pune center as standard sample reference
  initialLng = 73.8567,
  initialAddress = "",
  onLocationChange,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [coords, setCoords] = useState<Coordinates>({
    lat: initialLat || 18.5204,
    lng: initialLng || 73.8567,
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    initialAddress ? `Current address: ${initialAddress}` : null
  );

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      setStatusMessage("Resolving address coordinates...");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = (await res.json()) as {
          display_name?: string;
          address?: {
            road?: string;
            suburb?: string;
            neighbourhood?: string;
            residential?: string;
            city?: string;
            town?: string;
            county?: string;
            state?: string;
            postcode?: string;
          };
        };
        const addr = data.address || {};
        const formatted =
          data.display_name || `${addr.road || ""}, ${addr.suburb || addr.neighbourhood || ""}, ${addr.city || addr.town || ""}`;

        onLocationChangeRef.current({
          lat,
          lng,
          formattedAddress: formatted,
          area: addr.suburb || addr.neighbourhood || addr.residential || "",
          city: addr.city || addr.town || addr.county || "Pune",
          state: addr.state || "Maharashtra",
          pincode: addr.postcode || "",
        });
        setStatusMessage(`Pin placed at: ${formatted.slice(0, 45)}...`);
      } else {
        onLocationChangeRef.current({ lat, lng });
        setStatusMessage(`Coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      onLocationChangeRef.current({ lat, lng });
      setStatusMessage(`Coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;

        // Custom Issue Pin Icon
        const issueIcon = L.divIcon({
          className: "custom-issue-pin",
          html: `<div style="
            background: #10243A;
            color: #10BFA5;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            transform: translate(-50%, -100%);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10BFA5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        if (!mapInstanceRef.current && mapContainerRef.current && isMounted) {
          const map = L.map(mapContainerRef.current, {
            center: [coords.lat, coords.lng],
            zoom: 14,
            zoomControl: true,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          // Draggable Problem Issue Marker
          const marker = L.marker([coords.lat, coords.lng], {
            icon: issueIcon,
            draggable: true,
          }).addTo(map);

          marker.on("dragend", async (e: DragEndEvent) => {
            const targetMarker = e.target as LeafletMarker;
            const pos = targetMarker.getLatLng();
            setCoords({ lat: pos.lat, lng: pos.lng });
            triggerHaptic("selection");
            await reverseGeocode(pos.lat, pos.lng);
          });

          map.on("click", async (e: LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
            triggerHaptic("selection");
            await reverseGeocode(e.latlng.lat, e.latlng.lng);
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
        }
      } catch (err) {
        console.error("Map initialization failed:", err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords.lat, coords.lng, reverseGeocode]);

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setStatusMessage("Acquiring GPS position...");
    triggerHaptic("selection");

    // 1. Try Native Capacitor Geolocation first
    if (isNativeApp()) {
      try {
        const pos = await getCurrentPositionNative();
        if (pos) {
          setCoords({ lat: pos.latitude, lng: pos.longitude });
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([pos.latitude, pos.longitude], 16);
            markerRef.current.setLatLng([pos.latitude, pos.longitude]);
          }
          triggerHaptic("success");
          await reverseGeocode(pos.latitude, pos.longitude);
          setGpsLoading(false);
          return;
        }
      } catch (err: unknown) {
        console.warn("Native GPS attempt failed, trying browser API:", err);
      }
    }

    // 2. Browser Geolocation fallback
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your current browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }

        triggerHaptic("success");
        await reverseGeocode(lat, lng);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setStatusMessage("GPS location was denied. You can manually drag the pin or enter address.");
        triggerHaptic("warning");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Top action bar: GPS locate + instructions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#0DA68F] font-bold text-xs rounded-xl border border-[#10BFA5]/30 transition shadow-sm active:scale-95"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
          <span>{gpsLoading ? "Acquiring GPS..." : "Use Current Location"}</span>
        </button>

        <span className="text-[11px] text-[#657386] flex items-center gap-1">
          <Crosshair className="w-3.5 h-3.5 text-[#10BFA5]" />
          <span>Click map or drag the pin to pinpoint problem site</span>
        </span>
      </div>

      {/* Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E4EAF0] shadow-sm bg-slate-100 h-64 md:h-72 w-full z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating coordinates badge */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#E4EAF0] text-[11px] font-mono text-[#24364A] shadow-sm flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-[#10243A]" />
          <span>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="text-xs text-[#24364A] bg-[#F5F7FB] px-3 py-1.5 rounded-lg border border-[#E4EAF0] truncate">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
