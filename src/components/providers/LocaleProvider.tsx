"use client";

import { useState, useEffect, useCallback } from "react";
import { LocaleContext, getTranslations } from "@/hooks/useLocale";
import type { LocaleKey } from "@/hooks/useLocale";

const LOCALE_STORAGE_KEY = "life-rpg-locale";
const VALID_LOCALES: LocaleKey[] = ["ru", "en", "kz"];

function getSavedLocale(): LocaleKey {
  if (typeof window === "undefined") return "ru";
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && VALID_LOCALES.includes(saved as LocaleKey)) return saved as LocaleKey;
  } catch {}
  return "ru";
}

export default function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: LocaleKey;
}) {
  const [locale, setLocaleState] = useState<LocaleKey>(initialLocale ?? "ru");
  const [hydrated, setHydrated] = useState(false);

  // On mount: restore locale from localStorage
  useEffect(() => {
    const saved = getSavedLocale();
    if (saved !== locale) setLocaleState(saved);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((newLocale: LocaleKey) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {}
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = getTranslations(hydrated ? locale : (initialLocale ?? "ru"));

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
