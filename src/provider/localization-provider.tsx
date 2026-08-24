'use client';

import * as React from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider as Provider } from '@mui/x-date-pickers/LocalizationProvider';
import { enUS, trTR } from '@mui/x-date-pickers/locales';

import 'dayjs/locale/en';
import 'dayjs/locale/tr';
import { useTranslation } from 'react-i18next';

import 'src/i18n/i18n';

export interface LocalizationProviderProps {
  children: React.ReactNode;
}

const normalizeDayjsLocale = (language: string): string => {
  if (language.toLowerCase().startsWith('tr')) {
    return 'tr';
  }
  return 'en';
};

export function LocalizationProvider({ children }: LocalizationProviderProps): React.JSX.Element {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const dayjsLocale = normalizeDayjsLocale(language);
  let localeText = enUS.components.MuiLocalizationProvider.defaultProps.localeText;
  if (dayjsLocale === 'tr') {
    localeText = trTR.components.MuiLocalizationProvider.defaultProps.localeText;
  }

  return (
    <Provider
      dateAdapter={AdapterDayjs}
      adapterLocale={dayjsLocale}
      localeText={localeText}
    >
      {children}
    </Provider>
  );
}
