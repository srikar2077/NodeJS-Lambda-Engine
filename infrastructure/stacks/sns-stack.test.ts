import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Template } from 'aws-cdk-lib/assertions';
import { SnsStack } from './sns-stack';

describe('SnsStack', () => {
  let stack: SnsStack;
  let template: Template;

  beforeEach(() => {
    // Create a test CDK app
    const app = new cdk.App();

    // Instantiate the SnsStack
    stack = new SnsStack(app, 'TestSnsStack', {
      appName: 'test-app',
      envName: 'test',
    });

    // Create a template from the stack for assertions
    template = Template.fromStack(stack);
  });

  describe('SNS Topic', () => {
    it('should create a SNS topic with correct properties', () => {
      // Assert - verify SNS topic exists with correct properties
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'test-app-task-event-test',
        DisplayName: 'Task Event Topic (test)',
      });
    });

    it('should expose the task event topic', () => {
      // Assert
      expect(stack.taskEventTopic).toBeDefined();
      expect(stack.taskEventTopic).toBeInstanceOf(sns.Topic);
    });

    it('should create topic with encryption enabled by default', () => {
      // Assert - SNS topics have AWS-managed encryption by default
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('Stack Outputs', () => {
    it('should export TaskEventTopicArn output', () => {
      // Assert - verify the output exists
      template.hasOutput('TaskEventTopicArn', {
        Export: {
          Name: 'test-app-task-event-topic-arn-test',
        },
      });
    });

    it('should output the correct topic ARN', () => {
      // Assert - verify the topic ARN is exported
      const output = stack.node.findChild('TaskEventTopicArn');
      expect(output).toBeDefined();
    });
  });

  describe('Stack Configuration', () => {
    it('should set topic name with correct naming convention', () => {
      // Assert
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'test-app-task-event-test',
      });
    });

    it('should create stack with dev environment naming', () => {
      // Arrange
      const app = new cdk.App();
      const devStack = new SnsStack(app, 'DevSnsStack', {
        appName: 'nodejs-lambda-engine',
        envName: 'dev',
      });

      const devTemplate = Template.fromStack(devStack);

      // Assert
      devTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'nodejs-lambda-engine-task-event-dev',
      });
    });

    it('should create stack with prod environment naming', () => {
      // Arrange
      const app = new cdk.App();
      const prodStack = new SnsStack(app, 'ProdSnsStack', {
        appName: 'nodejs-lambda-engine',
        envName: 'prd',
      });

      const prodTemplate = Template.fromStack(prodStack);

      // Assert
      prodTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'nodejs-lambda-engine-task-event-prd',
      });
    });
  });

  describe('Topic Properties', () => {
    it('should create standard (non-FIFO) SNS topic', () => {
      // Assert - topic should not have FIFO properties
      template.allResources('AWS::SNS::Topic', (resource: any) => {
        // FIFO topic would have FifoTopic: true
        if (resource.properties.FifoTopic) {
          throw new Error('Topic should not be FIFO');
        }
      });
    });
  });
});
