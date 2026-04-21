import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ZodError } from 'zod';
import { badRequest, internalServerError, notFound, ok, withRequestTracking } from '@srikar2077/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { UpdateTaskDtoSchema } from '@/models/update-task-dto';
import { updateTask } from '@/services/task-service';
import { logger } from '@/utils/logger';

/**
 * Lambda handler for updating an existing task
 * Handles PUT requests from API Gateway to update a task in DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with updated task or error message
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  withRequestTracking(event, context);
  logger.info({ event, context }, '[UpdateTaskHandler] > handler');

  try {
    // Parse and validate the taskId from path parameters
    const taskId = event.pathParameters?.taskId;
    if (!taskId) {
      logger.warn('[UpdateTaskHandler] < handler - missing taskId');
      return badRequest('Task ID is required', defaultResponseHeaders);
    }

    // Parse and validate request body
    if (!event.body) {
      logger.warn('[UpdateTaskHandler] < handler - missing request body');
      return badRequest('Request body is required', defaultResponseHeaders);
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(event.body);
    } catch (_error) {
      logger.warn('[UpdateTaskHandler] < handler - invalid JSON in request body');
      return badRequest('Invalid JSON in request body', defaultResponseHeaders);
    }

    // Validate request body against schema
    const validatedDto = UpdateTaskDtoSchema.parse(requestBody);

    // Update the task
    const task = await updateTask(taskId, validatedDto);

    // Check if the task was found
    if (!task) {
      logger.info({ taskId }, '[UpdateTaskHandler] < handler - task not found');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Return ok response with the updated task
    logger.info({ id: task.id }, '[UpdateTaskHandler] < handler - successfully updated task');
    return ok(task, defaultResponseHeaders);
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      logger.warn({ issues: error.issues }, '[UpdateTaskHandler] < handler - validation error');
      return badRequest(`Validation failed: ${errorMessages}`, defaultResponseHeaders);
    }

    // Handle other unexpected errors
    logger.error({ error }, '[UpdateTaskHandler] < handler - failed to update task');
    return internalServerError('Failed to update task', defaultResponseHeaders);
  }
};
