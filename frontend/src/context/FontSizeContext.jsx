import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'omnia-font-size';

const FONT_SIZES = ['base', 'lg', 'xl'];

const FontSizeContext = createContext(null);

export function FontSizeProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return 'base';
    const saved = localStorage.getItem(STORAGE_KEY);
    return FONT_SIZES.includes(saved) ? saved : 'base';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-standard', 'font-size-large', 'font-size-xl');
    const cls = fontSize === 'base' ? 'font-size-standard' : fontSize === 'lg' ? 'font-size-large' : 'font-size-xl';
    root.classList.add(cls);
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  const setFontSizeValue = (value) => {
    if (FONT_SIZES.includes(value)) setFontSize(value);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize: setFontSizeValue }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error('useFontSize must be used within FontSizeProvider');
  return ctx;
}
