'use client';

import React, { type FC, type ReactNode, useEffect, useState } from 'react';

import { LoadingNav } from 'src/components/layout/vertical/loading-nav';
import { LANGUAGE_STORAGE_KEY, defaultLang, isSupportedLanguage } from 'src/i18n/config-lang';
import i18n from 'src/i18n/i18n';

interface InternationalizationContextProps {
  children: ReactNode;
}

/**
 * Restores the persisted language before the tree renders so the first paint is
 * not in the fallback language. Replace `localStorage` with a backend locale
 * service here when one becomes available.
 */
export const InternationalizationContext: FC<InternationalizationContextProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
    const language = isSupportedLanguage(stored) ? stored : defaultLang.value;

    i18n
      .changeLanguage(language)
      .catch(error => {
        console.error('Failed to set language', error);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  if (!isReady) {
    return <LoadingNav />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};
