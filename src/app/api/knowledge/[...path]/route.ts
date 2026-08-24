import type { NextRequest } from 'next/server';

import { getSession } from 'src/app/api/_lib/auth';
import { type ProxyMethod, proxyRequest } from 'src/app/api/_lib/proxy';

import { resolveKnowledgeService } from './service-routing';

interface RouteContext {
  params: { path: string[] };
}

/**
 * Paths whose write body gets the caller's employee id filled in.
 *
 * The service does NOT derive `createdBy` / `updatedBy` from the Bearer token:
 * verified 2026-08-24 — `POST /knowledge/labels` without the field returns
 * `createdBy: null`, while rows created elsewhere carry a real id. Rather than
 * shipping the employee id to the browser so it can put it in the body, it is
 * added here: the identity stays server-side and a client cannot write a record
 * under someone else's id.
 *
 * `/questions` is deliberately absent — that body is handled by the AI service
 * and carries extra identity fields (`createdByName`); it joins the list when
 * its contract is verified.
 */
const IDENTITY_PATHS = [/^\/knowledge\/labels(\/\d+)?$/, /^\/knowledge\/documents(\/\d+)?$/];

/**
 * Adds `createdBy` (POST) or `updatedBy` (PUT/PATCH) to a JSON write body.
 *
 * Anything unexpected — a non-JSON body, a non-object payload, a field the
 * caller already set, a session without an employee id — is forwarded
 * untouched. This must never be the reason a request fails.
 */
async function withIdentity(method: ProxyMethod, path: string, raw: string): Promise<string> {
  if (!IDENTITY_PATHS.some(pattern => pattern.test(path))) {
    return raw;
  }

  const field = method === 'POST' ? 'createdBy' : 'updatedBy';

  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body) || field in body) {
      return raw;
    }

    const session = await getSession();
    const employeeId = Number(session?.employeeId);
    if (!Number.isInteger(employeeId)) {
      return raw;
    }

    return JSON.stringify({ ...body, [field]: employeeId });
  } catch {
    return raw;
  }
}

/**
 * Catch-all proxy for the knowledge module. The upstream is picked per route:
 * `POST /questions` (sending a message) goes to `AI_API_URL`, everything else to
 * `BACKEND_API_URL`. See `service-routing.ts` for the table.
 *
 * `/api/knowledge/questions` → `${AI_API_URL}/questions` (POST) or `${BACKEND_API_URL}/questions` (GET)
 */
async function handler(request: NextRequest, { params }: RouteContext) {
  const path = `/${params.path.join('/')}`;
  const search = request.nextUrl.search;
  const method = request.method as ProxyMethod;
  const hasBody = method !== 'GET' && method !== 'DELETE';
  const service = resolveKnowledgeService(method, path);

  return proxyRequest(path, {
    baseUrl: service.baseUrl,
    baseUrlName: service.envName,
    method,
    search,
    ...(hasBody
      ? {
          body: await withIdentity(method, path, await request.text()),
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
