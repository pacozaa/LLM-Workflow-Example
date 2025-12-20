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

      // Update task with error
      await this.taskRepository.update(taskId, {
        status: TaskStatus.FAILED,
        error: error.message || 'Unknown error',
      });
    }
  }
}
