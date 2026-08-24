import { NextResponse } from 'next/server';

import { getAccessToken } from './auth';

export type ProxyMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const AUTH_ERROR_MESSAGE =
  'Oturum doğrulanamadı. Lütfen tekrar deneyin; sorun devam ederse çıkış yapıp yeniden giriş yapın.';

const FORWARDED_RESPONSE_HEADERS = ['content-type', 'content-disposition'];

interface ProxyOptions {
  /** Base URL override; defaults to `BACKEND_API_URL`. */
  baseUrl?: string;
  method?: ProxyMethod;
  /** Raw request body, forwarded as-is (already serialized). */
  body?: BodyInit | null;
  contentType?: string | null;
  search?: string;
  timeoutInSeconds?: number;
}

/**
 * Forwards a request to a backend service with the SSO access token attached.
 * The browser never sees the token — it only ever talks to this Next.js route.
 */
export async function proxyRequest(path: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const baseUrl = options.baseUrl ?? process.env.BACKEND_API_URL;

  if (!baseUrl) {
    return NextResponse.json({ message: 'BACKEND_API_URL tanımlı değil.' }, { status: 500 });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: AUTH_ERROR_MESSAGE }, { status: 401 });
  }

  const url = `${baseUrl}${path}${options.search ?? ''}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (options.timeoutInSeconds ?? 30) * 1000);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.contentType ? { 'Content-Type': options.contentType } : {})
      },
      ...(options.body ? { body: options.body } : {})
    });

    const headers = new Headers();
    for (const header of FORWARDED_RESPONSE_HEADERS) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(response.body, { status: response.status, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('[proxyRequest] failed', { url, message });

    return NextResponse.json({ message: 'Backend bağlantısı kurulamadı.', details: message }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
