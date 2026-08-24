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
  /** Knowledge AI service — serves the Dasi message endpoint (`POST /sorular`). */
  AI_API_URL: string;

  /** When `false` (default) every module is allowed without calling the backend. */
  NEXT_PUBLIC_MODULE_PERMISSIONS_ENABLED?: string;

  /** `api` routes every knowledge call to the backend; anything else keeps the mock adapter. */
  NEXT_PUBLIC_KNOWLEDGE_DATA_SOURCE?: string;
  /**
   * Comma-separated service-layer function names that should hit the real backend
   * while the rest stay on mock data — e.g. `getTags,getCompanies`. Used while the
   * backend delivers endpoints one at a time. See `src/modules/knowledge/api/index.ts`.
   */
  NEXT_PUBLIC_KNOWLEDGE_LIVE_ENDPOINTS?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface merging is required here
    interface ProcessEnv extends Env {}
  }
}
