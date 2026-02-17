"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyUiPreferences,
  defaultUiPreferences,
  readUiPreferences,
  writeUiPreferences,
  type UiPreferences,
} from "@/lib/ui-preferences";

type UiPreferencesContextType = {
  preferences: UiPreferences;
  updatePreferences: (next: Partial<UiPreferences>) => void;
  resetPreferences: () => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextType | null>(
  null,
);

export default function UiPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<UiPreferences>(() => {
    if (typeof window === "undefined") return defaultUiPreferences;
    return readUiPreferences();
  });

  useEffect(() => {
    applyUiPreferences(preferences);
    writeUiPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      setPreferences((current) => {
        if (current.theme !== "system") return current;
        applyUiPreferences(current);
        return current;
      });
    };

    media.addEventListener("change", handleSystemThemeChange);
    return () => media.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const updatePreferences = useCallback((next: Partial<UiPreferences>) => {
    setPreferences((current) => ({ ...current, ...next }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultUiPreferences);
  }, []);

  const value = useMemo(
    () => ({ preferences, updatePreferences, resetPreferences }),
    [preferences, resetPreferences, updatePreferences],
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error(
      "useUiPreferences must be used within UiPreferencesProvider",
    );
  }

  return context;
}
