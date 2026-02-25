"use client";

import { createContext, useContext } from "react";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import kz from "@/locales/kz.json";

type LocaleKey = "ru" | "en" | "kz";
type Translations = typeof ru;

const locales: Record<LocaleKey, Translations> = { ru, en, kz };

interface LocaleContextValue {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  t: Translations;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: "ru",
  setLocale: () => {},
  t: ru,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function getTranslations(locale: LocaleKey): Translations {
  return locales[locale] ?? ru;
}

export type { LocaleKey, Translations };
