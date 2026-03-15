import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'pt-BR',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

// Date formatting by locale
export function formatDateByLocale(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lng = locale || i18n.language;
  const localeMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
  };
  return d.toLocaleDateString(localeMap[lng] || 'pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeByLocale(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lng = locale || i18n.language;
  const localeMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
  };
  return d.toLocaleString(localeMap[lng] || 'pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Number formatting by locale
export function formatNumberByLocale(num: number, locale?: string): string {
  const lng = locale || i18n.language;
  const localeMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
  };
  return num.toLocaleString(localeMap[lng] || 'pt-BR');
}

export function formatPercentByLocale(num: number, locale?: string): string {
  const lng = locale || i18n.language;
  const localeMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
  };
  return num.toLocaleString(localeMap[lng] || 'pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
