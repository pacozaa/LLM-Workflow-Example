import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { OpenAiModule } from './openai/openai.module';
import { TaskConsumerService } from './rabbitmq/task-consumer.service';
import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';
import openaiConfig from './config/openai.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, rabbitmqConfig, openaiConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    TasksModule,
    RabbitmqModule,
    OpenAiModule,
  ],
  controllers: [AppController],
  providers: [AppService, TaskConsumerService],
})
export class AppModule {}
