import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private rabbitmqService: RabbitmqService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Create task in database
    const task = this.taskRepository.create({
      userInput: createTaskDto.userInput,
      status: TaskStatus.PENDING,
    });

    const savedTask = await this.taskRepository.save(task);

    // Publish to RabbitMQ for async processing
    await this.rabbitmqService.publishTask(savedTask.id, savedTask.userInput);

    return savedTask;
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }
}
