import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

/**
 * Properties for the SnsStack.
 */
export interface SnsStackProps extends cdk.StackProps {
  /**
   * Application name.
   */
  appName: string;

  /**
   * Environment name (dev, qat, prd).
   */
  envName: string;
}

/**
 * CDK Stack for SNS topics and messaging resources.
 */
export class SnsStack extends cdk.Stack {
  /**
   * The Task Event SNS topic.
   */
  public readonly taskEventTopic: sns.ITopic;

  constructor(scope: Construct, id: string, props: SnsStackProps) {
    super(scope, id, props);

    // Create Task Event Topic
    this.taskEventTopic = new sns.Topic(this, 'TaskEventTopic', {
      topicName: `${props.appName}-task-event-${props.envName}`,
      displayName: `Task Event Topic (${props.envName})`,
      fifo: false,
    });

    // Output the topic ARN
    new cdk.CfnOutput(this, 'TaskEventTopicArn', {
      value: this.taskEventTopic.topicArn,
      description: 'The ARN of the Task Event SNS topic',
      exportName: `${props.appName}-task-event-topic-arn-${props.envName}`,
    });
  }
}
