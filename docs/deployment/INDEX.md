# Azure Deployment Documentation Index

This directory contains comprehensive documentation for deploying the LLM Workflow Example application to Microsoft Azure using Azure Resource Manager (ARM) templates.

## 📚 Documentation Files

### 1. [README.md](README.md) - Complete Deployment Guide
**The main comprehensive guide covering everything you need to know.**

Includes:
- Detailed architecture overview with diagrams
- Complete prerequisites list
- Step-by-step manual deployment instructions
- Automated deployment with GitHub Actions
- Post-deployment configuration
- Troubleshooting guides
- Cost estimation
- Cleanup instructions

**Start here if**: You want complete, detailed instructions for deploying to Azure.

### 2. [QUICKSTART.md](QUICKSTART.md) - Quick Start Guide
**Condensed guide for experienced users who want to deploy quickly.**

Includes:
- Prerequisites checklist
- Quick command-line steps for manual deployment
- Fast setup for GitHub Actions automation
- Essential troubleshooting commands
- Cost overview

**Start here if**: You're familiar with Azure and want to deploy quickly.

### 3. [AZURE_SERVICE_BUS.md](AZURE_SERVICE_BUS.md) - Service Bus Integration
**Guide for migrating from RabbitMQ to Azure Service Bus.**

Includes:
- Comparison between RabbitMQ and Azure Service Bus
- Code changes required for migration
- Complete service implementation examples
- Testing locally with Azure Service Bus
- Monitoring and management
- Dead letter queue handling

**Start here if**: You need to adapt the application code to use Azure Service Bus instead of RabbitMQ.

## 🏗️ Infrastructure Files

### 1. [azure-template.json](azure-template.json) - ARM Template
The Azure Resource Manager template that defines all infrastructure resources:

- **Azure Database for PostgreSQL (Flexible Server)**: Managed database service
- **Azure Service Bus**: Message queue (replaces RabbitMQ)
- **Azure App Service Plan**: Compute resources (B1 Basic tier)
- **Azure App Service (Linux)**: Backend API hosting
- **Azure Static Web Apps**: Frontend hosting

### 2. [azure-parameters.json](azure-parameters.json) - Parameters File
Template parameters file for customizing the deployment:

- Project name
- Location (Azure region)
- PostgreSQL credentials
- OpenAI API key

**⚠️ Important**: Update this file with your actual credentials before deployment.

## 🚀 Deployment Options

### Option 1: Manual Deployment
Deploy using Azure CLI with step-by-step control:
1. Install Azure CLI
2. Login to Azure
3. Edit parameters file
4. Run deployment commands
5. Deploy applications

**Best for**: Testing, learning, or when you need full control over each step.

### Option 2: Automated Deployment (GitHub Actions)
Deploy automatically via CI/CD pipeline:
1. Configure GitHub secrets
2. Trigger workflow manually or on push
3. Automatic build and deployment
4. Integrated health checks

**Best for**: Production deployments, team collaboration, consistent deployments.

## 📋 Quick Navigation

### I want to...

| Goal | Document | Section |
|------|----------|---------|
| Deploy for the first time | [README.md](README.md) | Manual Deployment |
| Set up CI/CD automation | [README.md](README.md) | Automated Deployment |
| Deploy quickly (experienced) | [QUICKSTART.md](QUICKSTART.md) | Option 1 or 2 |
| Adapt code for Azure Service Bus | [AZURE_SERVICE_BUS.md](AZURE_SERVICE_BUS.md) | Code Changes |
| Troubleshoot deployment issues | [README.md](README.md) | Troubleshooting |
| Estimate costs | [README.md](README.md) | Cost Estimation |
| Configure custom domains | [README.md](README.md) | Post-Deployment |
| Monitor the application | [README.md](README.md) | Application Insights |
| Delete all resources | [README.md](README.md) | Cleanup |

## 🏛️ Architecture Overview

