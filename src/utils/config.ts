import { z } from 'zod';
import { createConfigManager } from '@srikar2077/lambda-utils';

/**
 * Schema for validating environment variables
 */
const envSchema = z.object({
  // Required variables
  TASKS_TABLE: z.string().min(1, 'TASKS_TABLE environment variable is required'),
  TASK_EVENT_TOPIC_ARN: z.string().min(1, 'TASK_EVENT_TOPIC_ARN environment variable is required'),

  // Optional variables with defaults
  AWS_REGION: z.string().default('us-east-1'),

  // LocalStack configuration (optional)
  USE_LOCALSTACK: z
    .enum(['true', 'false'] as const)
    .default('false')
    .transform((val) => val === 'true'),
  LOCALSTACK_ENDPOINT: z.string().default('http://localstack:4566'),

  // Logging configuration
  LOGGING_ENABLED: z
    .enum(['true', 'false'] as const)
    .default('true')
    .transform((val) => val === 'true'),
  LOGGING_LEVEL: z.enum(['debug', 'info', 'warn', 'error'] as const).default('debug'),
  LOGGING_FORMAT: z.enum(['text', 'json'] as const).default('json'),

  // CORS configuration
  CORS_ALLOW_ORIGIN: z.string().default('*'),

  // Add more environment variables as needed
});

/**
 * Type representing our validated config
 */
export type Config = z.infer<typeof envSchema>;

/**
 * The configuration manager responsible for validating and providing access to a singleton
 * instance of the application's configuration
 */
const configManager = createConfigManager(envSchema);

/**
 * Validated configuration object
 * Access environment variables through this object instead of process.env directly
 */
export const config = configManager.get();

/**
 * Refreshes the configuration by re-validating environment variables
 * Useful in tests when environment variables are changed
 */
export const refresh = configManager.refresh;
