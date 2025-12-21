import { registerAs } from '@nestjs/config';

export default registerAs('servicebus', () => ({
  connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
  queueName: process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'ai-tasks',
}));
