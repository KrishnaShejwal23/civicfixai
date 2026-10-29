"use client";

import { Capacitor } from "@capacitor/core";

export interface NativePhotoResult {
  base64String: string;
  dataUrl: string;
  format: string;
  fileName: string;
}

export interface NativeLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Check if the current client is running inside a native Capacitor shell (Android / iOS).
 */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function getNativePlatform(): "android" | "ios" | "web" {
  if (typeof window === "undefined") return "web";
  return Capacitor.getPlatform() as "android" | "ios" | "web";
}

/**
 * Capture photo via Capacitor Native Camera or Photo Library with graceful fallback.
 */
export async function capturePhotoNative(
  sourceType: "camera" | "gallery"
): Promise<NativePhotoResult | null> {
  if (!isNativeApp()) {
    return null; // Will trigger HTML5 file picker fallback
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");

    // Check & request camera / photos permissions
    const permissions = await Camera.checkPermissions();
    if (sourceType === "camera" && permissions.camera !== "granted") {
      const requested = await Camera.requestPermissions({ permissions: ["camera"] });
      if (requested.camera !== "granted") {
        throw new Error("Camera permission denied. Please enable camera access in your device Settings.");
      }
    } else if (sourceType === "gallery" && permissions.photos !== "granted") {
      const requested = await Camera.requestPermissions({ permissions: ["photos"] });
      if (requested.photos !== "granted") {
        throw new Error("Photo library permission denied. Please enable photo access in Settings.");
      }
    }

    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: sourceType === "camera" ? CameraSource.Camera : CameraSource.Photos,
      correctOrientation: true,
      saveToGallery: false,
    });

    if (!photo.base64String) {
      return null;
    }

    const format = photo.format || "jpeg";
    const dataUrl = `data:image/${format};base64,${photo.base64String}`;
    const fileName = `civic_${sourceType}_${Date.now()}.${format}`;

    return {
      base64String: photo.base64String,
      dataUrl,
      format,
      fileName,
    };
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes("User cancelled") || err.message.includes("cancelled"))) {
      return null; // User simply closed the picker
    }
    console.warn("Capacitor camera error, fallback available:", err);
    throw err;
  }
}

/**
 * Obtain GPS position via Capacitor Native Geolocation plugin.
 */
export async function getCurrentPositionNative(): Promise<NativeLocationResult | null> {
  if (!isNativeApp()) {
    return null; // Will use navigator.geolocation
  }

  try {
    const { Geolocation } = await import("@capacitor/geolocation");

    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted") {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== "granted") {
        throw new Error("Location permission was denied. Please allow location access in your device Settings.");
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (err: unknown) {
    console.warn("Capacitor geolocation error, fallback available:", err);
    throw err;
  }
}

/**
 * Trigger subtle native tactile haptics on user actions.
 */
export async function triggerHaptic(type: "selection" | "success" | "warning"): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { Haptics, NotificationType, ImpactStyle } = await import("@capacitor/haptics");
    if (type === "selection") {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === "success") {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === "warning") {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  } catch {
    // Haptics optional
  }
}

/**
 * Setup mobile status bar and splash screen on startup.
 */
export async function setupNativeMobileShell(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#10243A" });
  } catch (err) {
    console.warn("StatusBar setup error:", err);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (err) {
    console.warn("SplashScreen setup error:", err);
  }
}
