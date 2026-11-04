import { Controller, Get, Header, Res } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import { Response } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getSpendingAnalytics(user.userId);
  }

  @Get('export/csv')
  async exportCsv(
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response
  ) {
    const csvData = await this.analyticsService.exportExpensesCsv(user.userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="matrixsplit-expenses.csv"');
    res.send(csvData);
  }
}
