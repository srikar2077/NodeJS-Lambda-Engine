# DevOps Guide

## Overview

This guide documents the DevOps automation for the project, focusing on the use of GitHub Actions for CI/CD and operational workflows. It is intended for software engineers and DevOps engineers responsible for maintaining and deploying the project to AWS.

---

## GitHub Actions Workflows

The project uses GitHub Actions to automate the following tasks:

- **Continuous Integration (CI):**
  - Linting, building, and testing the application and infrastructure code on every push and pull request.
- **Continuous Deployment (CD):**
  - Automated deployment to AWS for specific branches or tags (e.g., `main`, `prd`).
- **Code Quality Gates:**
  - Enforces code formatting, linting, and test coverage thresholds before merging.
- **Release Automation:**
  - Optionally, creates releases and tags for production deployments.

---

## Workflow Summary

The project utilizes the following workflows.

| Workflow Name          | Purpose                       | Triggers                               |
| ---------------------- | ----------------------------- | -------------------------------------- |
| Continuous Integration | Lint, build, test             | pull_request, manual                   |
| Deploy to DEV          | Deploy to DEV environment     | manual                                 |
| Teardown DEV           | Destroy infrastructure in DEV | manual                                 |
| Code Quality           | Generate code quality reports | push to main branch, scheduled, manual |

---

## Deployment Workflows

The project includes deployment workflows that use GitHub Actions to deploy the application and infrastructure to AWS. These workflows use a reusable workflow pattern to maintain consistency across environments. Deployments require proper AWS credentials and environment variables to be configured.

### Deploy (Reusable)

**Workflow:** `deploy-reusable.yml`

A reusable workflow that provides the foundational deployment logic. This workflow is called by environment-specific deployment workflows and accepts the following inputs:

- `aws_role_arn` (required): AWS IAM role ARN for credential assumption
- `aws_region` (optional): AWS region (defaults to `us-east-1`)
- `cdk_env` (required): CDK environment variables containing stack configuration

**Process:**

1. Checks out the repository
2. Sets up Node.js environment
3. Configures AWS credentials via OIDC role assumption
4. Installs and builds application code
5. Runs all application tests
6. Installs infrastructure dependencies
7. Creates `.env` file with CDK configuration
8. Builds infrastructure code
9. Bootstraps CDK (if needed)
10. Synthesizes CDK stacks
11. Deploys all CDK stacks using `npm run deploy:all -- --require-approval never --progress events`
12. Cleans up sensitive files (`.env`, `cdk.out`)

### Deploy to DEV

**Workflow:** `deploy-dev.yml`

Environment-specific workflow that triggers the reusable deployment workflow for the DEV environment.

**Process:**

- Calls the reusable `deploy-reusable.yml` workflow
- Passes DEV-specific configuration:
  - `AWS_ROLE_ARN_DEV` as the AWS role ARN
  - `AWS_REGION` as the AWS region
  - `CDK_ENV_DEV` as the CDK environment variables

**Concurrency:** Only one DEV deployment can run at a time; subsequent requests will cancel the in-progress workflow.

**Trigger:** Manual (`workflow_dispatch`)

---

## Teardown Workflows

The project includes teardown (destroy) workflows for removing provisioned infrastructure from specific environments. These workflows use a reusable workflow pattern to maintain consistency across environments.

### Teardown (Reusable)

**Workflow:** `teardown-reusable.yml`

A reusable workflow that provides the foundational teardown logic. This workflow is called by environment-specific teardown workflows and accepts the following inputs:

- `aws_role_arn` (required): AWS IAM role ARN for credential assumption
- `aws_region` (optional): AWS region (defaults to `us-east-1`)
- `cdk_env` (required): CDK environment variables containing stack configuration

**Process:**

1. Checks out the repository
2. Sets up Node.js environment
3. Configures AWS credentials via OIDC role assumption
4. Installs infrastructure dependencies
5. Creates `.env` file with CDK configuration
6. Destroys all CDK stacks using `npm run destroy:all -- --force --progress events`
7. Cleans up sensitive files (`.env`, `cdk.out`)

### Teardown DEV

**Workflow:** `teardown-dev.yml`

Environment-specific workflow that triggers the reusable teardown workflow for the DEV environment.

**Process:**

- Calls the reusable `teardown-reusable.yml` workflow
- Passes DEV-specific configuration:
  - `AWS_ROLE_ARN_DEV` as the AWS role ARN
  - `AWS_REGION` as the AWS region
  - `CDK_ENV_DEV` as the CDK environment variables

**Concurrency:** Only one DEV teardown can run at a time; subsequent requests will cancel the in-progress workflow.

**Trigger:** Manual (`workflow_dispatch`)

**⚠️ Warning:** Teardown workflows permanently destroy provisioned AWS infrastructure. Use with caution and ensure you have backups of any critical data.

---

## Getting Started with Workflows

Workflows are defined in `.github/workflows/` as YAML files. Each workflow is triggered by specific events (push, pull_request, release, etc.).

### Example Workflow Structure

```yaml
name: CI
on:
  push:
    branches: [main, dev, qat, prd]
  pull_request:
    branches: [main, dev, qat, prd]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

---

## Environment Variables and Secrets

Workflows are configured using GitHub Actions variables and secrets:

- **Variables:**
  - Used for non-sensitive configuration (e.g., environment names, deployment flags).
  - Set in the repository or organization settings under "Variables".
- **Secrets:**
  - Used for sensitive data (e.g., AWS credentials, tokens).
  - Set in the repository or organization settings under "Secrets".

### Common Variables and Secrets

See the [Configuration Guide](./ConfigurationGuide.md) for a comprehensive list of variables and secrets.

---

## Adding or Modifying Workflows

- Add new workflow files to `.github/workflows/`.
- Reference official GitHub Actions and community actions for best practices.
- Use secrets for all sensitive data.
- Review workflow logs in the GitHub Actions tab for troubleshooting.

---

## Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Project Infrastructure Guide](./InfrastructureGuide.md)
- [Project Configuration Guide](./ConfigurationGuide.md)

---

For more information about this project, see the main [README](../README.md) or visit the [documentation](./README.md).
