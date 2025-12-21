# Azure Service Bus Integration Guide

This guide explains how to adapt the LLM Workflow application to use Azure Service Bus instead of RabbitMQ when deploying to Azure.

## Overview

The application currently uses RabbitMQ for message queuing. When deploying to Azure, we recommend using Azure Service Bus, which provides similar functionality as a fully managed service.

## Key Differences

| Feature | RabbitMQ | Azure Service Bus |
|---------|----------|-------------------|
| Deployment | Self-hosted (Docker) | Fully managed (PaaS) |
| Protocol | AMQP 0.9.1 | AMQP 1.0 |
| SDK | `amqplib` | `@azure/service-bus` |
| Pricing | Infrastructure cost | Pay per message |
| Management | Self-managed | Azure Portal |

## Code Changes Required

### 1. Install Azure Service Bus SDK

```bash
cd apps/backend
npm install @azure/service-bus
```

### 2. Update Environment Variables

Replace RabbitMQ environment variables with Azure Service Bus:

**Before (RabbitMQ):**
```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=ai_tasks
```

**After (Azure Service Bus):**
```env
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

### 3. Update Configuration Files

**apps/backend/src/config/rabbitmq.config.ts** → **servicebus.config.ts**

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('servicebus', () => ({
  connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
  queueName: process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'ai-tasks',
}));
```

### 4. Update RabbitMQ Service

**apps/backend/src/rabbitmq/rabbitmq.service.ts** → **servicebus/servicebus.service.ts**

```typescript
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';

@Injectable()
export class ServiceBusService implements OnModuleDestroy {
  private readonly logger = new Logger(ServiceBusService.name);
  private client: ServiceBusClient;
  private sender: ServiceBusSender;
  private queueName: string;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private async initialize() {
    const connectionString = this.configService.get<string>(
      'servicebus.connectionString',
    );
    this.queueName = this.configService.get<string>('servicebus.queueName');

    this.client = new ServiceBusClient(connectionString);
    this.sender = this.client.createSender(this.queueName);

    this.logger.log('Azure Service Bus connection established');
  }

  async publishTask(taskData: any): Promise<void> {
    try {
      const message = {
        body: taskData,
        contentType: 'application/json',
      };

      await this.sender.sendMessages(message);
      this.logger.log(`Task published to queue: ${taskData.taskId}`);
    } catch (error) {
      this.logger.error('Failed to publish task', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.sender.close();
    await this.client.close();
    this.logger.log('Azure Service Bus connection closed');
  }
}
```

### 5. Update Task Consumer

**apps/backend/src/rabbitmq/task-consumer.service.ts** → **servicebus/task-consumer.service.ts**

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ProcessErrorArgs,
} from '@azure/service-bus';
import { TasksService } from '../tasks/tasks.service';
import { OpenaiService } from '../openai/openai.service';
import { TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class TaskConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskConsumerService.name);
  private client: ServiceBusClient;
  private receiver: ServiceBusReceiver;
  private queueName: string;

  constructor(
    private configService: ConfigService,
    private tasksService: TasksService,
    private openaiService: OpenaiService,
  ) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>(
      'servicebus.connectionString',
    );
    this.queueName = this.configService.get<string>('servicebus.queueName');

    this.client = new ServiceBusClient(connectionString);
    this.receiver = this.client.createReceiver(this.queueName);

    this.startConsuming();
    this.logger.log('Task consumer initialized');
  }

  private startConsuming() {
    const processMessage = async (message) => {
      try {
        const taskData = message.body;
        this.logger.log(`Processing task: ${taskData.taskId}`);

        // Update task status to PROCESSING
        await this.tasksService.updateTaskStatus(
          taskData.taskId,
          TaskStatus.PROCESSING,
        );

        // Call OpenAI API
        const aiResult = await this.openaiService.processTask(taskData.userInput);

        // Update task with result
        await this.tasksService.updateTaskResult(taskData.taskId, aiResult);

        this.logger.log(`Task completed: ${taskData.taskId}`);
      } catch (error) {
        this.logger.error(`Task processing failed: ${error.message}`, error);
        await this.tasksService.updateTaskError(
          message.body.taskId,
          error.message,
        );
        throw error; // Will trigger dead letter queue
      }
    };

    const processError = async (args: ProcessErrorArgs) => {
      this.logger.error('Error processing message:', args.error);
    };

    this.receiver.subscribe({
      processMessage,
      processError,
    });

    this.logger.log('Started consuming messages from Service Bus');
  }

  async onModuleDestroy() {
    await this.receiver.close();
    await this.client.close();
    this.logger.log('Service Bus consumer connection closed');
  }
}
```

### 6. Update Module

**apps/backend/src/rabbitmq/rabbitmq.module.ts** → **servicebus/servicebus.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceBusService } from './servicebus.service';
import { TaskConsumerService } from './task-consumer.service';
import { TasksModule } from '../tasks/tasks.module';
import { OpenaiModule } from '../openai/openai.module';
import servicebusConfig from '../config/servicebus.config';

@Module({
  imports: [
    ConfigModule.forFeature(servicebusConfig),
    TasksModule,
    OpenaiModule,
  ],
  providers: [ServiceBusService, TaskConsumerService],
  exports: [ServiceBusService],
})
export class ServiceBusModule {}
```

