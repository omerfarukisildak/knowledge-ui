import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultLang } from './config-lang';
import en from './locales/en.json';
import tr from './locales/tr.json';

i18n.use(initReactI18next).init({
  resources: {
    tr: { translations: tr },
    en: { translations: en }
  },
  lng: defaultLang.value,
  fallbackLng: defaultLang.value,
  debug: false,
  ns: ['translations'],
  defaultNS: 'translations',
  interpolation: { escapeValue: false }
});

export default i18n;
