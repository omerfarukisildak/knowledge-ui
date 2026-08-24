'use client';

import * as React from 'react';
import { useMemo } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { CssVarsProvider } from '@mui/material/styles';

import { createTheme } from 'src/styles/theme/create-theme';
import type { Settings } from 'src/types/settings';

import EmotionCache from './emotion-cache';

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialPrimaryColor?: Settings['primaryColor'];
}

export function ThemeProvider({ children, initialPrimaryColor = 'royalBlue' }: ThemeProviderProps): React.JSX.Element {
  const theme = useMemo(() => {
    return createTheme({
      primaryColor: initialPrimaryColor,
      direction: 'ltr'
    });
  }, [initialPrimaryColor]);

  return (
    <EmotionCache options={{ key: 'mui' }}>
      <CssVarsProvider
        defaultMode="light"
        modeStorageKey="mui-mode"
        theme={theme}
        disableTransitionOnChange
      >
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </EmotionCache>
  );
}
