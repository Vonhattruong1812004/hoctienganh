import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { ParentsService } from './parents.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PhuHuynh')
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me/students')
  findMyStudents(@CurrentUser() user: AuthUser) {
    return this.parentsService.findLinkedStudents(user.id);
  }

  @Get('me/quiz-results')
  findMyQuizResults(@CurrentUser() user: AuthUser) {
    return this.parentsService.findQuizResults(user.id);
  }

  @Get('me/review-suggestions')
  findMyReviewSuggestions(@CurrentUser() user: AuthUser) {
    return this.parentsService.findReviewSuggestions(user.id);
  }

  @Get('me/notifications')
  findMyNotifications(@CurrentUser() user: AuthUser) {
    return this.parentsService.findNotifications(user.id);
  }
}
