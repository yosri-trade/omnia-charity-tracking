import { useTranslation } from 'react-i18next';
import AppNavbar from '../components/AppNavbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFontSize } from '../context/FontSizeContext.jsx';
import { useFontWeight } from '../context/FontWeightContext.jsx';

/* Icônes A de tailles différentes pour l'intuitivité visuelle */
const FONT_OPTIONS = [
  { value: 'base', labelKey: 'settings.fontSizeStandard', iconClass: 'text-sm font-semibold' },
  { value: 'lg', labelKey: 'settings.fontSizeLarge', iconClass: 'text-base font-semibold' },
  { value: 'xl', labelKey: 'settings.fontSizeXl', iconClass: 'text-lg font-bold' },
];

/* Icônes A avec différentes épaisseurs pour la graisse */
const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', labelKey: 'settings.fontWeightNormal', iconClass: 'font-normal' },
  { value: 'medium', labelKey: 'settings.fontWeightMedium', iconClass: 'font-medium' },
  { value: 'bold', labelKey: 'settings.fontWeightBold', iconClass: 'font-bold' },
];

export default function Settings() {
  const { t } = useTranslation();
  useAuth();
  const { fontSize, setFontSize } = useFontSize();
  const { fontWeight, setFontWeight } = useFontWeight();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
          {t('settings.title')}
        </h1>

        <section
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 mb-6"
          aria-labelledby="font-size-heading"
        >
          <h2 id="font-size-heading" className="text-base font-medium text-slate-800 dark:text-slate-100 mb-4">
            {t('settings.fontSizeLabel')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t('settings.fontSizeHint')}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t('settings.fontSizeLabel')}
          >
            {FONT_OPTIONS.map(({ value, labelKey, iconClass }) => {
              const isSelected = fontSize === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFontSize(value)}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-lg border-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={t(labelKey)}
                >
                  <span className={`inline-flex items-center justify-center w-8 h-8 shrink-0 rounded ${iconClass}`} aria-hidden>
                    A
                  </span>
                  <span>{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 italic">
            {t('settings.fontSizePreview')}
          </p>
        </section>

        <section
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6"
          aria-labelledby="font-weight-heading"
        >
          <h2 id="font-weight-heading" className="text-base font-medium text-slate-800 dark:text-slate-100 mb-4">
            {t('settings.fontWeightLabel')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t('settings.fontWeightHint')}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t('settings.fontWeightLabel')}
          >
            {FONT_WEIGHT_OPTIONS.map(({ value, labelKey, iconClass }) => {
              const isSelected = fontWeight === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFontWeight(value)}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-lg border-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={t(labelKey)}
                >
                  <span className={`inline-flex items-center justify-center w-8 h-8 shrink-0 rounded text-base ${iconClass}`} aria-hidden>
                    A
                  </span>
                  <span>{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 italic">
            {t('settings.fontWeightPreview')}
          </p>
        </section>
      </main>
    </div>
  );
}
