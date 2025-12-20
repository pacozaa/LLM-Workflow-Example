import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly queueName: string;

  constructor(private configService: ConfigService) {
    this.queueName = this.configService.get<string>('rabbitmq.queue');
    this.initialize();
  }

  private initialize() {
    const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');

    this.connection = amqp.connect([rabbitmqUrl]);

    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.error('Disconnected from RabbitMQ', err);
    });

    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertQueue(this.queueName, {
          durable: true,
        });
      },
    });
  }

  async publishTask(taskId: string, userInput: string): Promise<void> {
    try {
      await this.channelWrapper.sendToQueue(
        this.queueName,
        {
          taskId,
          userInput,
        },
        {
          persistent: true,
        },
      );
      this.logger.log(`Task ${taskId} published to queue`);
    } catch (error) {
      this.logger.error('Error publishing task', error);
      throw error;
    }
  }

  getChannelWrapper(): ChannelWrapper {
    return this.channelWrapper;
  }

  getQueueName(): string {
    return this.queueName;
  }

  async onModuleDestroy() {
    await this.channelWrapper.close();
    await this.connection.close();
    this.logger.log('RabbitMQ connection closed');
  }
}
