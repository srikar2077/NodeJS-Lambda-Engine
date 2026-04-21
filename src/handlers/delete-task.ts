import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, noContent, notFound, withRequestTracking } from '@srikar2077/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { deleteTask } from '@/services/task-service';
import { logger } from '@/utils/logger';

/**
 * Lambda handler for deleting a task by ID
 * Handles DELETE requests from API Gateway to delete a specific task from DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with 204 status on success or error message
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  withRequestTracking(event, context);
  logger.info({ event, context }, '[DeleteTaskHandler] > handler');

  try {
    // Parse and validate the taskId from path parameters
    const taskId = event.pathParameters?.taskId;

    if (!taskId) {
      logger.warn('[DeleteTaskHandler] < handler - missing taskId path parameter');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Delete the task
    const deleted = await deleteTask(taskId);

    // Check if the task was found and deleted
    if (!deleted) {
      logger.info({ taskId }, '[DeleteTaskHandler] < handler - task not found');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Return no content response
    logger.info({ taskId }, '[DeleteTaskHandler] < handler - successfully deleted task');
    return noContent(defaultResponseHeaders);
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[DeleteTaskHandler] < handler - failed to delete task');
    return internalServerError('Failed to delete task', defaultResponseHeaders);
  }
};
