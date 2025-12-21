import { registerAs } from '@nestjs/config';

export default registerAs('servicebus', () => ({
  connectionString:
    process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ||
    process.env.RABBITMQ_URL ||
    'amqp://guest:guest@localhost:5672',
  queueName:
    process.env.AZURE_SERVICE_BUS_QUEUE_NAME ||
    process.env.RABBITMQ_QUEUE ||
    'ai-tasks',
}));
