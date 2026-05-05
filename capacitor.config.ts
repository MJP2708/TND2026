import type { CapacitorConfig } from "@capacitor/cli";

// NextAuth requires a live Node.js server (cannot be statically exported).
// Capacitor loads the running web app inside the native WebView via server.url.
//
// Development (Android emulator): 10.0.2.2 = host machine localhost
// Development (iOS Simulator):    Replace with your Mac's LAN IP, e.g. http://192.168.1.X:3000
// Production:                      Replace with your deployed HTTPS URL, e.g. https://your-app.vercel.app
//
// To build the Android app:
//   1. npm run dev            (keep the Next.js server running)
//   2. npx cap sync android
//   3. npx cap open android   (opens Android Studio)
//   4. Run on emulator or device

const config: CapacitorConfig = {
  appId: "com.tycoonfocus.app",
  appName: "Tycoon Focus",
  webDir: "public",
  server: {
    url: "http://10.0.2.2:3000",
    cleartext: true,
    androidScheme: "http",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#f8f5ef",
      showSpinner: false,
    },
  },
};

export default config;
