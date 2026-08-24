import type { NextRequest } from 'next/server';

import { type ProxyMethod, proxyRequest } from 'src/app/api/_lib/proxy';

interface RouteContext {
  params: { path: string[] };
}

/**
 * Example catch-all proxy: `/api/knowledge/foo/bar` → `${BACKEND_API_URL}/foo/bar`.
 * Copy this folder per backend service when the paths need to diverge.
 */
async function handler(request: NextRequest, { params }: RouteContext) {
  const path = `/${params.path.join('/')}`;
  const search = request.nextUrl.search;
  const method = request.method as ProxyMethod;
  const hasBody = method !== 'GET' && method !== 'DELETE';

  return proxyRequest(path, {
    method,
    search,
    ...(hasBody
      ? {
          body: await request.text(),
          contentType: request.headers.get('content-type') ?? 'application/json'
        }
      : {})
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
