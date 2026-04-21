import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ZodError } from 'zod';
import { badRequest, created, internalServerError, withRequestTracking } from '@srikar2077/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { CreateTaskDtoSchema } from '@/models/create-task-dto';
import { createTask } from '@/services/task-service';
import { logger } from '@/utils/logger';

/**
 * Lambda handler for creating a new task
 * Handles POST requests from API Gateway to create a task in DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with created task or error message
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  withRequestTracking(event, context);
  logger.info({ event, context }, '[CreateTaskHandler] > handler');

  try {
    // Parse and validate request body
    if (!event.body) {
      logger.warn('[CreateTaskHandler] < handler - missing request body');
      return badRequest('Request body is required', defaultResponseHeaders);
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(event.body);
    } catch (_error) {
      logger.warn('[CreateTaskHandler] < handler - invalid JSON in request body');
      return badRequest('Invalid JSON in request body', defaultResponseHeaders);
    }

    // Validate request body against schema
    const validatedDto = CreateTaskDtoSchema.parse(requestBody);

    // Create the task
    const task = await createTask(validatedDto);

    logger.info(
      {
        id: task.id,
      },
      '[CreateTaskHandler] < handler - successfully created task',
    );
    // Return created response with the new task
    return created(task, defaultResponseHeaders);
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      const errorMessages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      logger.warn(
        {
          errors: error.issues,
        },
        '[CreateTaskHandler] < handler - validation error',
      );
      return badRequest(`Validation failed: ${errorMessages}`, defaultResponseHeaders);
    }

    // Handle other errors
    logger.error({ error }, '[CreateTaskHandler] < handler - failed to create task');
    return internalServerError('Failed to create task', defaultResponseHeaders);
  }
};
