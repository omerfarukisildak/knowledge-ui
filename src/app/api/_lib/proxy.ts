import { NextResponse } from 'next/server';

import { getAccessToken } from './auth';

export type ProxyMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const AUTH_ERROR_MESSAGE =
  'Oturum doğrulanamadı. Lütfen tekrar deneyin; sorun devam ederse çıkış yapıp yeniden giriş yapın.';

const FORWARDED_RESPONSE_HEADERS = ['content-type', 'content-disposition'];

interface ProxyOptions {
  /** Base URL override; defaults to `BACKEND_API_URL`. */
  baseUrl?: string;
  /** Env var name reported when `baseUrl` is missing — the caller picks the service. */
  baseUrlName?: string;
  method?: ProxyMethod;
  /** Raw request body, forwarded as-is (already serialized). */
  body?: BodyInit | null;
  contentType?: string | null;
  search?: string;
  timeoutInSeconds?: number;
}

function truncateLongStrings(obj: any): any {
  if (typeof obj === 'string') {
    if (obj.length > 500) {
      return obj.substring(0, 500) + `... [TRUNCATED, original length: ${obj.length}]`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(truncateLongStrings);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = truncateLongStrings(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

/**
 * Forwards a request to a backend service with the SSO access token attached.
 * The browser never sees the token — it only ever talks to this Next.js route.
 */
export async function proxyRequest(path: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const baseUrl = options.baseUrl ?? process.env.BACKEND_API_URL;

  if (!baseUrl) {
    const name = options.baseUrlName ?? 'BACKEND_API_URL';

    return NextResponse.json({ message: `${name} tanımlı değil.` }, { status: 500 });
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

    // Safe logging wrapper
    try {
      const logRequestAndResponse = async () => {
        console.log(`\n--- [PROXY REQUEST] ${options.method ?? 'GET'} ${path} ---`);
        if (options.body) {
          console.log(`Request Body:`);
          try {
            const parsed = JSON.parse(options.body as string);
            const truncated = truncateLongStrings(parsed);
            console.log(JSON.stringify(truncated, null, 2));
          } catch {
            const bodyStr = options.body as string;
            if (bodyStr.length > 1000) {
              console.log(bodyStr.substring(0, 1000) + `... [TRUNCATED, original length: ${bodyStr.length}]`);
            } else {
              console.log(bodyStr);
            }
          }
        } else {
          console.log(`Request Body: <empty>`);
        }

        const clonedResponse = response.clone();
        let responseBodyText = '';
        try {
          responseBodyText = await clonedResponse.text();
        } catch (e) {
          responseBodyText = `<Error reading response: ${e instanceof Error ? e.message : String(e)}>`;
        }

        console.log(`Response Status: ${response.status}`);
        if (responseBodyText) {
          console.log(`Response Body:`);
          try {
            const parsed = JSON.parse(responseBodyText);
            const truncated = truncateLongStrings(parsed);
            console.log(JSON.stringify(truncated, null, 2));
          } catch {
            if (responseBodyText.length > 1000) {
              console.log(responseBodyText.substring(0, 1000) + `... [TRUNCATED, original length: ${responseBodyText.length}]`);
            } else {
              console.log(responseBodyText);
            }
          }
        } else {
          console.log(`Response Body: <empty>`);
        }
        console.log(`-----------------------------------------\n`);
      };

      // Execute logging safely
      logRequestAndResponse().catch((err) => {
        console.error('[proxyRequest logger error]', err);
      });
    } catch (e) {
      console.error('[proxyRequest logger error]', e);
    }

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
