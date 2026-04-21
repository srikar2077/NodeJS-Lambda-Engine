import { Logger } from '@srikar2077/lambda-utils';

import { config } from './config';

/**
 * Initializes and configures the logger instance with application settings.
 */
const _logger = new Logger({
  enabled: config.LOGGING_ENABLED,
  level: config.LOGGING_LEVEL,
  format: config.LOGGING_FORMAT,
});

/**
 * Exports the configured logger instance for use throughout the application.
 * This singleton pattern promotes consistent logging behavior and prevents
 * the creation of multiple logger instances, which can lead to performance issues.
 */
export const logger = _logger.instance;
