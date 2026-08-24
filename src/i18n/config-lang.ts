import { enUS, trTR } from '@mui/material/locale';

export type Language = 'en' | 'tr';

export interface LanguageOption {
  label: string;
  value: Language;
  numberFormatting: string;
  systemValue: typeof enUS | typeof trTR;
  icon: string;
}

export const allLangs: LanguageOption[] = [
  {
    label: 'Türkçe',
    value: 'tr',
    numberFormatting: 'tr-TR',
    systemValue: trTR,
    icon: '/assets/flag-tr.svg'
  },
  {
    label: 'English',
    value: 'en',
    numberFormatting: 'en-US',
    systemValue: enUS,
    icon: '/assets/flag-en.svg'
  }
];

export const defaultLang = allLangs[0]; // Turkish

/** Where the selected language is persisted on the client. */
export const LANGUAGE_STORAGE_KEY = 'app.language';

export const isSupportedLanguage = (value: string | null | undefined): value is Language =>
  allLangs.some(lang => lang.value === value);
