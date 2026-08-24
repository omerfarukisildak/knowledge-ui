import DakikaAuth from '@dakika/auth';

import { getDakikaAuthConfig } from 'src/utils/get-dakika-auth-config';

const dakikaAuth = new DakikaAuth(getDakikaAuthConfig());
const AUTH_SESSION_RETRY_COUNT = 2;
const AUTH_SESSION_RETRY_DELAY_MS = 250;

async function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function checkAndRefreshTokenWithRetry() {
  let lastSession: Awaited<ReturnType<typeof dakikaAuth.checkAndRefreshToken>> | null = null;

  for (let attempt = 0; attempt <= AUTH_SESSION_RETRY_COUNT; attempt += 1) {
    try {
      const session = await dakikaAuth.checkAndRefreshToken();
      lastSession = session;

      if (session.active && session.accessToken) {
        return session;
      }
    } catch {
      lastSession = null;
    }

    if (attempt < AUTH_SESSION_RETRY_COUNT) {
      await wait(AUTH_SESSION_RETRY_DELAY_MS);
    }
  }

  return lastSession;
}

/** Access token for route handlers; clears the cookie when the session is gone. */
export async function getAccessToken(): Promise<string | null> {
  const session = await checkAndRefreshTokenWithRetry();

  if (!session?.active || !session.accessToken) {
    await dakikaAuth.clearTokenCookie();
    return null;
  }

  return session.accessToken;
}

export async function getSession(): Promise<{ accessToken: string; employeeId: string | null } | null> {
  const session = await checkAndRefreshTokenWithRetry();

  if (!session?.active || !session.accessToken) {
    await dakikaAuth.clearTokenCookie();
    return null;
  }

  return {
    accessToken: session.accessToken,
    employeeId: session.employeeId ? String(session.employeeId) : null
  };
}
