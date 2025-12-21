import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { ServicebusService } from '../servicebus/servicebus.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private servicebusService: ServicebusService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Create task in database
    const task = this.taskRepository.create({
      userInput: createTaskDto.userInput,
      status: TaskStatus.PENDING,
    });

    const savedTask = await this.taskRepository.save(task);

    // Publish to Azure Service Bus for async processing
    await this.servicebusService.publishTask(
      savedTask.id,
      savedTask.userInput,
    );

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
