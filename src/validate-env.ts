/**
 * Required at build/runtime — must stay in sync with non-optional keys in {@link ../env.d.ts}.
 */
const requiredEnvVars = [
  'APP_NAME',
  'PRIVATE_KEY',
  'NEXT_PUBLIC_OAUTH_URL',
  'NEXT_PUBLIC_REDIRECT_URL',
  'NEXT_PUBLIC_GALLERY_URL',
  'NEXT_PUBLIC_DAKIKA_URL',
  'NEXT_PUBLIC_SUB_DOMAIN',
  'OAUTH_USERNAME',
  'OAUTH_PASSWORD',
  'ENCRYPTION_KEY',
  'IV',
  'SECURE_COOKIE',
  'BACKEND_API_URL'
] as const;

function isUnset(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

const missingEnvVars = requiredEnvVars.filter(varName => isUnset(process.env[varName]));

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export {};
