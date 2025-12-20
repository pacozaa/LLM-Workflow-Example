import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { RabbitmqService } from './rabbitmq.service';
import { OpenAiService } from '../openai/openai.service';
import { ConsumeMessage } from 'amqplib';

@Injectable()
export class TaskConsumerService implements OnModuleInit {
  private readonly logger = new Logger(TaskConsumerService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private rabbitmqService: RabbitmqService,
    private openaiService: OpenAiService,
  ) {}

  async onModuleInit() {
    await this.startConsuming();
  }

  private async startConsuming() {
    const channelWrapper = this.rabbitmqService.getChannelWrapper();
    const queueName = this.rabbitmqService.getQueueName();

    await channelWrapper.addSetup(async (channel) => {
      await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await this.processTask(content.taskId, content.userInput);
            channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message', error);
            channel.nack(msg, false, false); // Don't requeue failed messages
          }
        }
      });
    });

    this.logger.log('Started consuming messages from queue');
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
}
