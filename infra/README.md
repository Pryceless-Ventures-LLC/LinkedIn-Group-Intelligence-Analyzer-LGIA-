# CI/CD Setup Guide

This document outlines the GitHub secrets and infrastructure required for the CI/CD pipeline defined in `.github/workflows/ci-cd.yml`.

## Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions** in your GitHub repository and add the following secrets:

### AWS Credentials

- `AWS_ACCESS_KEY_ID` - AWS access key ID for programmatic access
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for programmatic access
- `AWS_REGION` - AWS region (e.g., `us-east-1`)
- `AWS_ACCOUNT_ID` - Your 12-digit AWS account ID

### Amazon ECR

- `AWS_ECR_REPOSITORY` - Name of your ECR repository (e.g., `watch-what-you-say-backend`)

### Amazon ECS - Development Environment

- `AWS_ECS_CLUSTER_DEV` - ECS cluster name for development
- `AWS_ECS_SERVICE_DEV` - ECS service name for development

### Amazon ECS - Preview Environment

- `AWS_ECS_CLUSTER_PREVIEW` - ECS cluster name for preview
- `AWS_ECS_SERVICE_PREVIEW` - ECS service name for preview

### Amazon ECS - Production Environment

- `AWS_ECS_CLUSTER_PROD` - ECS cluster name for production
- `AWS_ECS_SERVICE_PROD` - ECS service name for production

## Task Definition

The workflow uses `infra/task-definition.json` as the base ECS task definition. This file must be committed to the repository and should include:

1. **Container name**: Must be `backend` (referenced in the workflow)
2. **Environment variables**: Such as `ENVIRONMENT`, `FLASK_ENV`, etc.
3. **Secrets**: References to AWS Secrets Manager for sensitive data like:
   - `OPENAI_API_KEY_DEV` / `OPENAI_API_KEY_PREVIEW` / `OPENAI_API_KEY_PROD`
   - `HF_API_KEY_DEV` / `HF_API_KEY_PREVIEW` / `HF_API_KEY_PROD`
   - Any other environment-specific API keys or credentials

### Customizing the Task Definition

Before using this workflow, update `infra/task-definition.json`:

1. Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID
2. Replace `YOUR_REGION` with your AWS region
3. Update the execution role ARN and task role ARN with your actual IAM role ARNs
4. Configure the secrets ARNs to point to your AWS Secrets Manager secrets
5. Adjust CPU, memory, and other container settings as needed

## Workflow Behavior

### Branch-Based Deployments

The workflow triggers on pushes to three branches:

- `dev` → deploys to **development** environment
- `preview` → deploys to **preview** environment
- `main` → deploys to **production** environment

### Pipeline Stages

1. **Frontend CI**: Builds and tests the React frontend (deployment handled by Vercel)
2. **Backend CI/CD**: 
   - Runs Python/Flask tests
   - Builds Docker image
   - Pushes to Amazon ECR
   - Updates ECS task definition
   - Deploys to appropriate ECS environment

## Prerequisites

Before running the workflow, ensure:

1. ✅ All GitHub secrets are configured
2. ✅ AWS ECR repository exists
3. ✅ ECS clusters and services are created for all environments (dev, preview, prod)
4. ✅ IAM roles for ECS task execution and task are configured
5. ✅ AWS Secrets Manager contains the required secrets
6. ✅ CloudWatch log groups exist (e.g., `/ecs/watch-what-you-say-backend`)
7. ✅ `frontend/` directory exists with a React application
8. ✅ `backend/` directory exists with a Flask application and Dockerfile

## Testing the Workflow

To test the workflow without deploying:

1. Create a test branch based on your environment (e.g., `test-dev`)
2. Push changes to trigger the workflow on pull requests
3. The workflow will run but won't deploy on pull requests

## Troubleshooting

### Common Issues

- **Missing secrets**: Ensure all required secrets are added to GitHub
- **ECR authentication fails**: Verify AWS credentials and ECR repository exists
- **ECS deployment fails**: Check ECS cluster/service names and task definition validity
- **Task definition errors**: Validate JSON syntax and ensure container name is `backend`

### Logs

- GitHub Actions logs: Available in the **Actions** tab of your repository
- ECS logs: Check CloudWatch Logs at `/ecs/watch-what-you-say-backend`
