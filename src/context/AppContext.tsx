import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { Language } from '../types/i18n';

interface AppContextType {
  theme: 'light' | 'dark';
  lang: Language;
  toggleTheme: () => void;
  changeLanguage: (newLang: Language) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('clinic_theme') as 'light' | 'dark') || 'light'
  );
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('clinic_lang') as Language) || 'en'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply Tailwind Dark Mode class attribute configuration
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('clinic_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('lang', lang);
    
    // Auto-toggle Right-to-Left formatting layout for Arabic
    if (lang === 'ar') {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }
    localStorage.setItem('clinic_lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const changeLanguage = (newLang: Language) => setLang(newLang);

  return (
    <AppContext.Provider value={{ theme, lang, toggleTheme, changeLanguage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};