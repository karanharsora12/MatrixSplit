import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
} from '@matrixsplit/shared';

@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async createExpense(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = CreateExpenseSchema.parse(body);
    return this.expensesService.createExpense(user.userId, validated);
  }

  @Get('recent')
  async getRecent(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string
  ) {
    return this.expensesService.getRecentExpenses(
      user.userId,
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Get('group/:groupId')
  async getGroupExpenses(
    @Param('groupId') groupId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.expensesService.getGroupExpenses(groupId, user.userId);
  }

  @Get(':id')
  async getExpense(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.expensesService.getExpenseById(id, user.userId);
  }

  @Patch(':id')
  async updateExpense(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = UpdateExpenseSchema.parse(body);
    return this.expensesService.updateExpense(id, user.userId, validated);
  }

  @Delete(':id')
  async deleteExpense(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.expensesService.deleteExpense(id, user.userId);
  }
}
