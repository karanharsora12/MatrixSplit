import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, EventsGateway],
  exports: [ExpensesService],
})
export class ExpensesModule {}
