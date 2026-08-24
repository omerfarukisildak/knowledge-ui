import { logger } from 'src/utils/default-logger';

export async function GET(request: Request) {
  logger.debug(request);
  return new Response('ok', {
    status: 200
  });
}
