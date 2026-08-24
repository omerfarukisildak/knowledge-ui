'use server';

import DakikaAuth from '@dakika/auth';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { getDakikaAuthConfig } from './get-dakika-auth-config';

const dakikaAuth = new DakikaAuth(getDakikaAuthConfig());
const SLOW_REQUEST_THRESHOLD_MS = 1000;
const AUTH_SESSION_RETRY_COUNT = 2;
const AUTH_SESSION_RETRY_DELAY_MS = 250;

async function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function checkAndRefreshTokenWithRetry() {
  for (let attempt = 0; attempt <= AUTH_SESSION_RETRY_COUNT; attempt += 1) {
    try {
      const session = await dakikaAuth.checkAndRefreshToken();
      if (session.active && session.accessToken) {
        return session;
      }
    } catch {
      // Retry transient auth read/refresh failures.
    }

    if (attempt < AUTH_SESSION_RETRY_COUNT) {
      await wait(AUTH_SESSION_RETRY_DELAY_MS);
    }
  }

  return { active: false, accessToken: null };
}

const authorizedRequest = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload: unknown | null,
  useCommonBackend: boolean = false,
  timeoutInSeconds: number = 15,
  responseType?: AxiosRequestConfig['responseType']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ data?: any; logout?: boolean }> => {
  const baseUrl = useCommonBackend ? process.env.COMMON_BACKEND_API_URL : process.env.BACKEND_API_URL;

  try {
    const startTime = Date.now();
    const { active, accessToken } = await checkAndRefreshTokenWithRetry();
    if (!active) {
      return { logout: true };
    }
    const { data } = await axios({
      method,
      url: `${baseUrl}${path}`,
      data: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      timeout: timeoutInSeconds * 1000,
      responseType
    } as AxiosRequestConfig);
    const durationMs = Date.now() - startTime;
    if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
      console.warn('[authorizedRequest] slow request', {
        method,
        path,
        url: `${baseUrl}${path}`,
        durationMs
      });
    }

    return { data };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const error = e as AxiosError;
      console.error('[authorizedRequest] request failed', {
        method,
        path,
        url: `${baseUrl}${path}`,
        timeoutMs: timeoutInSeconds * 1000,
        code: error.code,
        status: error.response?.status,
        message: error.message
      });
    }
    if (e.response?.status === 401) {
      return { logout: true };
    }
    throw e;
  }
};

export default authorizedRequest;
