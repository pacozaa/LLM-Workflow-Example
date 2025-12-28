# Azure Deployment Quick Start

This is a condensed guide for quickly deploying the LLM Workflow application to Azure. For detailed instructions, see the [complete deployment guide](README.md).

## Prerequisites Checklist

- [ ] Azure account with active subscription
- [ ] Azure CLI installed and logged in (`az login`)
- [ ] OpenAI API key
- [ ] GitHub repository access (for automated deployment)

## Option 1: Manual Deployment (15 minutes)

### Quick Steps

```bash
# 1. Login to Azure
az login

# 2. Set variables
RESOURCE_GROUP="llm-workflow-rg"
LOCATION="eastus"

# 3. Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# 4. Edit parameters file
nano docs/deployment/azure-parameters.bicepparam
# Update: postgresAdminPassword and openaiApiKey

# 5. Deploy infrastructure
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file docs/deployment/azure-template.bicep \
  --parameters docs/deployment/azure-parameters.bicepparam

# 6. Build and deploy backend
cd apps/backend
npm install && npm run build
cd ../..
zip -r backend-deploy.zip apps/backend/dist apps/backend/package*.json

# Get backend app name
BACKEND_APP=$(az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs.backendUrl.value' -o tsv | \
  sed 's/https:\/\///' | sed 's/.azurewebsites.net//')

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src backend-deploy.zip

# 7. Get deployment URLs
az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs' -o json
```

## Option 2: Automated Deployment via GitHub Actions (Recommended)

### Setup Steps

1. **Create Azure Service Principal**
   ```bash
   az ad sp create-for-rbac \
     --name "llm-workflow-github-actions" \
     --role contributor \
     --scopes /subscriptions/$(az account show --query id -o tsv) \
     --sdk-auth
   ```

2. **Add GitHub Secrets**
   
   Go to: **Repository → Settings → Secrets and variables → Actions**
   
   Add these secrets:
   - `AZURE_CREDENTIALS`: Full JSON output from step 1
   - `AZURE_RESOURCE_GROUP`: `llm-workflow-rg`
   - `AZURE_SUBSCRIPTION_ID`: From `az account show --query id -o tsv`
   - `POSTGRES_ADMIN_PASSWORD`: Strong password (e.g., `P@ssw0rd123!`)
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Get from Azure Portal after first deployment

3. **Trigger Deployment**
   
   Go to: **Actions → Deploy to Azure → Run workflow**
   
   Or push to `main` branch to trigger automatically.

### Get Static Web Apps Token

After the first deployment creates the Static Web App:

```bash
# List Static Web Apps
az staticwebapp list --resource-group $RESOURCE_GROUP -o table

# Get deployment token (from Azure Portal is easier)
# Portal: Static Web App → Manage deployment token
```

Or via Azure Portal:
1. Navigate to your Static Web App resource
2. Click "Manage deployment token"
3. Copy the token
4. Add as `AZURE_STATIC_WEB_APPS_API_TOKEN` secret in GitHub

## Post-Deployment

### Verify Deployment

```bash
# Check all resources
az resource list --resource-group $RESOURCE_GROUP -o table

# Get URLs
az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name azure-template \
  --query 'properties.outputs' -o json
```

### Access Application

- **Frontend**: `https://<frontend-app>.azurestaticapps.net`
- **Backend API**: `https://<backend-app>.azurewebsites.net`

### View Logs

```bash
# Backend logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name <backend-app-name>

# Enable logging if not already enabled
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name <backend-app-name> \
  --application-logging filesystem \
  --level information
```

## Troubleshooting Quick Fixes

### Backend not starting
```bash
# Check environment variables
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name <backend-app-name>

# Restart app
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name <backend-app-name>
```

### Database connection issues
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name <postgres-server-name>

# Add your IP if needed
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name <postgres-server-name> \
  --rule-name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

### CORS issues
```bash
# Add frontend URL to CORS
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name <backend-app-name> \
  --allowed-origins "https://<frontend-app>.azurestaticapps.net"
```

## Cleanup

**Delete everything:**
```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Estimated Costs

- **App Service B1**: ~$13/month
- **PostgreSQL B1ms**: ~$12/month
- **Service Bus Basic**: ~$0.05/month
- **Static Web Apps Free**: $0/month

**Total**: ~$25-30/month (plus OpenAI API usage)

## Need Help?

- **Detailed guide**: [README.md](README.md)
- **GitHub Issues**: [Report a problem](https://github.com/pacozaa/LLM-Workflow-Example/issues)
- **Azure Docs**: [learn.microsoft.com/azure](https://learn.microsoft.com/azure)

---

**Pro Tips:**
- Use GitHub Actions for production deployments (more reliable)
- Enable Application Insights for monitoring
- Set up automatic backups for PostgreSQL
- Use Azure Key Vault for secrets in production
