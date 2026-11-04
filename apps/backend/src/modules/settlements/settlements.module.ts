import { Module } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  controllers: [SettlementsController],
  providers: [SettlementsService, EventsGateway],
  exports: [SettlementsService],
})
export class SettlementsModule {}
