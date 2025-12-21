import { Module } from '@nestjs/common';
import { ServicebusService } from './servicebus.service';

@Module({
  providers: [ServicebusService],
  exports: [ServicebusService],
})
export class ServicebusModule {}
