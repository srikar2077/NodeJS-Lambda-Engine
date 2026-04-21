import { httpHeaders, Headers } from '@srikar2077/lambda-utils';

import { config } from './config';

/**
 * Default API response headers.
 * Includes Content-Type and CORS headers.
 */
export const defaultResponseHeaders: Headers = { ...httpHeaders.json, ...httpHeaders.cors(config.CORS_ALLOW_ORIGIN) };
