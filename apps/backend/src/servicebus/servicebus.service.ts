import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';

@Injectable()
export class ServicebusService implements OnModuleDestroy {
  private readonly logger = new Logger(ServicebusService.name);
  private client: ServiceBusClient;
  private sender: ServiceBusSender;
  private readonly queueName: string;

  constructor(private configService: ConfigService) {
    this.queueName = this.configService.get<string>('servicebus.queueName');
    this.initialize();
  }

  private initialize() {
    const connectionString = this.configService.get<string>(
      'servicebus.connectionString',
    );

    this.client = new ServiceBusClient(connectionString);
    this.sender = this.client.createSender(this.queueName);

    this.logger.log('Azure Service Bus connection established');
  }

  async publishTask(taskId: string, userInput: string): Promise<void> {
    try {
      const message = {
        body: {
          taskId,
          userInput,
        },
        contentType: 'application/json',
      };

      await this.sender.sendMessages(message);
      this.logger.log(`Task ${taskId} published to queue`);
    } catch (error) {
      this.logger.error('Failed to publish task', error);
      throw error;
    }
  }

  getQueueName(): string {
    return this.queueName;
  }

  async onModuleDestroy() {
    await this.sender.close();
    await this.client.close();
    this.logger.log('Azure Service Bus connection closed');
  }
}
