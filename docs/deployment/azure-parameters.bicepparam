using './azure-template.bicep'

param projectName = 'llmworkflow'
param location = 'eastus'
param postgresAdminUsername = 'pgadmin'
param postgresAdminPassword = 'REPLACE_WITH_SECURE_PASSWORD'
param openaiApiKey = 'REPLACE_WITH_OPENAI_API_KEY'
