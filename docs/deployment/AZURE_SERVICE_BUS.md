# Azure Service Bus Integration Guide

This guide explains the Azure Service Bus integration in the LLM Workflow application. **The migration from RabbitMQ to Azure Service Bus is now complete**.

## Overview

The application now uses Azure Service Bus as the primary message queue service. Azure Service Bus provides similar functionality to RabbitMQ as a fully managed service. For local development, RabbitMQ can still be used as a fallback.

## Implementation Status

✅ **Migration Complete** - The application has been migrated to use Azure Service Bus:
- Azure Service Bus SDK installed (`@azure/service-bus`)
- Service Bus service and consumer implemented
- Configuration updated to support both Azure Service Bus and RabbitMQ
- Documentation updated

## Key Differences

| Feature | RabbitMQ | Azure Service Bus |
|---------|----------|-------------------|
| Deployment | Self-hosted (Docker) | Fully managed (PaaS) |
| Protocol | AMQP 0.9.1 | AMQP 1.0 |
| SDK | `amqplib` | `@azure/service-bus` |
| Pricing | Infrastructure cost | Pay per message |
| Management | Self-managed | Azure Portal |

## Current Implementation

The application now automatically uses Azure Service Bus when `AZURE_SERVICE_BUS_CONNECTION_STRING` is provided, otherwise it falls back to RabbitMQ for local development.

### Environment Variables

**For Azure Service Bus (Production):**
```env
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

**For RabbitMQ (Local Development - Fallback):**
```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=ai_tasks
```

### Configuration Files

The application includes both configurations:
- `apps/backend/src/config/servicebus.config.ts` - Azure Service Bus configuration with RabbitMQ fallback
- `apps/backend/src/config/rabbitmq.config.ts` - Legacy RabbitMQ configuration (maintained for reference)

### Implementation Files

**Azure Service Bus (Active):**
- `apps/backend/src/servicebus/servicebus.service.ts` - Publisher service
- `apps/backend/src/servicebus/task-consumer.service.ts` - Consumer service
- `apps/backend/src/servicebus/servicebus.module.ts` - Module definition

**RabbitMQ (Legacy):**
- `apps/backend/src/rabbitmq/` - Legacy implementation kept for local development reference

## How It Works

The application uses Azure Service Bus SDK (`@azure/service-bus`) which provides:
1. **ServiceBusClient** - Main client for connecting to Azure Service Bus
2. **ServiceBusSender** - For publishing messages to queues
3. **ServiceBusReceiver** - For consuming messages from queues

Configuration is loaded from environment variables with RabbitMQ as fallback:

```typescript
export default registerAs('servicebus', () => ({
  connectionString:
    process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ||
    process.env.RABBITMQ_URL ||
    'amqp://guest:guest@localhost:5672',
  queueName:
    process.env.AZURE_SERVICE_BUS_QUEUE_NAME ||
    process.env.RABBITMQ_QUEUE ||
    'ai-tasks',
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

Updated `.env.example` to include Azure Service Bus configuration with RabbitMQ as fallback.

## Usage

### For Production (Azure)

1. Set your environment variables in `.env`:
```env
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

2. Start your application:
```bash
npm run dev
```

The application will automatically connect to Azure Service Bus.

### For Local Development (RabbitMQ)

1. Start RabbitMQ with Docker Compose:
```bash
docker-compose up -d
```

2. Set your environment variables in `.env`:
```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=ai_tasks
```

3. Start your application:
```bash
npm run dev
```

The application will automatically fall back to RabbitMQ if Azure Service Bus connection string is not provided.

## Testing Locally with Azure Service Bus

You can test with Azure Service Bus locally without deploying to Azure:

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

## Fallback Behavior

The application automatically supports both Azure Service Bus and RabbitMQ through configuration fallback.

The `servicebus.config.ts` is configured to check for Azure Service Bus environment variables first, then fall back to RabbitMQ:

```typescript
export default registerAs('servicebus', () => ({
  connectionString:
    process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ||
    process.env.RABBITMQ_URL ||
    'amqp://guest:guest@localhost:5672',
  queueName:
    process.env.AZURE_SERVICE_BUS_QUEUE_NAME ||
    process.env.RABBITMQ_QUEUE ||
    'ai-tasks',
}));
```

**Priority Order:**
1. Azure Service Bus (if `AZURE_SERVICE_BUS_CONNECTION_STRING` is set)
2. RabbitMQ (if `RABBITMQ_URL` is set)  
3. Default local RabbitMQ

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
- [ ] Test locally with Azure Service Bus (optional)
- [ ] Deploy to Azure
- [ ] Verify message processing in production
- [ ] Set up monitoring and alerts (optional)

## Fallback to RabbitMQ

If you need to use RabbitMQ for local development, simply don't set the Azure Service Bus environment variables:

1. Ensure `AZURE_SERVICE_BUS_CONNECTION_STRING` is not set
2. Set `RABBITMQ_URL` and `RABBITMQ_QUEUE` in your `.env`
3. Ensure RabbitMQ containers are running (`docker-compose up -d`)
4. Start the application

The application will automatically use RabbitMQ.

## Additional Resources

- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [Azure Service Bus SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus)
- [Migrating from RabbitMQ to Azure Service Bus](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-migrate-from-rabbitmq)

---

**Note**: The ARM template in this repository already configures Azure Service Bus. This guide is for adapting the application code to use it.
