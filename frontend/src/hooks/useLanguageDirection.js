import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Applique dir="rtl" et lang sur le document quand la langue est l'arabe.
 */
export function useLanguageDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const root = document.documentElement;
    const lng = i18n.language || 'fr';
    const isRtl = lng === 'ar';
    root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    root.setAttribute('lang', lng);
  }, [i18n.language]);

  useEffect(() => {
    const handler = (lng) => {
      const root = document.documentElement;
      root.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
      root.setAttribute('lang', lng || 'fr');
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);
}
