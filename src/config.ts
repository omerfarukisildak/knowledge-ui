import type { PrimaryColor } from 'src/styles/theme/types';
import { getSiteURL } from 'src/utils/get-site-url';
import { LogLevel } from 'src/utils/logger';

export interface Config {
  site: {
    name: string;
    /** Shell sidebar badge — keep it short (2-4 chars). */
    shortName: string;
    description: string;
    primaryColor: PrimaryColor;
    themeColor: string;
    url: string;
    version: string;
  };
  logLevel: keyof typeof LogLevel;
}

export const config = {
  site: {
    name: 'Knowledge - Dakika',
    shortName: 'KB',
    description: '',
    themeColor: '#090a0b',
    primaryColor: 'royalBlue',
    url: getSiteURL(),
    version: process.env.NEXT_PUBLIC_SITE_VERSION || '0.0.0'
  },
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel) || LogLevel.ALL
} satisfies Config;
