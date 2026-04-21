import { randomUUID } from 'crypto';
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { CreateTaskDto } from '@/models/create-task-dto.js';
import { UpdateTaskDto } from '@/models/update-task-dto.js';
import { Task, TaskItem, TaskKeys, toTask } from '@/models/task.js';
import { config } from '@/utils/config.js';
import { logger } from '@/utils/logger';
import { dynamoDocClient } from '@/utils/dynamodb-client.js';
import { publishToTopic } from '@/utils/sns-client.js';

/**
 * Retrieves all tasks from the DynamoDB table
 * @returns Promise that resolves to an array of Task objects
 * @throws Error if the DynamoDB scan operation fails
 */
export const listTasks = async (): Promise<Task[]> => {
  logger.info('[TaskService] > listTasks');

  try {
    // Use ScanCommand to retrieve all items from the tasks table
    const command = new ScanCommand({
      TableName: config.TASKS_TABLE,
    });
    logger.debug({ input: command.input }, '[TaskService] listTasks - ScanCommandInput');

    // Execute the scan command
    const response = await dynamoDocClient.send(command);

    // Map the retrieved items to Task objects
    const taskItems = (response.Items as TaskItem[]) ?? [];
    const tasks = taskItems.map(toTask);

    logger.info(
      {
        count: tasks.length,
        scannedCount: response.ScannedCount,
      },
      '[TaskService] < listTasks - successfully retrieved tasks',
    );

    return tasks;
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[TaskService] < listTasks - failed to fetch tasks from DynamoDB');
    throw error;
  }
};

/**
 * Retrieves a task by ID from the DynamoDB table
 * @param id - The unique identifier of the task
 * @returns Promise that resolves to the Task object if found, or null if not found
 * @throws Error if the DynamoDB get operation fails
 */
export const getTask = async (id: string): Promise<Task | null> => {
  logger.info({ id }, '[TaskService] > getTask');

  try {
    // Use GetCommand to retrieve the task by its primary key
    const command = new GetCommand({
      TableName: config.TASKS_TABLE,
      Key: {
        pk: TaskKeys.pk(id),
      },
    });
    logger.debug({ input: command.input }, '[TaskService] getTask - GetCommandInput');

    // Execute the get command
    const response = await dynamoDocClient.send(command);

    // Check if the task was found
    if (!response.Item) {
      logger.info({ id }, '[TaskService] < getTask - task not found');
      return null;
    }

    // Map the retrieved item to a Task object
    const task = toTask(response.Item as TaskItem);

    logger.info({ id }, '[TaskService] < getTask - successfully retrieved task');

    return task;
  } catch (error) {
    // Handle unexpected errors
    logger.error({ id, error }, '[TaskService] < getTask - failed to fetch task from DynamoDB');
    throw error;
  }
};

/**
 * Creates a new task in the DynamoDB table
 * @param createTaskDto - The data for the new task
 * @returns Promise that resolves to the created Task object
 * @throws Error if the DynamoDB put operation fails
 */
export const createTask = async (createTaskDto: CreateTaskDto): Promise<Task> => {
  logger.info('[TaskService] > createTask');

  try {
    // Prepare the task item to be inserted
    const id = randomUUID();
    const now = new Date().toISOString();

    const taskItem: TaskItem = {
      pk: TaskKeys.pk(id),
      id,
      title: createTaskDto.title,
      ...(createTaskDto.detail && { detail: createTaskDto.detail }),
      ...(createTaskDto.dueAt && { dueAt: createTaskDto.dueAt }),
      isComplete: createTaskDto.isComplete ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: config.TASKS_TABLE,
      Item: taskItem,
    });
    logger.debug({ input: command.input }, '[TaskService] createTask - PutCommandInput');

    // Execute the put command to create the task
    await dynamoDocClient.send(command);

    // Map the created item to a Task object
    const task = toTask(taskItem);
    logger.debug({ task }, '[TaskService] - createTask - put Task in DynamoDB');

    // Publish task creation event to SNS
    const messageId = await publishToTopic(
      config.TASK_EVENT_TOPIC_ARN,
      {
        task,
      },
      {
        event: {
          DataType: 'String',
          StringValue: 'TaskCreated',
        },
      },
    );
    logger.debug(
      { taskId: task.id, topicArn: config.TASK_EVENT_TOPIC_ARN, messageId },
      '[TaskService] createTask - published TaskCreated event to SNS',
    );

    // Return the created task
    logger.info({ id: task.id }, '[TaskService] < createTask - successfully created task');
    return task;
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[TaskService] < createTask - failed to create task in DynamoDB');
    throw error;
  }
};

/**
 * Updates an existing task in the DynamoDB table
 * @param id - The unique identifier of the task to update
 * @param updateTaskDto - The data to update the task with
 * @returns Promise that resolves to the updated Task object if found, or null if not found
 * @throws Error if the DynamoDB update operation fails
 */
