// Client-side user preferences (persisted in localStorage).
// Mirrors the toggles from the screenshot: Auto Translate, Confirm-and-send,
// default languages, translation font size + color.
export type FontSize = "small" | "medium" | "large" | "maximum";

export interface ChatSettings {
  autoTranslate: boolean;   // auto-translate every message immediately
  confirmSend: boolean;     // show translation preview before "sending"
  myLang: string;           // language I speak (default target for "they said")
  theirLang: string;        // language they speak (default target for "I said")
  fontSize: FontSize;
  translateColor: string;   // hex color for translated text
  providerNote?: string;
}

const KEY = "lingua_chat_settings";

export const DEFAULT_SETTINGS: ChatSettings = {
  autoTranslate: true,
  confirmSend: false,
  myLang: "my",
  theirLang: "en",
  fontSize: "medium",
  translateColor: "#2563eb",
};

export function loadSettings(): ChatSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: ChatSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export const FONT_SIZE_PX: Record<FontSize, string> = {
  small: "12px",
  medium: "14px",
  large: "17px",
  maximum: "20px",
};
