export type ThemePreference = "system" | "light" | "dark";
export type DensityPreference = "comfortable" | "compact";
export type AccentPreference = "emerald" | "violet" | "sky" | "rose";

export type UiPreferences = {
  theme: ThemePreference;
  density: DensityPreference;
  accent: AccentPreference;
};

export const UI_PREFERENCES_STORAGE_KEY = "ui-preferences";

const ACCENT_STYLES: Record<
  AccentPreference,
  { primary: string; ring: string; sidebarPrimary: string }
> = {
  emerald: {
    primary: "oklch(0.62 0.16 154)",
    ring: "oklch(0.73 0.11 154)",
    sidebarPrimary: "oklch(0.62 0.16 154)",
  },
  violet: {
    primary: "oklch(0.58 0.19 304)",
    ring: "oklch(0.70 0.10 304)",
    sidebarPrimary: "oklch(0.58 0.19 304)",
  },
  sky: {
    primary: "oklch(0.60 0.14 240)",
    ring: "oklch(0.72 0.09 240)",
    sidebarPrimary: "oklch(0.60 0.14 240)",
  },
  rose: {
    primary: "oklch(0.63 0.19 14)",
    ring: "oklch(0.74 0.10 14)",
    sidebarPrimary: "oklch(0.63 0.19 14)",
  },
};

export const defaultUiPreferences: UiPreferences = {
  theme: "system",
  density: "comfortable",
  accent: "emerald",
};

export function readUiPreferences(): UiPreferences {
  if (typeof window === "undefined") return defaultUiPreferences;

  try {
    const raw = localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return defaultUiPreferences;

    const parsed = JSON.parse(raw) as Partial<UiPreferences>;

    return {
      theme:
        parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
          ? parsed.theme
          : defaultUiPreferences.theme,
      density: parsed.density === "compact" ? "compact" : "comfortable",
      accent:
        parsed.accent === "violet" || parsed.accent === "sky" || parsed.accent === "rose"
          ? parsed.accent
          : "emerald",
    };
  } catch {
    return defaultUiPreferences;
  }
}

export function writeUiPreferences(preferences: UiPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function applyUiPreferences(preferences: UiPreferences): void {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = preferences.theme === "dark" || (preferences.theme === "system" && prefersDark);

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-density", preferences.density);
  root.setAttribute("data-accent", preferences.accent);

  const accent = ACCENT_STYLES[preferences.accent];
  root.style.setProperty("--primary", accent.primary);
  root.style.setProperty("--ring", accent.ring);
  root.style.setProperty("--sidebar-primary", accent.sidebarPrimary);
}
