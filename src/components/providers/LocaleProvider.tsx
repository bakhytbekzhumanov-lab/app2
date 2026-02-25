"use client";

import { useState, useEffect } from "react";
import { LocaleContext, getTranslations } from "@/hooks/useLocale";
import type { LocaleKey } from "@/hooks/useLocale";

export default function LocaleProvider({
  children,
  initialLocale = "ru",
}: {
  children: React.ReactNode;
  initialLocale?: LocaleKey;
}) {
  const [locale, setLocale] = useState<LocaleKey>(initialLocale);
  const t = getTranslations(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
