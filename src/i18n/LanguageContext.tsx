import React, { createContext, useContext, useEffect, useState } from 'react';
import { CRAFT_UNIVERSE_BRAND } from '../config/craftUniverse';
import { Language } from '../types/game';

interface LanguageContextValue {
  language: Language;
  isEn: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qLang = params.get('lang');
      if (qLang === 'ko' || qLang === 'en') return qLang;

      const shared = localStorage.getItem(CRAFT_UNIVERSE_BRAND.langStorageKey);
      if (shared === 'ko' || shared === 'en') return shared;

      const legacy = localStorage.getItem('personnel_craft_lang');
      if (legacy === 'ko' || legacy === 'en') return legacy;

      return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
    } catch {
      return 'ko';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(CRAFT_UNIVERSE_BRAND.langStorageKey, lang);
      localStorage.setItem('personnel_craft_lang', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, isEn: language === 'en', setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
