import { config } from 'src/config';
import { createLogger } from 'src/utils/logger';

export const logger = createLogger({ level: config.logLevel });
