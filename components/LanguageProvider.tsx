"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "ka";

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: any) {

  const [lang, setLang] = useState<Lang>("ka");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved) setLang(saved);
  }, []);

  function changeLang(newLang: Lang) {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}