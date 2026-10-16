"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "../lib/cities";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue>({ lang: "ka", setLang: () => undefined });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ka");

  useEffect(() => {
    const saved = window.localStorage.getItem("mgzavri-language");
    if (saved === "en" || saved === "ka") {
      queueMicrotask(() => {
        setLang(saved);
        document.documentElement.lang = saved;
      });
    }
  }, []);

  function updateLanguage(next: Lang) {
    setLang(next);
    window.localStorage.setItem("mgzavri-language", next);
    document.documentElement.lang = next;
  }

  return <LanguageContext.Provider value={{ lang, setLang: updateLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
