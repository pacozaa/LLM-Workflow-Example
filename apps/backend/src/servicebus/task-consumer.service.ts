import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ProcessErrorArgs,
} from '@azure/service-bus';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { OpenAiService } from '../openai/openai.service';

@Injectable()
export class TaskConsumerService implements OnModuleInit {
  private readonly logger = new Logger(TaskConsumerService.name);
  private client: ServiceBusClient;
  private receiver: ServiceBusReceiver;
  private readonly queueName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private openaiService: OpenAiService,
  ) {
    this.queueName = this.configService.get<string>('servicebus.queueName');
  }

  async onModuleInit() {
    const connectionString = this.configService.get<string>(
      'servicebus.connectionString',
    );

    this.client = new ServiceBusClient(connectionString);
    this.receiver = this.client.createReceiver(this.queueName);

    await this.startConsuming();
    this.logger.log('Task consumer initialized');
  }

  private async startConsuming() {
    const processMessage = async (message) => {
      try {
        const taskData = message.body;
        this.logger.log(`Processing task ${taskData.taskId}`);

        await this.processTask(taskData.taskId, taskData.userInput);
      } catch (error) {
        this.logger.error(`Error processing message`, error);
        // Message will be abandoned and go to dead letter queue after max delivery attempts
        throw error;
      }
    };

    const processError = async (args: ProcessErrorArgs) => {
      this.logger.error(
        `Error from source ${args.errorSource}: ${args.error}`,
      );
    };

    this.receiver.subscribe({
      processMessage,
      processError,
    });

    this.logger.log('Started consuming messages from Service Bus');
  }

  private async processTask(taskId: string, userInput: string) {
    this.logger.log(`Processing task ${taskId}`);

    try {
      // Update task status to processing
      await this.taskRepository.update(taskId, {
        status: TaskStatus.PROCESSING,
      });

      // Process with OpenAI
      const aiResult = await this.openaiService.processInput(userInput);

      // Update task with result
      await this.taskRepository.update(taskId, {
        status: TaskStatus.COMPLETED,
        aiResult,
      });

      this.logger.log(`Task ${taskId} completed successfully`);
    } catch (error) {
      this.logger.error(`Task ${taskId} failed`, error);

      // Sanitize error message for database storage
      const sanitizedError = this.sanitizeError(error);

      // Update task with error
      await this.taskRepository.update(taskId, {
        status: TaskStatus.FAILED,
        error: sanitizedError,
      });
    }
  }

  private sanitizeError(error: any): string {
    // Remove sensitive information from error messages
    if (error?.response?.data?.error) {
      // OpenAI API errors
      return `AI service error: ${error.response.data.error.type || 'unknown'}`;
    }
    if (error?.message) {
      // Generic errors - remove stack traces and sensitive data
      const message = error.message.toString();
      // Remove potential API keys or tokens from error messages
      return message.replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]');
    }
    return 'An unexpected error occurred during processing';
  }

  async onModuleDestroy() {
    await this.receiver.close();
    await this.client.close();
    this.logger.log('Service Bus consumer connection closed');
  }
}
