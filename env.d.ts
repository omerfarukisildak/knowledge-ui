export interface Env {
  // App
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_SITE_VERSION?: string;

  // Logger
  NEXT_PUBLIC_LOG_LEVEL?: string;

  // SSO / @dakika/auth
  APP_NAME: string;
  PRIVATE_KEY: string;
  NEXT_PUBLIC_OAUTH_URL: string;
  NEXT_PUBLIC_REDIRECT_URL: string;
  OAUTH_USERNAME: string;
  OAUTH_PASSWORD: string;
  ENCRYPTION_KEY: string;
  IV: string;
  SECURE_COOKIE: string;
  NEXT_PUBLIC_SUB_DOMAIN: string;

  // Dakika platform links
  NEXT_PUBLIC_GALLERY_URL: string;
  NEXT_PUBLIC_DAKIKA_URL: string;

  // Backends
  BACKEND_API_URL: string;
  COMMON_BACKEND_API_URL: string;

  /** When `false` (default) every module is allowed without calling the backend. */
  NEXT_PUBLIC_MODULE_PERMISSIONS_ENABLED?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface merging is required here
    interface ProcessEnv extends Env {}
  }
}
