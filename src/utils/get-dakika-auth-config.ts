import { DakikaAuthConfig } from '@dakika/auth/dist/src/types';

export const getDakikaAuthConfig = (): DakikaAuthConfig => {
  return {
    APP_NAME: process.env.APP_NAME,
    OAUTH_USERNAME: process.env.OAUTH_USERNAME,
    OAUTH_PASSWORD: process.env.OAUTH_PASSWORD,
    NEXT_PUBLIC_OAUTH_URL: process.env.NEXT_PUBLIC_OAUTH_URL,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    IV: process.env.IV,
    NEXT_PUBLIC_SUB_DOMAIN: process.env.NEXT_PUBLIC_SUB_DOMAIN,
    SECURE_COOKIE: process.env.SECURE_COOKIE === 'true',
    CHECK_AUTHORITY: false, // TODO: This may need to be changed
    REQUIRED_AUTHORITIES: [], // TODO: This may need to be changed
    REDIRECT_URL_WITHOUT_AUTHORITY: process.env.NEXT_PUBLIC_REDIRECT_URL
  };
};
