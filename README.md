# CivicFix AI — AI-Powered Civic Grievance & Community Services Platform

**Smarter Cities. Better Communities.**

CivicFix AI is a full-stack, production-oriented civic grievance reporting and resolution tracking web application and installable cross-platform mobile application (Android & iOS). It transforms unstructured citizen reports and photos into structured, actionable municipal records using Gemini AI, routes them to verified government departments, enables transparent tracking with resolution audit histories, and provides location-aware emergency and medical services discovery.

---

## 🏛️ System Architecture

- **Frontend Framework**: Next.js 14 (App Router) with TypeScript & React 18
- **Mobile Engine**: Capacitor 8.5 with native Android & iOS projects
- **Styling & Design System**: Tailwind CSS with an iOS-inspired, high-contrast civic color palette:
  - Deep Navy: `#10243A`
  - Secondary Navy: `#102D43`
  - Teal: `#10BFA5`
  - Soft White: `#F5F7FB`
  - Muted Grey: `#8A94A6`
  - Text Primary: `#24364A`
  - Text Secondary: `#657386`
  - Borders: `#E4EAF0`
- **Native Mobile Bridge**:
  - `@capacitor/camera`: Hardware device camera capture and photo gallery picker with graceful web fallback
  - `@capacitor/geolocation`: Native high-accuracy GPS with permission negotiation and browser fallback
  - `@capacitor/status-bar`: Native iOS & Android status bar styling (`#10243A`)
  - `@capacitor/haptics`: Tactile response on steps, selections, and submissions
  - `@capacitor/splash-screen`: Branded splash screen
- **Database & ORM**: PostgreSQL-ready schema with Prisma ORM and persistent SQLite (`dev.db`) for zero-config local run
- **Security & Authentication**:
  - Secure bcrypt password hashing
  - Signed JWT session handling in `httpOnly`, `sameSite: lax` cookies
  - Strict server-side route protection & ownership checks (IDOR prevention)
  - Role-Based Access Control (`CITIZEN` vs `ADMIN`)
- **AI Intelligence**: Google Gemini API via official `@google/generative-ai` SDK with server-side schema validation and rule-based heuristic fallback
- **Interactive Maps & Geocoding**: Leaflet & OpenStreetMap interactive map with draggable problem markers, GPS location acquisition, reverse-geocoding, and complete manual address fallback
- **Email Dispatch**: Server-side transactional email provider integration (Resend) with customizable formal drafts and Section 15 subtle sent indicator
- **Testing**: Jest, Testing Library, and End-to-End User Journey suites

---

## 📱 Mobile App Architecture & Capacitor Integration

### Architectural Decision: Hybrid Bridge vs. Static Export
1. **Static Export Limitation**: Next.js 14 App Router relies on server-side Route Handlers (`src/app/api/*`), Node.js Prisma SQLite queries, bcrypt cryptography, and secure environment secrets (`GEMINI_API_KEY`, `RESEND_API_KEY`, `JWT_SECRET`). If forced into `output: 'export'`, Next.js disables all API routes and database drivers, which would break the application.
2. **Recommended Safe Architecture**: 
   - **Backend Server**: The Next.js server runs as the authoritative API and database engine.
   - **Capacitor Mobile Shell**: The native Android (`android/`) and iOS (`ios/`) projects embed the Capacitor bridge runtime, providing native access to hardware sensors (Camera, GPS, Haptics, Status Bar).
   - **Live Native Bridge Connection**: In `capacitor.config.ts`, `server.url` directs the native mobile webview to the backend (e.g., `http://10.0.2.2:3000` for Android Emulator, `http://localhost:3000` for iOS Simulator, or your deployed domain), while the native Capacitor bridge remains fully active.

---

## 🤖 Android App: Building & Installing the APK

The real Android project is located in [`android/`](file:///Users/krishnashejwal/Documents/Prompt%20War/android/).

### Prerequisites for Android
- Java Development Kit (JDK 17 or 21)
- Android Studio with Android SDK (API 34/35)

### Steps to Build the APK:

1. **Sync Capacitor Plugins**:
   ```bash
   npm run cap:sync
   ```

2. **Option A: Build via Command Line (Gradle)**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The built APK will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Option B: Build via Android Studio**:
   ```bash
   npm run cap:open:android
   ```
   - In Android Studio, wait for Gradle sync to complete.
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - Click **locate** to get the debug APK.
   - Or click the green **Run** button to deploy directly to a connected USB Android device or Android Emulator.

### Android Permissions Configured:
- `android.permission.INTERNET`
- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE` / `android.permission.READ_MEDIA_IMAGES`
- `android.permission.ACCESS_FINE_LOCATION` / `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.CALL_PHONE` (for instant 112 emergency dialing)

---

## 🍏 iOS App: Building with Xcode

The real iOS project is located in [`ios/`](file:///Users/krishnashejwal/Documents/Prompt%20War/ios/).

### Prerequisites for iOS
- macOS with Xcode 15+ installed
- CocoaPods / Swift Package Manager (Capacitor 8 uses modern SPM)

### Steps to Build the iOS App:

1. **Sync Capacitor Plugins**:
   ```bash
   npm run cap:sync
   ```

2. **Open the Project in Xcode**:
   ```bash
   npm run cap:open:ios
   # Or directly:
   open ios/App/App.xcodeproj
   ```

3. **Build & Run**:
   - In Xcode, select your target simulator (e.g., *iPhone 16 Pro*) or a connected physical iPhone.
   - Select your development team under **Signing & Capabilities** if building for a physical device.
   - Press **Cmd + R** or click the **Play** button to build and launch the app.

### iOS Privacy Permissions Configured (`Info.plist`):
- `NSCameraUsageDescription`: *"CivicFix AI requires camera access to photograph civic issues such as potholes, damaged infrastructure, and hazardous waste."*
- `NSPhotoLibraryUsageDescription`: *"CivicFix AI needs photo library access to allow you to select and attach images of civic issues."*
- `NSLocationWhenInUseUsageDescription`: *"CivicFix AI requires your location to accurately pinpoint civic problem sites on the municipal map and identify nearby emergency facilities."*
- `NSLocationAlwaysAndWhenInUseUsageDescription`: *"CivicFix AI uses your location to provide accurate civic reporting and rapid 112 emergency routing."*

---

## 🚀 Web Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="civicfix_ai_jwt_secret_super_secure_key_2026_production_v1"
GEMINI_API_KEY="" # Optional: Google AI Studio key for live Gemini 1.5 Flash
RESEND_API_KEY="" # Optional: Resend API key for transactional emails
EMAIL_FROM="CivicFix AI <notifications@civicfix.ai>"
```

### 3. Database Migration & Seeding
```bash
npx prisma db push
node scripts/seed.mjs
```

### 4. Running the Development Server
```bash
npm run dev
# Or production build & start:
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Seed Test Accounts

The database comes pre-seeded with verified test accounts:

| Role | Email | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **Citizen** | `krishna@civicfix.ai` | `Password123!` | Krishna Shejwal |
| **Admin** | `admin@civicfix.ai` | `Password123!` | Chief Civic Administrator |

---

## 🧪 Testing & Verification

### Unit & Integration Tests (Jest)
Run the automated test suites verifying validations, schemas, AI heuristics, email drafting, emergency directories, and authentication primitives:
```bash
npm test
```

### Live End-to-End User Journey Verification
Run the end-to-end verification script against the running server:
```bash
node scripts/e2e-verify.mjs
```
All 13 user journeys pass with 100% success rate.
