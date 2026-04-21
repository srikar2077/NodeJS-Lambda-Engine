# LocalStack Guide

This guide explains how to use LocalStack for local development and testing of the NodeJS Lambda Engine microservice.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

LocalStack is a cloud service emulator that runs AWS services locally on your machine. This allows you to:

- Develop and test AWS applications locally without incurring AWS costs
- Test infrastructure changes before deploying to AWS
- Run integration tests in CI/CD pipelines
- Work offline without AWS credentials

The NodeJS Lambda Engine project is configured to support LocalStack for the following AWS services:

- **DynamoDB** - Task data storage
- **SNS** - Event publishing
- **Lambda** - Serverless function execution
- **API Gateway** - REST API endpoints
- **CloudWatch Logs** - Application logging
- **IAM** - Permissions and roles
- **CloudFormation** - Infrastructure provisioning via AWS CDK

## Prerequisites

Before using LocalStack with this project, ensure you have the following installed:

1. **Docker** - LocalStack runs in a Docker container

   ```bash
   docker --version
   ```

2. **Docker Compose** - For managing the LocalStack container

   ```bash
   docker-compose --version
   ```

3. **LocalStack Auth Token** (required)

   Starting with LocalStack 2026.03, an Auth Token is required to activate LocalStack for AWS. You can get a free Auth Token by:
   - Signing up for a free account at [LocalStack Web Application](https://app.localstack.cloud/sign-up)
   - Obtaining your Auth Token from the [Auth Tokens page](https://app.localstack.cloud/workspace/auth-tokens)
   - Setting the `LOCALSTACK_AUTH_TOKEN` environment variable in your shell or `.env` file

   For more information, see the [LocalStack Auth Token Documentation](https://docs.localstack.cloud/aws/getting-started/auth-token/).

4. **LocalStack CLI** (optional but recommended)

   See the [LocalStack Getting Started Guide](https://docs.localstack.cloud/aws/getting-started/) for installation instructions.

   ```bash
   localstack --version
   ```

5. **AWS CLI** (optional, for manual testing)

   ```bash
   aws --version
   ```

6. **Node.js 24+** and **npm**
   ```bash
   node --version
   npm --version
   ```

## Quick Start

Follow these steps to get the Task microservice running locally with LocalStack:

### 1. Set the LocalStack Auth Token

Before starting LocalStack, set your Auth Token in your environment:

```bash
export LOCALSTACK_AUTH_TOKEN=your-auth-token-here
```

Replace `your-auth-token-here` with your actual Auth Token from the [LocalStack Web Application](https://app.localstack.cloud/workspace/auth-tokens).

Alternatively, you can add this to your shell profile (`.bashrc`, `.zshrc`, etc.) or create a `.env.local` file in the project root:

```bash
echo "export LOCALSTACK_AUTH_TOKEN=your-auth-token-here" >> ~/.bashrc
source ~/.bashrc
```

### 2. Start LocalStack

From the project root directory:

```bash
docker-compose up -d
```

This starts the LocalStack container in detached mode. Verify it's running:

```bash
docker-compose ps
```

View LocalStack logs:

```bash
docker-compose logs -f localstack
```

### 3. Install Dependencies

Install CDK infrastructure dependencies:

```bash
cd infrastructure
npm install
```

### 4. Configure Environment

Copy the LocalStack environment configuration:

```bash
cp .env.example .env
```

The `.env.example` file describes all available AWS CDK infrastructure configuration options. Review the `.env` file and ensure these LocalStack variables are configured.

> **NOTE:** The hostname for the LocalStack endpoint must be the name of the LocalStack service in Docker Compose.

```properties
### LocalStack Configuration ###
## Enable LocalStack for local development (default: false)
CDK_USE_LOCALSTACK=true
## LocalStack endpoint URL (default: http://localstack:4566)
CDK_LOCALSTACK_ENDPOINT=http://localstack:4566
```

### 5. Build the Infrastructure

Compile the CDK TypeScript code:

```bash
npm run build
```

### 6. Bootstrap CDK (First Time Only)

Bootstrap the CDK environment in LocalStack:

```bash
npm run local:bootstrap
```

This creates the necessary S3 buckets and resources for CDK deployments.

### 7. Deploy to LocalStack

Deploy all stacks to LocalStack:

```bash
npm run local:deploy
```

This deploys:

- Data stack (DynamoDB tables)
- SNS stack (SNS topics)
- Lambda stack (Lambda functions and API Gateway)

The deployment typically takes 2-5 minutes.

### 8. Get the API Endpoint

After deployment, the CloudFormation outputs will show the API Gateway endpoint:

```
Outputs:
nodejs-lambda-engine-lambda-stack-local.LambdaStarterApiEndpoint = http://localhost:4566/restapis/{api-id}/local/_user_request_
```

You can also retrieve it using:

```bash
aws --endpoint-url=http://localhost:4566 cloudformation describe-stacks \
  --stack-name nodejs-lambda-engine-lambda-local \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaStarterApiEndpoint`].OutputValue' \
  --output text
```

### 9. Test the API

Test the API using curl or your favorite HTTP client:

```bash
# Create a task
curl -X POST http://localhost:4566/restapis/{api-id}/local/_user_request_/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Testing LocalStack"}'

# List all tasks
curl http://localhost:4566/restapis/{api-id}/local/_user_request_/tasks

# Get a specific task
curl http://localhost:4566/restapis/{api-id}/local/_user_request_/tasks/{task-id}
```

Replace `{api-id}` and `{task-id}` with actual values from your deployment.

## Configuration

### Environment Variables

The LocalStack configuration is managed through environment variables in the `infrastructure/.env` file.

#### CDK Configuration Variables

| Variable                  | Description             | Default                  | LocalStack Value         |
| ------------------------- | ----------------------- | ------------------------ | ------------------------ |
| `CDK_ENV`                 | Environment name        | `dev`                    | `local`                  |
| `CDK_USE_LOCALSTACK`      | Enable LocalStack mode  | `false`                  | `true`                   |
| `CDK_LOCALSTACK_ENDPOINT` | LocalStack endpoint URL | `http://localstack:4566` | `http://localstack:4566` |
| `CDK_REGION`              | AWS region              | `us-east-1`              | `us-east-1`              |
| `CDK_APP_LOGGING_LEVEL`   | Application log level   | `info`                   | `debug`                  |
| `CDK_APP_LOGGING_FORMAT`  | Log format (text/json)  | `json`                   | `text`                   |

#### Application Runtime Variables

The Lambda functions automatically receive these environment variables when `CDK_USE_LOCALSTACK=true`:

| Variable               | Description                             | Example Value                                                        |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `USE_LOCALSTACK`       | Enable LocalStack in application code   | `true`                                                               |
| `LOCALSTACK_ENDPOINT`  | LocalStack endpoint for AWS SDK clients | `http://localstack:4566`                                             |
| `TASKS_TABLE`          | DynamoDB table name                     | `nodejs-lambda-engine-task-local`                                          |
| `TASK_EVENT_TOPIC_ARN` | SNS topic ARN                           | `arn:aws:sns:us-east-1:000000000000:nodejs-lambda-engine-task-event-local` |

### Docker Compose Configuration

The `docker-compose.yml` file in the project root configures the LocalStack container:

```yaml
services:
  localstack:
    container_name: '${LOCALSTACK_DOCKER_NAME:-localstack-main}'
    image: localstack/localstack:2026.03
    ports:
      - '4566:4566'
    environment:
      # LocalStack configuration
      - SERVICES=s3,dynamodb,sns,lambda,apigateway,logs,iam,sts,cloudformation,ssm
      # LocalStack Auth Token (required as of 2026.03)
      - LOCALSTACK_AUTH_TOKEN=${LOCALSTACK_AUTH_TOKEN:?}
      # Enable debug mode (optional - set to 1 to enable)
      - DEBUG=${DEBUG:-0}
      # Enable persistence (optional - comment out to disable)
      - PERSISTENCE=${PERSISTENCE:-0}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./localstack-data:/var/lib/localstack
```

Key points:

- **LOCALSTACK_AUTH_TOKEN** - Required environment variable. Must be set before starting the container.
- **SERVICES** - Specifies which AWS services to emulate. Adjust as needed for your project.
- **DEBUG** - Optional flag for debug mode (set to 1 to enable verbose logging).
- **PERSISTENCE** - Optional flag to persist data between container restarts.

You can customize the `PERSISTENCE` setting by uncommenting or adding it to enable data persistence:

```bash
export PERSISTENCE=1
docker-compose up -d
```

## Usage

### Managing LocalStack

**Start LocalStack:**

```bash
# From project root
docker-compose up -d

# Or from infrastructure directory
npm run local:start
```

**Stop LocalStack:**

```bash
# From project root
docker-compose down

# Or from infrastructure directory
npm run local:stop
```

**View LocalStack logs:**

```bash
# From project root
docker-compose logs -f localstack

# Or from infrastructure directory
npm run local:logs
```

**Restart LocalStack:**

```bash
docker-compose restart
```

### Infrastructure Operations

All infrastructure operations from the `infrastructure/` directory:

**Deploy all stacks:**

```bash
npm run local:deploy
```

**Synthesize CloudFormation templates:**

```bash
npm run local:synth
```

**View differences before deploying:**

```bash
npm run local:diff
```

**Destroy all stacks:**

```bash
npm run local:destroy
```

**Bootstrap CDK (first time only):**

```bash
npm run local:bootstrap
```

### AWS CLI with LocalStack

When using the AWS CLI with LocalStack, always specify the endpoint URL:

```bash
# List DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Scan tasks table
aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name nodejs-lambda-engine-task-local

# List SNS topics
aws --endpoint-url=http://localhost:4566 sns list-topics

# List Lambda functions
aws --endpoint-url=http://localhost:4566 lambda list-functions

# Invoke a Lambda function directly
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name nodejs-lambda-engine-list-tasks-local \
  --payload '{}' \
  response.json
```

**Tip:** Create an alias for convenience:

```bash
alias awslocal="aws --endpoint-url=http://localhost:4566"
```

Then use:

```bash
awslocal dynamodb list-tables
```

## Testing

### Integration Testing

LocalStack is ideal for running integration tests:

1. **Start LocalStack** before running tests
2. **Deploy infrastructure** to LocalStack
3. **Run tests** against LocalStack endpoints
4. **Tear down** after tests complete

Example test script:

```bash
#!/bin/bash
set -e

# Start LocalStack
docker-compose up -d
sleep 10  # Wait for LocalStack to be ready

# Deploy infrastructure
cd infrastructure
npm run build
npm run local:bootstrap
npm run local:deploy

# Run tests
cd ..
npm test

# Cleanup
cd infrastructure
npm run local:destroy
docker-compose down
```

### Manual Testing

Use tools like curl, Postman, or Thunder Client (VS Code extension) to test endpoints:

```bash
# Set the API endpoint (replace with your actual endpoint)
API_ENDPOINT="http://localhost:4566/restapis/abc123/local/_user_request_"

# Create a task
curl -X POST $API_ENDPOINT/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive LocalStack guide",
    "completed": false
  }'

# List tasks
curl $API_ENDPOINT/tasks | jq

# Get a task by ID
TASK_ID="550e8400-e29b-41d4-a716-446655440000"
curl $API_ENDPOINT/tasks/$TASK_ID | jq

# Update a task
curl -X PUT $API_ENDPOINT/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive LocalStack guide",
    "completed": true
  }'

# Delete a task
curl -X DELETE $API_ENDPOINT/tasks/$TASK_ID
```

## Troubleshooting

### LocalStack Container Issues

**Container won't start:**

Check Docker daemon is running:

```bash
docker ps
```

Check for port conflicts:

```bash
lsof -i :4566
```

View container logs:

```bash
docker-compose logs localstack
```

**Container keeps restarting:**

Check available disk space and memory. LocalStack requires at least:

- 2 GB RAM
- 5 GB disk space

**Missing Auth Token error:**

If you see an error like "License activation failed", ensure your `LOCALSTACK_AUTH_TOKEN` environment variable is set:

```bash
export LOCALSTACK_AUTH_TOKEN=your-auth-token
docker-compose up -d
```

Verify the token is correctly set:

```bash
echo $LOCALSTACK_AUTH_TOKEN
```

**Invalid Auth Token error:**

If you receive an "invalid credentials" error:

1. Verify your Auth Token is correct - check it on the [Auth Tokens page](https://app.localstack.cloud/workspace/auth-tokens)
2. Ensure you have an active license assigned to your account
3. Rotate your Auth Token if you suspect it may have been compromised

For more troubleshooting steps, see the [LocalStack Auth Token Troubleshooting Guide](https://docs.localstack.cloud/aws/getting-started/auth-token/#troubleshooting)

### Deployment Issues

**CDK bootstrap fails:**

Ensure LocalStack is running and healthy:

```bash
curl http://localhost:4566/_localstack/health | jq
```

**CDK deploy hangs:**

Check LocalStack logs for errors:

```bash
npm run local:logs
```

Verify AWS SDK can reach LocalStack:

```bash
aws --endpoint-url=http://localhost:4566 sts get-caller-identity
```

**Lambda functions fail to invoke:**

Ensure Docker socket is mounted (required for Lambda execution):

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

Check Lambda function logs:

```bash
aws --endpoint-url=http://localhost:4566 logs describe-log-groups
aws --endpoint-url=http://localhost:4566 logs tail /aws/lambda/nodejs-lambda-engine-list-tasks-local
```

### Application Issues

**DynamoDB connection errors:**

Verify the table exists:

```bash
aws --endpoint-url=http://localhost:4566 dynamodb describe-table \
  --table-name nodejs-lambda-engine-task-local
```

Check environment variables in Lambda function:

```bash
aws --endpoint-url=http://localhost:4566 lambda get-function-configuration \
  --function-name nodejs-lambda-engine-list-tasks-local \
  --query 'Environment.Variables'
```

**SNS publish failures:**

Verify the topic exists:

```bash
aws --endpoint-url=http://localhost:4566 sns list-topics
```

### Clean State

To start with a clean LocalStack environment:

```bash
# Stop and remove containers
docker-compose down

# Remove persisted data (if persistence is enabled)
rm -rf localstack-data

# Start fresh
docker-compose up -d
```

## Best Practices

### Development Workflow

1. **Keep LocalStack running** during active development
2. **Use text logging** format for easier debugging (`CDK_APP_LOGGING_FORMAT=text`)
3. **Set debug log level** for detailed diagnostics (`CDK_APP_LOGGING_LEVEL=debug`)
4. **Test changes locally** before deploying to AWS
5. **Version control** your `.env.local` file as a template

### Performance Optimization

1. **Enable persistence** to avoid redeploying after LocalStack restarts:

   ```yaml
   environment:
     - PERSISTENCE=1
   ```

2. **Use specific services** to reduce startup time:

   ```yaml
   environment:
     - SERVICES=dynamodb,sns,lambda,apigateway
   ```

3. **Allocate sufficient resources** to Docker
   - Minimum: 2 GB RAM, 2 CPU cores
   - Recommended: 4 GB RAM, 4 CPU cores

### Testing Strategy

1. **Unit tests** - Mock AWS services (no LocalStack needed)
2. **Integration tests** - Use LocalStack for AWS service integration
3. **E2E tests** - Test complete workflows against LocalStack
4. **Pre-deployment validation** - Deploy to LocalStack before AWS

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: LocalStack Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Start LocalStack
        env:
          LOCALSTACK_AUTH_TOKEN: ${{ secrets.LOCALSTACK_AUTH_TOKEN }}
        run: docker-compose up -d

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: 'npm'

      - name: Install dependencies
        run: npm install
        working-directory: ./infrastructure

      - name: Deploy to LocalStack
        run: |
          npm run build
          npm run local:bootstrap
          npm run local:deploy
        working-directory: ./infrastructure

      - name: Run tests
        run: npm test

      - name: Cleanup
        if: always()
        run: docker-compose down
```

**Important:** Store your `LOCALSTACK_AUTH_TOKEN` as a GitHub repository secret (`secrets.LOCALSTACK_AUTH_TOKEN`). Never commit your Auth Token to version control.

### Cost Savings

Using LocalStack for development and testing can significantly reduce AWS costs:

- **Development:** No charges for local testing
- **CI/CD:** Run hundreds of test pipelines without AWS costs
- **Learning:** Experiment freely without worrying about bills
- **Staging:** Reduce staging environment costs by testing locally first

### Security Considerations

1. **Protect your Auth Token** - It provides access to your LocalStack workspace and license
   - Never commit the `LOCALSTACK_AUTH_TOKEN` to source control
   - Use environment variables or a `.env.local` file (not committed to version control)
   - If accidentally exposed, immediately rotate it on the [Auth Tokens page](https://app.localstack.cloud/workspace/auth-tokens)

2. **Secure the `.env` file**
   - Add `.env.local` to `.gitignore` to prevent accidental commits
   - Never commit files containing real AWS credentials or Auth Tokens

3. **Network Security**
   - Don't expose LocalStack port (4566) to the internet
   - Use it only for local development

4. **Keep LocalStack Updated**
   - Regularly update to the latest version for security patches:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Differences from AWS

Be aware of LocalStack limitations compared to real AWS:

1. **Performance** - LocalStack is slower than AWS
2. **Features** - Some AWS features may not be fully implemented
3. **Behavior** - Minor differences in API responses or timing
4. **Scaling** - Cannot test auto-scaling or global services
5. **Quotas** - No service quotas or throttling

Always perform final validation in a real AWS environment before production deployment.

## Further Reading

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS CDK with LocalStack](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/)
- [AWS CLI with LocalStack](https://docs.localstack.cloud/user-guide/integrations/aws-cli/)
- [LocalStack GitHub Repository](https://github.com/localstack/localstack)
- [LocalStack Community](https://localstack.cloud/community/)

---

For more information about this project, see the main [README](../README.md) or visit the [documentation](./README.md).
