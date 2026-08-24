import type { ProxyMethod } from 'src/app/api/_lib/proxy';

/** Which upstream service serves a knowledge path, and the env var holding its base URL. */
export interface KnowledgeService {
  envName: 'AI_API_URL' | 'BACKEND_API_URL';
  baseUrl: string | undefined;
}

/**
 * Paths served by the AI service instead of the knowledge backend.
 *
 * Only sending a message goes to the AI service — that call runs the retrieval
 * query and produces the answer. Everything else (rating an answer, tags,
 * companies, `/me`, the question list) is plain CRUD on the backend.
 *
 * The table matches METHOD + path, not a path prefix: `POST /questions` (Dasi sends
 * a message) and `GET /questions` (Questions screen lists them) share a path but
 * belong to different services.
 */
const AI_ROUTES: { method: ProxyMethod; path: string }[] = [{ method: 'POST', path: '/questions' }];

export function resolveKnowledgeService(method: ProxyMethod, path: string): KnowledgeService {
  const servedByAi = AI_ROUTES.some(route => route.method === method && route.path === path);

  return servedByAi
    ? { baseUrl: process.env.AI_API_URL, envName: 'AI_API_URL' }
    : { baseUrl: process.env.BACKEND_API_URL, envName: 'BACKEND_API_URL' };
}
