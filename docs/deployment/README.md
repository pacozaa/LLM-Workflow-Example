# Azure Deployment Guide

This guide provides instructions for deploying the LLM Workflow Example application to Azure Cloud using Bicep templates. The deployment can be performed both manually and automatically through GitHub Actions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Manual Deployment](#manual-deployment)
- [Automated Deployment with GitHub Actions](#automated-deployment-with-github-actions)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

The Azure deployment uses the following services:

- **Azure App Service (Linux)**: Hosts the NestJS backend API
- **Azure Static Web Apps**: Hosts the React frontend
- **Azure Database for PostgreSQL (Flexible Server)**: Managed PostgreSQL database
- **Azure Service Bus**: Message queue service (replaces RabbitMQ)
- **App Service Plan (B1)**: Compute resources for the backend

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Cloud                              │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │ Azure Static     │         │ Azure App        │        │
│  │ Web Apps         │────────▶│ Service          │        │
│  │ (Frontend)       │         │ (Backend)        │        │
│  └──────────────────┘         └──────────────────┘        │
│                                        │                    │
│                                        │                    │
│                     ┌──────────────────┴───────────┐       │
│                     │                              │       │
│              ┌──────▼──────┐              ┌───────▼─────┐ │
│              │ Azure       │              │ Azure       │ │
│              │ PostgreSQL  │              │ Service Bus │ │
│              │ Database    │              │ (Queue)     │ │
│              └─────────────┘              └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before deploying, ensure you have:

1. **Azure Account**: Active Azure subscription ([Create free account](https://azure.microsoft.com/free/))
2. **Azure CLI**: Version 2.40.0 or later ([Install guide](https://learn.microsoft.com/cli/azure/install-azure-cli))
3. **OpenAI API Key**: From [OpenAI Platform](https://platform.openai.com/api-keys)
4. **Git**: For cloning the repository
5. **Node.js**: Version 20.x or later (for local building)

### Verify Azure CLI Installation

```bash
az --version
az login
```

## Manual Deployment

### Step 1: Clone the Repository

```bash
git clone https://github.com/pacozaa/LLM-Workflow-Example.git
cd LLM-Workflow-Example
```

### Step 2: Create Azure Resource Group

```bash
# Set your preferences
RESOURCE_GROUP="llm-workflow-rg"
LOCATION="eastus"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 3: Prepare Parameters File

Edit the `docs/deployment/azure-parameters.bicepparam` file and replace the placeholder values:

```bicep
using './azure-template.bicep'

param projectName = 'llmworkflow'
param location = 'eastus'
param postgresAdminUsername = 'pgadmin'
param postgresAdminPassword = 'YourSecurePassword123!'
param openaiApiKey = 'sk-your-openai-api-key'
```

**Important**: Use a strong password for PostgreSQL that meets Azure's requirements:
- At least 8 characters
- Contains uppercase, lowercase, numbers, and special characters

### Step 4: Deploy Bicep Template

```bash
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file docs/deployment/azure-template.bicep \
  --parameters docs/deployment/azure-parameters.bicepparam
```

This deployment typically takes 10-15 minutes. You'll see output with resource URLs when complete.

### Step 5: Build and Deploy Backend

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
npm install

# Build the application
npm run build

# Create deployment package
cd ../..
zip -r backend-deploy.zip apps/backend/dist apps/backend/package*.json

# Get backend app name from deployment output
BACKEND_APP_NAME=$(az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs.backendUrl.value' -o tsv | sed 's/https:\/\///' | sed 's/.azurewebsites.net//')

# Deploy to Azure App Service
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --src backend-deploy.zip
```

### Step 6: Deploy Frontend

For Azure Static Web Apps, you have two options:

#### Option A: Using Azure CLI

```bash
# Build the frontend
cd apps/frontend
npm install
npm run build

# Deploy to Static Web App
FRONTEND_APP_NAME=$(az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs.frontendUrl.value' -o tsv | sed 's/https:\/\///' | sed 's/.azurestaticapps.net//')

az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --source dist \
  --location $LOCATION
```

#### Option B: Using GitHub Actions (Recommended)

Azure Static Web Apps work best with GitHub Actions. See the [Automated Deployment](#automated-deployment-with-github-actions) section below.

### Step 7: Configure Frontend Environment

Update the frontend to point to your Azure backend:

1. Get your backend URL:
```bash
az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs.backendUrl.value' -o tsv
```

2. Update the frontend build with the correct API URL:
```bash
# In apps/frontend/.env or build configuration
VITE_API_URL=https://your-backend-url.azurewebsites.net
```

3. Rebuild and redeploy frontend with the updated configuration.

### Step 8: Verify Deployment

Check the deployment outputs:

```bash
az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs' -o json
```

Test the endpoints:
- Backend: `https://<backend-app-name>.azurewebsites.net`
- Frontend: `https://<frontend-app-name>.azurestaticapps.net`

## Automated Deployment with GitHub Actions

GitHub Actions provides automated CI/CD for deploying to Azure.

### Prerequisites

1. Fork or have write access to the repository
2. Azure service principal with contributor access
3. GitHub repository secrets configured

### Step 1: Create Azure Service Principal

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal
az ad sp create-for-rbac \
  --name "llm-workflow-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID \
  --sdk-auth
```

Save the entire JSON output - you'll need it for GitHub Secrets.

### Step 2: Configure GitHub Secrets

Go to your repository on GitHub: **Settings → Secrets and variables → Actions**

Add the following secrets:

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `AZURE_CREDENTIALS` | Service principal JSON | Output from Step 1 |
| `AZURE_RESOURCE_GROUP` | Resource group name | `llm-workflow-rg` |
| `AZURE_SUBSCRIPTION_ID` | Your Azure subscription ID | From `az account show` |
| `POSTGRES_ADMIN_PASSWORD` | PostgreSQL password | Strong password |
| `OPENAI_API_KEY` | OpenAI API key | Your OpenAI key |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web Apps token | See instructions below |

To get the Static Web Apps deployment token:
1. Go to Azure Portal → Your Static Web App
2. Navigate to **Manage deployment token**
3. Copy the token

### Step 3: Run the Workflow

The GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) can be triggered:

#### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Azure** workflow
3. Click **Run workflow**
4. Choose the branch
5. Click **Run workflow**

#### Automatic Trigger

The workflow automatically runs on:
- Push to `main` branch
- Pull request to `main` branch

### Step 4: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Monitor the deployment progress
4. Check for any errors in the logs

### Workflow Features

The GitHub Actions workflow includes:

- ✅ Automated infrastructure deployment with Bicep templates
- ✅ Backend build and deployment to App Service
- ✅ Frontend build and deployment to Static Web Apps
- ✅ Environment variable configuration
- ✅ Health checks after deployment
- ✅ Manual workflow dispatch option
- ✅ Parallel deployment for faster builds

### Security Considerations

### Database Security

⚠️ **Important**: The default Bicep template creates a PostgreSQL server with a firewall rule that allows access from all Azure services (0.0.0.0/0). This is convenient for initial setup but **not recommended for production**.

**For Production Deployments:**

1. **Use Virtual Network Integration**:
   ```bash
   # Create a VNet-integrated deployment
   az postgres flexible-server create \
     --resource-group $RESOURCE_GROUP \
     --name $POSTGRES_SERVER_NAME \
     --vnet your-vnet \
     --subnet your-subnet
   ```

2. **Restrict to Specific IP Ranges**:
   ```bash
   # Remove the allow-all rule
   az postgres flexible-server firewall-rule delete \
     --resource-group $RESOURCE_GROUP \
     --name $POSTGRES_SERVER_NAME \
     --rule-name AllowAllAzureServices
   
   # Add specific IP ranges
   az postgres flexible-server firewall-rule create \
     --resource-group $RESOURCE_GROUP \
     --name $POSTGRES_SERVER_NAME \
     --rule-name AllowAppService \
     --start-ip-address <app-service-outbound-ip> \
     --end-ip-address <app-service-outbound-ip>
   ```

3. **Use Private Endpoints** (Premium tier):
   - Create a private endpoint for the PostgreSQL server
   - Access database only through private network

### Secret Management

- **Never commit** `azure-parameters.bicepparam` with real credentials to source control
- Use **Azure Key Vault** for production secret management
- Rotate credentials regularly
- Use **managed identities** where possible instead of connection strings

### Additional Security Best Practices

- Enable SSL/TLS enforcement for database connections
- Use strong passwords (minimum 16 characters, mixed case, numbers, symbols)
- Enable Azure Security Center for threat detection
- Configure network security groups (NSGs) for additional network isolation
- Enable Application Insights for security monitoring

## Post-Deployment Configuration

### Update Backend CORS Settings

If you encounter CORS issues:

```bash
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --allowed-origins "https://<frontend-app-name>.azurestaticapps.net"
```

### Enable Logging

Enable application logs for troubleshooting:

```bash
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --application-logging filesystem \
  --level information
```

View logs:

```bash
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME
```

### Scale Resources

If you need more resources:

```bash
# Scale up App Service Plan
az appservice plan update \
  --resource-group $RESOURCE_GROUP \
  --name llmworkflow-plan \
  --sku P1V2

# Scale PostgreSQL
az postgres flexible-server update \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER_NAME \
  --sku-name Standard_D2s_v3
```

### Configure Custom Domain (Optional)

For Azure Static Web Apps:

```bash
az staticwebapp hostname set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP_NAME \
  --hostname www.yourdomain.com
```

For App Service:

```bash
az webapp config hostname add \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $BACKEND_APP_NAME \
  --hostname api.yourdomain.com
```

## Troubleshooting

### Backend Not Starting

Check the logs:

```bash
az webapp log tail --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME
```

Common issues:
- Missing environment variables
- Database connection issues
- Incorrect Node.js version

### Database Connection Failed

1. Verify firewall rules:
```bash
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER_NAME
```

2. Test connection from App Service:
```bash
az webapp ssh --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME

# Inside SSH session
psql -h <postgres-server>.postgres.database.azure.com -U pgadmin -d llm_workflow
```

### Frontend Not Loading

1. Check Static Web App status:
```bash
az staticwebapp show \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP_NAME
```

2. Verify API URL configuration in frontend build

### Service Bus Connection Issues

Get connection string:

```bash
az servicebus namespace authorization-rule keys list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $SERVICE_BUS_NAMESPACE \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

### Application Insights (Optional)

Enable Application Insights for monitoring:

```bash
az monitor app-insights component create \
  --app llm-workflow-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app llm-workflow-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Add to App Service
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

## Cost Estimation

Approximate monthly costs (US East):

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| App Service Plan | B1 Basic | $13.14/month |
| Azure Database for PostgreSQL | B1ms Burstable | $12.41/month |
| Azure Service Bus | Basic | $0.05/month |
| Azure Static Web Apps | Free | $0.00/month |
| **Total** | | **~$25-30/month** |

*Note: Costs vary by region and actual usage. OpenAI API costs are separate.*

## Cleanup

To delete all Azure resources:

```bash
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait
```

⚠️ **Warning**: This permanently deletes all resources and data.

## Additional Resources

- [Azure App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Database for PostgreSQL Documentation](https://learn.microsoft.com/azure/postgresql/)
- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Bicep Template Reference](https://learn.microsoft.com/azure/templates/)

## Support

For issues related to:
- **Application**: Create an issue in the GitHub repository
- **Azure Services**: Contact Azure Support
- **OpenAI API**: Visit OpenAI Support

---

**Last Updated**: 2025-12-21