### 7. Update App Module

**apps/backend/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { ServiceBusModule } from './servicebus/servicebus.module'; // Changed
import { OpenaiModule } from './openai/openai.module';
import databaseConfig from './config/database.config';
import servicebusConfig from './config/servicebus.config'; // Changed

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, servicebusConfig], // Changed
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'llm_workflow',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Set to false in production
      }),
    }),
    TasksModule,
    ServiceBusModule, // Changed
    OpenaiModule,
  ],
})
export class AppModule {}
```

## Testing Locally with Azure Service Bus

You can test with Azure Service Bus locally:

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

## Alternative: Use Both (Environment-Based)

You can support both RabbitMQ (local) and Azure Service Bus (production):

### Message Queue Factory

**apps/backend/src/queue/queue.module.ts**

```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'QUEUE_SERVICE',
          useFactory: async (configService: ConfigService) => {
            const queueType = configService.get('QUEUE_TYPE', 'rabbitmq');
            
            if (queueType === 'servicebus') {
              const { ServiceBusService } = await import('../servicebus/servicebus.service');
              return new ServiceBusService(configService);
            } else {
              const { RabbitMQService } = await import('../rabbitmq/rabbitmq.service');
              return new RabbitMQService(configService);
            }
          },
          inject: [ConfigService],
        },
      ],
      exports: ['QUEUE_SERVICE'],
    };
  }
}
```

### Environment Configuration

**Local (.env):**
```env
QUEUE_TYPE=rabbitmq
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=ai_tasks
```

**Azure (App Settings):**
```env
QUEUE_TYPE=servicebus
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

- [ ] Install `@azure/service-bus` package
- [ ] Create Azure Service Bus namespace and queue
- [ ] Update environment variables
- [ ] Refactor RabbitMQ service to Service Bus service
- [ ] Update task consumer for Service Bus
- [ ] Update module imports
- [ ] Test locally with Azure Service Bus
- [ ] Update deployment documentation
- [ ] Deploy to Azure
- [ ] Verify message processing
- [ ] Set up monitoring and alerts

## Rollback Plan

If issues occur, you can quickly switch back to RabbitMQ:

1. Change `QUEUE_TYPE=rabbitmq` in environment
2. Ensure RabbitMQ containers are running
3. Restart the application

## Additional Resources

- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)
- [Azure Service Bus SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus)
- [Migrating from RabbitMQ to Azure Service Bus](https://docs.microsoft.com/azure/service-bus-messaging/service-bus-migrate-from-rabbitmq)

---

**Note**: The ARM template in this repository already configures Azure Service Bus. This guide is for adapting the application code to use it.
