# Azure Service Bus Integration Guide

This guide explains the Azure Service Bus integration in the LLM Workflow application.

## Overview

The application uses Azure Service Bus as the message queue service. Azure Service Bus is a fully managed enterprise message broker with message queues and publish-subscribe topics.

## Implementation Status

✅ **Complete** - The application uses Azure Service Bus exclusively:
- Azure Service Bus SDK installed (`@azure/service-bus`)
- Service Bus service and consumer implemented
- Configuration requires Azure Service Bus connection string
- Documentation updated

## Azure Service Bus Benefits

| Feature | Description |
|---------|-------------|
| Deployment | Fully managed (PaaS) - no infrastructure to maintain |
| Protocol | AMQP 1.0 |
| SDK | `@azure/service-bus` |
| Pricing | Pay per message |
| Management | Azure Portal with metrics and monitoring |
| Reliability | Built-in dead letter queues and retry policies |

## Current Implementation

The application requires `AZURE_SERVICE_BUS_CONNECTION_STRING` to be configured in environment variables.

### Environment Variables

**Required Configuration:**
```env
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

### Configuration Files

The application configuration:
- `apps/backend/src/config/servicebus.config.ts` - Azure Service Bus configuration

### Implementation Files

**Azure Service Bus Implementation:**
- `apps/backend/src/servicebus/servicebus.service.ts` - Publisher service
- `apps/backend/src/servicebus/task-consumer.service.ts` - Consumer service
- `apps/backend/src/servicebus/servicebus.module.ts` - Module definition

## How It Works

The application uses Azure Service Bus SDK (`@azure/service-bus`) which provides:
1. **ServiceBusClient** - Main client for connecting to Azure Service Bus
2. **ServiceBusSender** - For publishing messages to queues
3. **ServiceBusReceiver** - For consuming messages from queues

Configuration is loaded from environment variables:

```typescript
export default registerAs('servicebus', () => ({
  connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
  queueName: process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'ai-tasks',
}));
```

## Migration Details (Completed)

The following changes were made to migrate from RabbitMQ to Azure Service Bus:

### 1. ✅ Installed Azure Service Bus SDK

```bash
cd apps/backend
npm install @azure/service-bus
```

### 2. ✅ Created Configuration File
### 3. ✅ Created Service Bus Service

The `ServicebusService` handles publishing messages to Azure Service Bus queues.

### 4. ✅ Created Task Consumer Service

The `TaskConsumerService` handles consuming messages from Azure Service Bus queues and processing them.

### 5. ✅ Updated Application Module

Updated `app.module.ts` to import `ServicebusModule` instead of `RabbitmqModule`.

### 6. ✅ Updated Tasks Module

Updated `tasks.module.ts` to use `ServicebusModule`.

### 7. ✅ Updated Tasks Service

Updated `tasks.service.ts` to use `ServicebusService` for publishing tasks.

### 8. ✅ Updated Environment Configuration

Updated `.env.example` to require Azure Service Bus configuration.

## Usage

1. Set your environment variables in `.env`:
```env
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

2. Start your application:
```bash
npm run dev
```

The application will connect to Azure Service Bus.

## Setting Up Azure Service Bus

You can use Azure Service Bus for both local development and production:

### 1. Create Azure Service Bus Namespace

```bash
az servicebus namespace create \
  --resource-group llm-workflow-dev \
  --name llm-workflow-sb-dev \
  --location eastus \
  --sku Basic
```

### 2. Create Queue

```bash
az servicebus queue create \
  --resource-group llm-workflow-dev \
  --namespace-name llm-workflow-sb-dev \
  --name ai-tasks
```

### 3. Get Connection String

```bash
az servicebus namespace authorization-rule keys list \
  --resource-group llm-workflow-dev \
  --namespace-name llm-workflow-sb-dev \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

### 4. Update Local .env

```env
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

## Monitoring and Management

### Azure Portal

- View queue metrics and message counts
- Monitor message throughput
- Configure dead letter queues
- Set up alerts

### Azure CLI

```bash
# Get queue metrics
az servicebus queue show \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $SERVICEBUS_NAMESPACE \
  --name ai-tasks

# View dead letter messages
az servicebus queue show \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $SERVICEBUS_NAMESPACE \
  --name ai-tasks \
  --query "countDetails.deadLetterMessageCount"
```

## Dead Letter Queue Handling

Azure Service Bus automatically moves failed messages to a dead letter queue:

```typescript
// Process dead letter messages
const dlqReceiver = client.createReceiver(queueName, {
  subQueueType: 'deadLetter'
});

for await (const message of dlqReceiver.getMessageIterator()) {
  console.log('Dead letter message:', message.body);
  console.log('Reason:', message.deadLetterReason);
  console.log('Description:', message.deadLetterErrorDescription);
  
  // Complete the message to remove from DLQ
  await dlqReceiver.completeMessage(message);
}
```

## Migration Checklist

- [x] Install `@azure/service-bus` package
- [x] Create Azure Service Bus configuration  
- [x] Implement Azure Service Bus service
- [x] Implement task consumer for Service Bus
- [x] Update module imports (app.module.ts, tasks.module.ts)
- [x] Update tasks service to use Service Bus
- [x] Update environment configuration (.env.example)
- [x] Update documentation (README, ARCHITECTURE, deployment docs)
- [ ] Deploy to Azure
- [ ] Verify message processing in production
- [ ] Set up monitoring and alerts (optional)

## Additional Resources

- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [Azure Service Bus SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus)

---

**Note**: The Bicep template in this repository configures Azure Service Bus. This application uses Azure Service Bus exclusively for message queuing.
