import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'omnia-font-weight';

const FONT_WEIGHTS = ['normal', 'medium', 'bold'];

const FontWeightContext = createContext(null);

export function FontWeightProvider({ children }) {
  const [fontWeight, setFontWeight] = useState(() => {
    if (typeof window === 'undefined') return 'normal';
    const saved = localStorage.getItem(STORAGE_KEY);
    return FONT_WEIGHTS.includes(saved) ? saved : 'normal';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-normal', 'font-medium', 'font-bold');
    const cls = fontWeight === 'normal' ? 'font-normal' : fontWeight === 'medium' ? 'font-medium' : 'font-bold';
    root.classList.add(cls);
    localStorage.setItem(STORAGE_KEY, fontWeight);
  }, [fontWeight]);

  const setFontWeightValue = (value) => {
    if (FONT_WEIGHTS.includes(value)) setFontWeight(value);
  };

  return (
    <FontWeightContext.Provider value={{ fontWeight, setFontWeight: setFontWeightValue }}>
      {children}
    </FontWeightContext.Provider>
  );
}

export function useFontWeight() {
  const ctx = useContext(FontWeightContext);
  if (!ctx) throw new Error('useFontWeight must be used within FontWeightProvider');
  return ctx;
}
