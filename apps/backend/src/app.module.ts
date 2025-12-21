import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { ServicebusModule } from './servicebus/servicebus.module';
import { OpenAiModule } from './openai/openai.module';
import { TaskConsumerService } from './servicebus/task-consumer.service';
import databaseConfig from './config/database.config';
import servicebusConfig from './config/servicebus.config';
import openaiConfig from './config/openai.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, servicebusConfig, openaiConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    TasksModule,
    ServicebusModule,
    OpenAiModule,
  ],
  controllers: [AppController],
  providers: [AppService, TaskConsumerService],
})
export class AppModule {}
