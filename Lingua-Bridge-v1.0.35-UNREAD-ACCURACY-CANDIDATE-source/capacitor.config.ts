import type { CapacitorConfig } from "@capacitor/cli";

// One codebase -> Android + iOS.
// The native app is a shell that loads your deployed SaaS (you own the server).
// Set SERVER_URL to your deployed domain (e.g. https://lingua.yourdomain.com).
const config: CapacitorConfig = {
  appId: "com.lingua.translate",
  appName: "Lingua Translate",
  webDir: "mobile-shell",
  backgroundColor: "#ffffff",
  server: {
    url: process.env.SERVER_URL || "https://your-domain.com",
    androidScheme: "https",
    cleartext: false,
  },
  android: { allowMixedContent: false, captureInput: true },
  ios: { contentInset: "always" },
};

export default config;