export const updateTask = async (id: string, updateTaskDto: UpdateTaskDto): Promise<Task | null> => {
  logger.info({ id }, '[TaskService] > updateTask');

  try {
    // Fetch existing task to ensure it exists
    const existingTask = await getTask(id);
    if (!existingTask) {
      logger.info({ id }, '[TaskService] < updateTask - task not found');
      return null;
    }

    // Prepare the task item to be updated
    const now = new Date().toISOString();

    // Build update expression dynamically
    const setExpressions: string[] = ['title = :title', 'isComplete = :isComplete', 'updatedAt = :updatedAt'];
    const removeExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {
      ':title': updateTaskDto.title,
      ':isComplete': updateTaskDto.isComplete,
      ':updatedAt': now,
    };

    // Handle optional detail field
    if (updateTaskDto.detail !== undefined) {
      setExpressions.push('detail = :detail');
      expressionAttributeValues[':detail'] = updateTaskDto.detail;
    } else {
      // Remove detail if not present in request
      removeExpressions.push('detail');
    }

    // Handle optional dueAt field
    if (updateTaskDto.dueAt !== undefined) {
      setExpressions.push('dueAt = :dueAt');
      expressionAttributeValues[':dueAt'] = updateTaskDto.dueAt;
    } else {
      // Remove dueAt if not present in request
      removeExpressions.push('dueAt');
    }

    // Construct the update expression with proper syntax
    const updateExpressionParts: string[] = [];
    if (setExpressions.length > 0) {
      updateExpressionParts.push(`SET ${setExpressions.join(', ')}`);
    }
    if (removeExpressions.length > 0) {
      updateExpressionParts.push(`REMOVE ${removeExpressions.join(', ')}`);
    }
    const updateExpression = updateExpressionParts.join(' ');

    const command = new UpdateCommand({
      TableName: config.TASKS_TABLE,
      Key: {
        pk: TaskKeys.pk(id),
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_NEW',
    });
    logger.debug({ input: command.input }, '[TaskService] updateTask -  UpdateCommandInput');

    // Execute the update command
    const response = await dynamoDocClient.send(command);

    // Check if the task was found
    if (!response.Attributes) {
      logger.info({ id }, '[TaskService] < updateTask - task not found');
      return null;
    }

    // Map the updated item to a Task object
    const task = toTask(response.Attributes as TaskItem);
    logger.info({ task }, '[TaskService] - updateTask - successfully updated task');

    // Publish task update event to SNS
    const messageId = await publishToTopic(
      config.TASK_EVENT_TOPIC_ARN,
      {
        oldTask: existingTask,
        newTask: task,
      },
      {
        event: {
          DataType: 'String',
          StringValue: 'TaskUpdated',
        },
      },
    );
    logger.debug(
      { taskId: id, topicArn: config.TASK_EVENT_TOPIC_ARN, messageId },
      '[TaskService] updateTask - published TaskUpdated event to SNS',
    );

    // Return the updated task
    logger.info({ id }, '[TaskService] < updateTask - successfully updated task');
    return task;
  } catch (error) {
    // Handle conditional check failures (task not found)
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      logger.info({ id }, '[TaskService] < updateTask - task not found');
      return null;
    }

    // Handle unexpected errors
    logger.error({ error }, '[TaskService] < updateTask - failed to update task in DynamoDB');
    throw error;
  }
};

/**
 * Deletes a task from the DynamoDB table
 * @param id - The unique identifier of the task to delete
 * @returns Promise that resolves to true if the task was deleted, or false if not found
 * @throws Error if the DynamoDB delete operation fails
 */
export const deleteTask = async (id: string): Promise<boolean> => {
  logger.info({ id }, '[TaskService] > deleteTask');

  try {
    // Use DeleteCommand to delete the task by its primary key
    const command = new DeleteCommand({
      TableName: config.TASKS_TABLE,
      Key: {
        pk: TaskKeys.pk(id),
      },
      ConditionExpression: 'attribute_exists(pk)',
    });
    logger.debug({ input: command.input }, '[TaskService] deleteTask - DeleteCommandInput');

    // Execute the delete command
    await dynamoDocClient.send(command);
    logger.info({ id }, '[TaskService] - deleteTask - deleted Task from DynamoDB');

    // Publish task deletion event to SNS
    const messageId = await publishToTopic(
      config.TASK_EVENT_TOPIC_ARN,
      {
        taskId: id,
      },
      {
        event: {
          DataType: 'String',
          StringValue: 'TaskDeleted',
        },
      },
    );
    logger.debug(
      { taskId: id, topicArn: config.TASK_EVENT_TOPIC_ARN, messageId },
      '[TaskService] deleteTask - published TaskDeleted event to SNS',
    );

    // Return true indicating successful deletion
    logger.info({ id }, '[TaskService] < deleteTask - successfully deleted task');
    return true;
  } catch (error) {
    // Handle conditional check failures (task not found)
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      logger.info({ id }, '[TaskService] < deleteTask - task not found');
      return false;
    }

    // Handle unexpected errors
    logger.error({ error }, '[TaskService] < deleteTask - failed to delete task from DynamoDB');
    throw error;
  }
};
