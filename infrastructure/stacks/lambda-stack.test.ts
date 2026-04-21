import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import { LambdaStack } from './lambda-stack';

// Mock NodejsFunction to avoid Docker bundling during tests
jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-lambda-nodejs');
  const lambda = jest.requireActual('aws-cdk-lib/aws-lambda');
  return {
    ...actual,
    NodejsFunction: class extends lambda.Function {
      constructor(scope: any, id: string, props: any) {
        // Use inline code instead of bundling for tests
        super(scope, id, {
          ...props,
          code: lambda.Code.fromInline('exports.handler = async () => {}'),
        });
      }
    },
  };
});

describe('LambdaStack', () => {
  describe('dev environment', () => {
    let template: Template;

    beforeAll(() => {
      const testApp = new cdk.App();
      const mockTestStack = new cdk.Stack(testApp, 'MockStack');
      const testMockTable = new dynamodb.Table(mockTestStack, 'MockTaskTable', {
        tableName: 'mock-task-table',
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
      });
      const testMockTopic = new sns.Topic(mockTestStack, 'MockTaskEventTopic', {
        topicName: 'mock-task-event-dev',
      });

      const stack = new LambdaStack(testApp, 'TestLambdaStack', {
        appName: 'nodejs-lambda-engine',
        envName: 'dev',
        taskTable: testMockTable,
        taskEventTopic: testMockTopic,
        loggingEnabled: true,
        loggingLevel: 'debug',
        loggingFormat: 'json',
        corsAllowOrigin: '*',
        useLocalStack: false,
        localStackEndpoint: 'http://localhost:4566',
      });
      template = Template.fromStack(stack);
    });

    it('should create a list tasks Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'nodejs-lambda-engine-list-tasks-dev',
        Runtime: 'nodejs24.x',
        Handler: 'handler',
        Timeout: 10,
        MemorySize: 256,
      });
    });

    it('should create a get task Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'nodejs-lambda-engine-get-task-dev',
        Runtime: 'nodejs24.x',
        Handler: 'handler',
        Timeout: 10,
        MemorySize: 256,
      });
    });

    it('should create a create task Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'nodejs-lambda-engine-create-task-dev',
        Runtime: 'nodejs24.x',
        Handler: 'handler',
        Timeout: 10,
        MemorySize: 256,
      });
    });

    it('should create an update task Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'nodejs-lambda-engine-update-task-dev',
        Runtime: 'nodejs24.x',
        Handler: 'handler',
        Timeout: 10,
        MemorySize: 256,
      });
    });

    it('should create a delete task Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'nodejs-lambda-engine-delete-task-dev',
        Runtime: 'nodejs24.x',
        Handler: 'handler',
        Timeout: 10,
        MemorySize: 256,
      });
    });

    it('should configure Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TASKS_TABLE: Match.anyValue(),
            TASK_EVENT_TOPIC_ARN: Match.anyValue(),
            LOGGING_ENABLED: 'true',
            LOGGING_LEVEL: 'debug',
            LOGGING_FORMAT: 'json',
            CORS_ALLOW_ORIGIN: '*',
          },
        },
      });
    });

    it('should create an API Gateway REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'nodejs-lambda-engine-api-dev',
        Description: 'NodeJS Lambda Engine API for dev environment',
      });
    });

    it('should create a /tasks resource', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 2);
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'tasks',
      });
    });

    it('should create a /tasks/{taskId} resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{taskId}',
      });
    });

    it('should create a GET method on /tasks', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });

    it('should create a POST method on /tasks', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });

    it('should create a PUT method on /tasks/{taskId}', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
      });
    });

    it('should create a DELETE method on /tasks/{taskId}', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
      });
    });

    it('should integrate API Gateway with Lambda', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    it('should configure API Gateway deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
      });
    });

    it('should configure API Gateway throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            ThrottlingRateLimit: 100,
            ThrottlingBurstLimit: 200,
          },
        ],
      });
    });

    it('should grant Lambda read access to DynamoDB', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:DescribeTable',
              ]),
            }),
          ]),
        },
      });
    });

    it('should grant Lambda write access to DynamoDB', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ],
            }),
          ]),
        },
      });
    });

    it('should grant Lambda SNS publish permissions for create function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });

    it('should grant Lambda SNS publish permissions for update function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });

    it('should grant Lambda SNS publish permissions for delete function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });

    it('should export API URL', () => {
      template.hasOutput('ApiUrl', {
        Export: {
          Name: 'nodejs-lambda-engine-tasks-api-url-dev',
        },
      });
    });

    it('should export API ID', () => {
      template.hasOutput('ApiId', {
        Export: {
          Name: 'nodejs-lambda-engine-tasks-api-id-dev',
        },
      });
    });

    it('should export Lambda function ARN', () => {
      template.hasOutput('ListTasksFunctionArn', {
        Export: {
          Name: 'nodejs-lambda-engine-list-tasks-function-arn-dev',
        },
      });
    });

    it('should export create task function ARN', () => {
      template.hasOutput('CreateTaskFunctionArn', {
        Export: {
          Name: 'nodejs-lambda-engine-create-task-function-arn-dev',
        },
      });
    });

    it('should export get task function ARN', () => {
      template.hasOutput('GetTaskFunctionArn', {
        Export: {
          Name: 'nodejs-lambda-engine-get-task-function-arn-dev',
        },
      });
    });

    it('should export update task function ARN', () => {
      template.hasOutput('UpdateTaskFunctionArn', {
        Export: {
          Name: 'nodejs-lambda-engine-update-task-function-arn-dev',
        },
      });
    });

    it('should export delete task function ARN', () => {
      template.hasOutput('DeleteTaskFunctionArn', {
        Export: {
          Name: 'nodejs-lambda-engine-delete-task-function-arn-dev',
        },
      });
    });

    it('should grant Lambda read-write access to DynamoDB for update function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('prd environment', () => {
    let template: Template;

    beforeAll(() => {
      const testApp = new cdk.App();
      const mockTestStack = new cdk.Stack(testApp, 'MockStack');
      const testMockTable = new dynamodb.Table(mockTestStack, 'MockTaskTable', {
        tableName: 'mock-task-table',
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
      });
      const testMockTopic = new sns.Topic(mockTestStack, 'MockTaskEventTopic', {
        topicName: 'mock-task-event-prd',
      });

      const stack = new LambdaStack(testApp, 'TestLambdaStack', {
        appName: 'nodejs-lambda-engine',
        envName: 'prd',
        taskTable: testMockTable,
        taskEventTopic: testMockTopic,
        loggingEnabled: true,
        loggingLevel: 'info',
        loggingFormat: 'json',
        corsAllowOrigin: '*',
        useLocalStack: false,
        localStackEndpoint: 'http://localhost:4566',
      });
      template = Template.fromStack(stack);
    });

    it('should create Lambda with prd naming', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'nodejs-lambda-engine-list-tasks-prd',
      });
    });

    it('should configure info log level for prd', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            LOGGING_LEVEL: 'info',
          },
        },
      });
    });

    it('should create API Gateway with prd naming', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'nodejs-lambda-engine-api-prd',
        Description: 'NodeJS Lambda Engine API for prd environment',
      });
    });

    it('should deploy to prd stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prd',
      });
    });
  });

  describe('CORS configuration', () => {
    let template: Template;

    beforeAll(() => {
      const testApp = new cdk.App();
      const mockTestStack = new cdk.Stack(testApp, 'MockStack');
      const testMockTable = new dynamodb.Table(mockTestStack, 'MockTaskTable', {
        tableName: 'mock-task-table',
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
      });
      const testMockTopic = new sns.Topic(mockTestStack, 'MockTaskEventTopic', {
        topicName: 'mock-task-event-dev',
      });

      const stack = new LambdaStack(testApp, 'TestLambdaStack', {
        appName: 'nodejs-lambda-engine',
        envName: 'dev',
        taskTable: testMockTable,
        taskEventTopic: testMockTopic,
        loggingEnabled: true,
        loggingLevel: 'debug',
        loggingFormat: 'json',
        corsAllowOrigin: '*',
        useLocalStack: false,
        localStackEndpoint: 'http://localhost:4566',
      });
      template = Template.fromStack(stack);
    });

    it('should configure CORS preflight for OPTIONS method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    it('should include CORS headers in OPTIONS response', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          IntegrationResponses: [
            {
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods': Match.anyValue(),
                'method.response.header.Access-Control-Allow-Origin': Match.anyValue(),
              },
            },
          ],
        },
      });
    });
  });

  describe('LocalStack configuration', () => {
    describe('when LocalStack is enabled', () => {
      let template: Template;

      beforeAll(() => {
        const testApp = new cdk.App();
        const mockTestStack = new cdk.Stack(testApp, 'MockStack');
        const testMockTable = new dynamodb.Table(mockTestStack, 'MockTaskTable', {
          tableName: 'mock-task-table',
          partitionKey: {
            name: 'id',
            type: dynamodb.AttributeType.STRING,
          },
        });
        const testMockTopic = new sns.Topic(mockTestStack, 'MockTaskEventTopic', {
          topicName: 'mock-task-event-local',
        });

        const stack = new LambdaStack(testApp, 'TestLambdaStack', {
          appName: 'nodejs-lambda-engine',
          envName: 'local',
          taskTable: testMockTable,
          taskEventTopic: testMockTopic,
          loggingEnabled: true,
          loggingLevel: 'debug',
          loggingFormat: 'json',
          corsAllowOrigin: '*',
          useLocalStack: true,
          localStackEndpoint: 'http://localhost:4566',
        });
        template = Template.fromStack(stack);
      });

      it('should include USE_LOCALSTACK environment variable', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              USE_LOCALSTACK: 'true',
            },
          },
        });
      });

      it('should include LOCALSTACK_ENDPOINT environment variable', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              LOCALSTACK_ENDPOINT: 'http://localhost:4566',
            },
          },
        });
      });

      it('should include all standard environment variables with LocalStack config', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              TASKS_TABLE: Match.anyValue(),
              TASK_EVENT_TOPIC_ARN: Match.anyValue(),
              LOGGING_ENABLED: 'true',
              LOGGING_LEVEL: 'debug',
              LOGGING_FORMAT: 'json',
              CORS_ALLOW_ORIGIN: '*',
              USE_LOCALSTACK: 'true',
              LOCALSTACK_ENDPOINT: 'http://localhost:4566',
            },
          },
        });
      });

      it('should create Lambda functions with local naming', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: 'nodejs-lambda-engine-list-tasks-local',
        });
      });

      it('should create API Gateway with local naming', () => {
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: 'nodejs-lambda-engine-api-local',
        });
      });
    });

    describe('when LocalStack is disabled', () => {
      let template: Template;

      beforeAll(() => {
        const testApp = new cdk.App();
        const mockTestStack = new cdk.Stack(testApp, 'MockStack');
        const testMockTable = new dynamodb.Table(mockTestStack, 'MockTaskTable', {
          tableName: 'mock-task-table',
          partitionKey: {
            name: 'id',
            type: dynamodb.AttributeType.STRING,
          },
        });
        const testMockTopic = new sns.Topic(mockTestStack, 'MockTaskEventTopic', {
          topicName: 'mock-task-event-dev',
        });

        const stack = new LambdaStack(testApp, 'TestLambdaStack', {
          appName: 'nodejs-lambda-engine',
          envName: 'dev',
          taskTable: testMockTable,
          taskEventTopic: testMockTopic,
          loggingEnabled: true,
          loggingLevel: 'debug',
          loggingFormat: 'json',
          corsAllowOrigin: '*',
          useLocalStack: false,
          localStackEndpoint: 'http://localhost:4566',
        });
        template = Template.fromStack(stack);
      });

      it('should not include USE_LOCALSTACK environment variable', () => {
        // Verify that environment variables do NOT contain LocalStack config
        const resources = template.findResources('AWS::Lambda::Function');
        Object.values(resources).forEach((resource: any) => {
          const vars = resource.Properties.Environment.Variables;
          expect(vars.USE_LOCALSTACK).toBeUndefined();
        });
      });

      it('should not include LOCALSTACK_ENDPOINT environment variable', () => {
        // Verify that environment variables do NOT contain LocalStack config
        const resources = template.findResources('AWS::Lambda::Function');
        Object.values(resources).forEach((resource: any) => {
          const vars = resource.Properties.Environment.Variables;
          expect(vars.LOCALSTACK_ENDPOINT).toBeUndefined();
        });
      });

      it('should include standard environment variables without LocalStack config', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: Match.objectLike({
              TASKS_TABLE: Match.anyValue(),
              TASK_EVENT_TOPIC_ARN: Match.anyValue(),
              LOGGING_ENABLED: 'true',
              LOGGING_LEVEL: 'debug',
              LOGGING_FORMAT: 'json',
              CORS_ALLOW_ORIGIN: '*',
            }),
          },
        });
      });
    });
  });
});
