import type { CapacitorConfig } from "@capacitor/cli";

// One codebase -> Android + iOS.
// The native app is a shell that loads your deployed SaaS (you own the server).
// Set SERVER_URL to your deployed domain (e.g. https://lingua.yourdomain.com).
const isPreview = process.env.LINGUA_MOBILE_PREVIEW === "true";
const config: CapacitorConfig = {
  appId: isPreview ? "com.lingua.translate.preview" : "com.lingua.translate",
  appName: isPreview ? "Lingua Mobile Preview" : "Lingua Translate",
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
