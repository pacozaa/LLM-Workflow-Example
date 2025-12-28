@description('Base name for all resources')
param projectName string = 'llmworkflow'

@description('Location for all resources')
param location string = resourceGroup().location

@description('PostgreSQL administrator username')
param postgresAdminUsername string = 'pgadmin'

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('OpenAI API Key')
@secure()
param openaiApiKey string

var appServicePlanName = '${projectName}-plan'
var backendAppName = '${projectName}-backend-${uniqueString(resourceGroup().id)}'
var frontendAppName = '${projectName}-frontend-${uniqueString(resourceGroup().id)}'
var postgresServerName = '${projectName}-postgres-${uniqueString(resourceGroup().id)}'
var serviceBusNamespaceName = '${projectName}-sb-${uniqueString(resourceGroup().id)}'
var queueName = 'ai-tasks'

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminUsername
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource postgresServerName_llm_workflow 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: 'llm_workflow'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource postgresServerName_AllowAllAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusNamespaceName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {}
}

resource serviceBusNamespaceName_queue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: queueName
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: false
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: false
    enableBatchedOperations: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    maxDeliveryCount: 10
    enablePartitioning: false
    enableExpress: false
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource backendApp 'Microsoft.Web/sites@2022-09-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'npm run start:prod'
      alwaysOn: true
      appSettings: [
        {
          name: 'DB_HOST'
          value: '${postgresServerName}.postgres.database.azure.com'
        }
        {
          name: 'DB_PORT'
          value: '5432'
        }
        {
          name: 'DB_USERNAME'
          value: postgresAdminUsername
        }
        {
          name: 'DB_PASSWORD'
          value: postgresAdminPassword
        }
        {
          name: 'DB_NAME'
          value: 'llm_workflow'
        }
        {
          name: 'AZURE_SERVICE_BUS_CONNECTION_STRING'
          value: listKeys(
            resourceId(
              'Microsoft.ServiceBus/namespaces/authorizationRules',
              serviceBusNamespaceName,
              'RootManageSharedAccessKey'
            ),
            '2022-10-01-preview'
          ).primaryConnectionString
        }
        {
          name: 'AZURE_SERVICE_BUS_QUEUE_NAME'
          value: queueName
        }
        {
          name: 'OPENAI_API_KEY'
          value: openaiApiKey
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'FRONTEND_URL'
          value: 'https://${frontendAppName}.azurestaticapps.net'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
  }
  dependsOn: [
    postgresServer
    serviceBusNamespace
  ]
}

resource frontendApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: frontendAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: ''
    branch: ''
    buildProperties: {
      appLocation: 'apps/frontend'
      apiLocation: ''
      outputLocation: 'dist'
    }
  }
}

output backendUrl string = 'https://${backendAppName}.azurewebsites.net'
output frontendUrl string = 'https://${frontendAppName}.azurestaticapps.net'
output postgresServer string = '${postgresServerName}.postgres.database.azure.com'
output serviceBusNamespace string = serviceBusNamespaceName
