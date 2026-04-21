import { initializeDynamoDBClients, getDynamoDBClient, getDynamoDBDocumentClient } from '@srikar2077/lambda-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { config } from './config';
import { logger } from './logger';

/**
 * DynamoDB client configuration
 */
const dynamoDbClientConfig = {
  region: config.AWS_REGION,
  ...(config.USE_LOCALSTACK && {
    endpoint: config.LOCALSTACK_ENDPOINT,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
};

/**
 * Configuration for marshalling JavaScript objects into DynamoDB items
 */
const marshallConfig = {
  convertEmptyValues: false,
  convertClassInstanceToMap: true,
  removeUndefinedValues: true,
};

/**
 * Configuration for unmarshalling DynamoDB items into JavaScript objects
 */
const unmarshallConfig = {
  wrapNumbers: false,
};

/**
 * Initialize the DynamoDB clients with the microservice configuration.
 */
initializeDynamoDBClients(dynamoDbClientConfig, marshallConfig, unmarshallConfig);

/**
 * Singleton DynamoDB client configured with the application's region
 */
export const dynamoClient: DynamoDBClient = getDynamoDBClient();

/**
 * Singleton DynamoDB Document client for easier interaction with DynamoDB
 */
export const dynamoDocClient: DynamoDBDocumentClient = getDynamoDBDocumentClient();

logger.info(
  { dynamoDbClientConfig, marshallConfig, unmarshallConfig },
  '[DynamoDBClient] - Initialized AWS DynamoDB client',
);
