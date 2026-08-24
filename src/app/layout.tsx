import * as React from 'react';

import type { Viewport } from 'next';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

import { Toaster } from 'src/components/toaster';
import { config } from 'src/config';
import { LocalizationProvider } from 'src/provider/localization-provider';
import { ThemeProvider } from 'src/provider/theme-provider/theme-provider';
import 'src/styles/global.css';
import { applyDefaultSettings } from 'src/utils/settings/apply-default-settings';
import { getSettings as getPersistedSettings } from 'src/utils/settings/get-settings';
import 'src/validate-env';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: config.site.themeColor
} satisfies Viewport;

export const metadata = {
  title: config.site.name,
  icons: {
    icon: '/favicon-20250309.ico'
  }
};

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps): Promise<React.JSX.Element> {
  const settings = applyDefaultSettings(await getPersistedSettings());

  return (
    <html suppressHydrationWarning>
      {/* id, Tailwind'in `important` seçicisi — bkz. tailwind.config.ts */}
      <body id="app-root">
        <InitColorSchemeScript
          attribute="data-mui-color-scheme"
          modeStorageKey="mui-mode"
          defaultMode="light"
        />
        <LocalizationProvider>
          <Toaster
            richColors
            position="bottom-left"
          />
          <ThemeProvider initialPrimaryColor={settings.primaryColor}>{children}</ThemeProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
