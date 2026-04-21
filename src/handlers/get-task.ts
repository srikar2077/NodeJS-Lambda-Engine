import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, notFound, ok, withRequestTracking } from '@srikar2077/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { getTask } from '@/services/task-service';
import { logger } from '@/utils/logger';

/**
 * Lambda handler for retrieving a task by ID
 * Handles GET requests from API Gateway to retrieve a specific task from DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with task or error message
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  withRequestTracking(event, context);
  logger.info({ event, context }, '[GetTaskHandler] > handler');

  try {
    // Parse and validate the taskId from path parameters
    const taskId = event.pathParameters?.taskId;

    if (!taskId) {
      logger.warn('[GetTaskHandler] < handler - missing taskId path parameter');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Retrieve the task
    const task = await getTask(taskId);

    // Check if the task was found
    if (!task) {
      logger.info({ taskId }, '[GetTaskHandler] < handler - task not found');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Return ok response with the task
    logger.info({ taskId }, '[GetTaskHandler] < handler - successfully retrieved task');
    return ok(task, defaultResponseHeaders);
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[GetTaskHandler] < handler - failed to get task');
    return internalServerError('Failed to retrieve task', defaultResponseHeaders);
  }
};
