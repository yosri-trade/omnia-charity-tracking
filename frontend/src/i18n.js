import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('omnia-lang') : null;
const initialLang = savedLang && ['fr', 'ar', 'en'].includes(savedLang) ? savedLang : 'fr';

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, ar: { translation: ar }, en: { translation: en } },
  lng: initialLang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

if (typeof document !== 'undefined') {
  const root = document.documentElement;
  const isRtl = initialLang === 'ar';
  root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  root.setAttribute('lang', initialLang);
}

export default i18n;
