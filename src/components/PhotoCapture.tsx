"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon, X, AlertCircle, CheckCircle } from "lucide-react";
import { isNativeApp, capturePhotoNative, triggerHaptic } from "@/lib/native-mobile";

interface PhotoCaptureProps {
  onPhotoSelected: (base64: string | null, fileName: string | null, mimeType: string | null) => void;
  initialPreview?: string | null;
}

export function PhotoCapture({ onPhotoSelected, initialPreview = null }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleNativeOrWebCapture = async (source: "camera" | "gallery") => {
    setError(null);

    if (isNativeApp()) {
      try {
        setLoading(true);
        triggerHaptic("selection");
        const result = await capturePhotoNative(source);
        if (result) {
          triggerHaptic("success");
          setPreview(result.dataUrl);
          setFileName(result.fileName);
          onPhotoSelected(result.dataUrl, result.fileName, `image/${result.format}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Failed to access device ${source}.`;
        setError(msg);
        triggerHaptic("warning");
      } finally {
        setLoading(false);
      }
    } else {
      // Browser Web fallback
      if (source === "camera") {
        cameraInputRef.current?.click();
      } else {
        galleryInputRef.current?.click();
      }
    }
  };

  const handleFileProcess = (file: File) => {
    setError(null);

    // Validate MIME type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image file exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setFileName(file.name);
      onPhotoSelected(base64, file.name, file.type);
      triggerHaptic("success");
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    onPhotoSelected(null, null, null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    triggerHaptic("selection");
  };

  return (
    <div className="space-y-3">
      {/* Hidden inputs for camera capture & gallery file picker fallback */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-[#E4EAF0] bg-slate-900 shadow-sm max-h-72 flex items-center justify-center">
          <Image
            src={preview}
            alt="Reported problem attachment"
            width={600}
            height={300}
            className="w-full h-auto max-h-72 object-contain"
            unoptimized
          />
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition shadow-md"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#10BFA5]" />
            <span className="truncate max-w-[200px]">{fileName || "Photo Attached"}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Take Photo Button */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleNativeOrWebCapture("camera")}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#E4EAF0] hover:border-[#10BFA5] bg-[#F5F7FB] hover:bg-teal-50/50 text-[#24364A] transition group active:scale-[0.98] disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-[#E4EAF0] group-hover:border-[#10BFA5] flex items-center justify-center text-[#10243A] group-hover:text-[#10BFA5] transition shadow-sm mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10243A]">
              {loading ? "Accessing Camera..." : "Take Photo"}
            </span>
            <span className="text-[11px] text-[#657386] mt-0.5">Use device camera</span>
          </button>

          {/* Choose from Gallery Button */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleNativeOrWebCapture("gallery")}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#E4EAF0] hover:border-[#10BFA5] bg-[#F5F7FB] hover:bg-teal-50/50 text-[#24364A] transition group active:scale-[0.98] disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-[#E4EAF0] group-hover:border-[#10BFA5] flex items-center justify-center text-[#10243A] group-hover:text-[#10BFA5] transition shadow-sm mb-2">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10243A]">
              {loading ? "Accessing Photos..." : "Choose from Gallery"}
            </span>
            <span className="text-[11px] text-[#657386] mt-0.5">JPEG, PNG up to 5MB</span>
          </button>
        </div>
      )}
    </div>
  );
}