```
Azure Cloud Infrastructure
├── Resource Group (llm-workflow-rg)
│   ├── App Service Plan (B1 Basic - Linux)
│   ├── App Service (Backend API)
│   │   ├── Node.js 20 runtime
│   │   ├── Environment variables
│   │   └── Connected to PostgreSQL & Service Bus
│   ├── Static Web App (Frontend)
│   │   ├── React application
│   │   └── Connected to Backend API
│   ├── PostgreSQL Flexible Server (B1ms)
│   │   ├── Database: llm_workflow
│   │   └── Firewall rules
│   └── Service Bus Namespace (Basic)
│       └── Queue: ai-tasks
```

## 🔐 Required Secrets (for GitHub Actions)

When using automated deployment, configure these GitHub repository secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_CREDENTIALS` | Service principal JSON | `az ad sp create-for-rbac ...` |
| `AZURE_RESOURCE_GROUP` | Resource group name | Your choice (e.g., "llm-workflow-rg") |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `az account show --query id -o tsv` |
| `POSTGRES_ADMIN_PASSWORD` | Database password | Strong password you create |
| `OPENAI_API_KEY` | OpenAI API key | From OpenAI Platform |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token | From Azure Portal |

Detailed instructions in [README.md](README.md#step-2-configure-github-secrets).

## 💰 Cost Estimate

Approximate monthly costs for the deployment (US East region):

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| App Service Plan | B1 Basic | ~$13.14 |
| PostgreSQL Server | B1ms Burstable | ~$12.41 |
| Service Bus | Basic | ~$0.05 |
| Static Web Apps | Free | $0.00 |
| **Total** | | **~$25-30/month** |

*Plus OpenAI API usage costs (varies by usage)*

## ⚠️ Important Notes

1. **Security**: Never commit the `azure-parameters.json` file with real credentials to Git
2. **OpenAI Costs**: OpenAI API usage is charged separately based on token usage
3. **Database**: The ARM template creates a publicly accessible PostgreSQL server with firewall rules - configure appropriately for production
4. **Auto-scaling**: The B1 Basic tier doesn't include auto-scaling; upgrade to Standard or Premium for production
5. **SSL/TLS**: All Azure services use HTTPS by default
6. **Backups**: PostgreSQL automated backups are configured with 7-day retention

## 🔧 Customization

### Change Azure Region
Edit `location` parameter in `azure-parameters.json` or during deployment:
```json
"location": { "value": "westus2" }
```

Available regions: eastus, westus2, centralus, northeurope, westeurope, etc.

### Scale Up Resources
Modify SKUs in `azure-template.json`:
- **App Service**: Change `B1` to `P1V2` or higher
- **PostgreSQL**: Change `Standard_B1ms` to `Standard_D2s_v3` or higher
- **Service Bus**: Change `Basic` to `Standard` or `Premium`

### Add Custom Domain
Follow instructions in [README.md](README.md#configure-custom-domain-optional)

## 📞 Support

- **Application Issues**: Create an issue in the [GitHub repository](https://github.com/pacozaa/LLM-Workflow-Example/issues)
- **Azure Service Issues**: Contact [Azure Support](https://azure.microsoft.com/support/)
- **Documentation Feedback**: Submit a pull request or issue

## 📖 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Database for PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)
- [ARM Template Reference](https://docs.microsoft.com/azure/templates/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## 🎯 Next Steps

1. **Choose your deployment method**: Manual or Automated
2. **Review the appropriate guide**: README.md (detailed) or QUICKSTART.md (fast)
3. **Prepare your credentials**: Azure subscription, OpenAI API key
4. **Deploy**: Follow the chosen guide step-by-step
5. **Verify**: Test your deployed application
6. **Monitor**: Set up logging and monitoring as needed

---

**Last Updated**: 2025-12-21  
**Version**: 1.0.0  
**Compatibility**: Azure CLI 2.40+, Node.js 20+
