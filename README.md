# NodeJS Lambda Engine

[![CI](https://github.com/srikar2077/nodejs-lambda-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/srikar2077/nodejs-lambda-engine/actions/workflows/ci.yml)
[![Code Quality](https://github.com/srikar2077/nodejs-lambda-engine/actions/workflows/code-quality.yml/badge.svg)](https://github.com/srikar2077/nodejs-lambda-engine/actions/workflows/code-quality.yml)

## Overview

This project provides a practical foundation for implementing serverless microservice patterns with AWS Lambda, Node.js, and TypeScript. It uses AWS CDK for infrastructure as code, Jest for testing, and modern development tooling.

This project illustrates the **Simple Web Service** pattern, one of the most commonly used serverless microservice designs. If you need a different pattern, see the **Serverless Microservice Patterns** section below.

## Features

### Core Features

- **Complete REST API** - A fully functional RESTful API for task management with handlers for create, read, update, and delete operations
- **AWS Lambda Integration** - Native AWS Lambda handlers with full API Gateway integration for HTTP request/response processing
- **Request Validation** - Type-safe request validation using Zod schemas to ensure data integrity and type safety
- **Error Handling** - Comprehensive error handling with meaningful error responses and logging at all layers
- **CORS Support** - Built-in Cross-Origin Resource Sharing (CORS) configuration for cross-domain requests
- **Request Tracking** - Automatic request ID tracking through the entire request lifecycle for debugging and monitoring

### Configuration Management

- **Environment-Based Configuration** - Flexible environment variable management supporting dev, qat, and prd environments
- **Zod Schema Validation** - Configuration validation at runtime using Zod schemas to catch configuration errors early
- **Flexible Endpoint Configuration** - Support for both AWS and LocalStack endpoints with automatic switching based on configuration
- **Logging Configuration** - Configurable logging levels, formats (text/JSON), and runtime toggles for flexible operational control

### Persistence

- **DynamoDB Integration** - AWS DynamoDB client for scalable, serverless NoSQL data storage
- **Document Model Support** - High-level document client for simplified working with complex data structures
- **Composite Primary Keys** - Efficient data organization using partition keys and sort keys for flexible querying
- **Item Versioning** - Automatic timestamp tracking (createdAt, updatedAt) for audit trails and data synchronization
- **Type-Safe Models** - TypeScript interfaces and Zod schemas for data models ensuring compile-time and runtime type safety

### Logging

- **Pino Logger** - Log4j-style logging with Pino for high-performance, low-overhead structured logging
- **Lambda-Aware Logging** - Pino Lambda plugin integration for optimized CloudWatch log formatting in Lambda environments
- **Configurable Log Levels** - Support for debug, info, warn, and error logging levels with runtime control
- **JSON and Text Formats** - Structured JSON logging for production analysis or human-readable text format for development
- **Request Context Tracking** - Automatic inclusion of request IDs and context in all log entries for request tracing

### Pub/Sub

- **Event-Driven Architecture** - SNS topic integration for event publishing when tasks are created, updated, or deleted
- **Asynchronous Communication** - Decoupled microservice communication through SNS topics without direct service dependencies
- **AWS SNS Client** - Fully configured SNS client with support for message publishing and topic management
- **CloudWatch Integration** - SNS events automatically captured in CloudWatch for monitoring and debugging

### Code Quality & Testing

- **Jest Unit Testing** - Comprehensive unit test coverage with Jest across handlers, services, models, and utilities
- **Test File Organization** - Co-located test files using `.test.ts` suffix for maintainability and ease of navigation
- **100% Test Coverage** - Code coverage analysis and reporting to ensure comprehensive testing
- **Mocked Dependencies** - All external dependencies (AWS SDK, services) are mocked in tests for isolation
- **ESLint Configuration** - Consistent code style enforcement with ESLint for maintainability and best practices
- **Prettier Formatting** - Automatic code formatting with Prettier for consistent code style across the project
- **Watch Mode Testing** - Jest watch mode support for continuous testing during development

### DevOps + Infrastructure

- **Infrastructure as Code (IaC)** - AWS CDK stack definitions for reproducible, version-controlled infrastructure deployment
- **Automated Testing in CI/CD** - GitHub Actions workflows that run unit tests, linting, and code formatting checks on every push
- **LocalStack Development Environment** - Local AWS service emulation for development and testing without consuming AWS resources or incurring costs
- **LocalStack Docker Compose** - Pre-configured Docker Compose setup for easily spinning up a complete local development environment with DynamoDB, SNS, and other AWS services
- **Infrastructure Documentation** - Detailed guides explaining CDK stacks, resource configuration, and deployment processes
- **DevOps Best Practices** - Complete DevOps guides covering CI/CD pipeline setup, deployment procedures, and operational considerations

### Documentation

- **Comprehensive README** - Clear project overview, setup instructions, and feature documentation
- **Inline Code Comments** - JSDoc comments on functions and modules for code clarity and IDE support
- **Configuration Guide** - Detailed documentation on configuring the application for different environments
- **DevOps Guide** - CI/CD pipeline setup and deployment procedures using GitHub Actions
- **Project Structure Documentation** - Detailed explanation of directory organization and architectural patterns

## Getting started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Node Version Manager (NVM)](https://github.com/nvm-sh/nvm)** - Manages Node.js versions
- **Node.js** - JavaScript runtime (install via NVM)
- **npm** - Package manager (comes with Node.js)
- **AWS CLI** - For AWS credentials and configuration (recommended)

#### Setting up Node.js with NVM

This project uses the Node.js version specified in `.nvmrc`. See the [official nvm guide](https://github.com/nvm-sh/nvm) for additional information.

```bash
# Install NVM (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Install and use the correct Node.js version
nvm install
nvm use

# Verify installation
node --version  # Should output same version as in .nvmrc
```

#### Installing Dependencies

```bash
# Install project dependencies
npm install
```

## Project structure

This is a high-level overview of the project structure. This structure separates the infrastructure as code from the Lambda application code. Within the Lambda microservice component, directories provide structure to implement DRY (Don't Repeat Yourself) code which follows the SRP (Single Responsibility Principle).

```
/docs                           # Project documentation

/infrastructure                 # AWS CDK infrastructure code
  /stacks                       # CDK stack definitions
  /utils                        # CDK utilities and helpers
  app.ts                        # CDK app entry point
  cdk.json                      # CDK configuration
  jest.config.ts                # Infrastructure Jest configuration
  package.json                  # Infrastructure dependencies and scripts
  tsconfig.json                 # Infrastructure TypeScript configuration
  .env.example                  # Infrastructure example .env

/src                            # Application source code
  /handlers                     # Lambda function handlers
  /models                       # Data models and types
  /services                     # Business logic services
  /utils                        # Utility functions and helpers

eslint.config.mjs               # ESLint configuration
jest.config.ts                  # Jest testing configuration
package.json                    # Project dependencies and scripts
tsconfig.json                   # TypeScript configuration
.nvmrc                          # Node.js version specification
.prettierrc                     # Prettier formatting configuration
.editorconfig                   # Editor configuration
```

## How to use

### Commands and scripts

#### Development Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Clean generated files and directories
npm run clean
```

#### Code Quality Commands

```bash
# Format code with Prettier
npm run format

# Check code formatting without making changes
npm run format:check

# Lint code with ESLint
npm run lint

# Lint and auto-fix issues
npm run lint:fix
```

#### Testing Commands

```bash
# Run tests without coverage
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (reruns on file changes)
npm run test:watch
```

### LocalStack Support

This project includes full support for [LocalStack](https://localstack.cloud/), allowing you to run and test the microservice locally without deploying to AWS. See the [LocalStack Guide](docs/LocalStackGuide.md) for details.

## Technology Stack

- **Language:** TypeScript
- **Platform:** AWS Lambda
- **Runtime:** Node.js 24+ (see .nvmrc)
- **Package Manager:** npm
- **AWS SDK:** v3
- **Testing:** Jest
- **Linting/Formatting:** ESLint + Prettier
- **Validation:** Zod
- **Logging:** Pino + Pino Lambda
- **Infrastructure:** AWS CDK
- **DevOps:** GitHub Actions

## Key Dependencies

### Runtime Dependencies

- **[@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb)** - AWS SDK v3 DynamoDB client
- **[@aws-sdk/client-sns](https://www.npmjs.com/package/@aws-sdk/client-sns)** - AWS SDK v3 SNS client
- **[@aws-sdk/lib-dynamodb](https://www.npmjs.com/package/@aws-sdk/lib-dynamodb)** - DynamoDB document client utilities
- **[zod](https://www.npmjs.com/package/zod)** - TypeScript-first schema validation
- **[pino](https://getpino.io/)** - Low overhead, fast logger for JavaScript

### Development Dependencies

- **[@types/aws-lambda](https://www.npmjs.com/package/@types/aws-lambda)** - TypeScript definitions for AWS Lambda
- **[jest](https://www.npmjs.com/package/jest)** - Testing framework
- **[eslint](https://www.npmjs.com/package/eslint)** - Linting utility
- **[prettier](https://www.npmjs.com/package/prettier)** - Code formatter

## Environments

The project supports multiple environments:

- **dev** - Development environment
- **qat** - Quality Assurance/Testing environment
- **prd** - Production environment

Each environment has its own AWS account and configuration.

## Lambda Utils Project

The `@srikar2077/lambda-utils` package is a TypeScript utility library for AWS Lambda functions. It provides pre-configured logging, API response formatting, configuration validation, and AWS SDK clients—reducing boilerplate and promoting best practices within Node.js Lambda functions.

NodeJS Lambda Engine uses several utilities from Lambda Utils. You can use the package directly, or fork/copy only the utilities you want to maintain in your own codebase.

Learn more about Lambda Utils:

- **[@srikar2077/lambda-utils package on NPM](https://www.npmjs.com/package/@srikar2077/lambda-utils)**
- **[lambda-utils repository on GitHub](https://github.com/srikar2077/lambda-utils)**

## Serverless Microservice Patterns

This project implements the **Simple Web Service** serverless microservice pattern. The [Serverless Microservice Patterns repository](https://github.com/srikar2077/serverless-microservice-patterns) provides a suite of additional patterns and examples such as:

- **Gatekeeper**: Adds an Auth microservice to authenticate and authorize API requests.
- **Internal API**: Facilitates synchronous, internal microservice-to-microservice integration without API Gateway exposure.
- **Internal Handoff**: Enables asynchronous microservice-to-microservice communication.
- **Publish Subscribe**: Demonstrates event-driven architecture using SNS topics and SQS queues for loose coupling.
- **Queue-Based Load Leveling**: Uses a message queue as a buffer to decouple producers from consumers and smooth demand spikes.
- **Fan Out**: Breaks a large workload into a collection of smaller tasks. This is particularly useful for batch processing.
- **Fan Out / Fan In**: Breaks a large workload into a collection of smaller tasks with progress tracking and results aggregation. This is particularly useful for batch processing.

Each pattern is implemented as a standalone project with practical examples and reference implementations for building scalable, event-driven microservices on AWS.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Further Reading

- [**Lambda Utils Project**](https://github.com/srikar2077/lambda-utils)
- [**Project Documentation**](./docs/README.md)
