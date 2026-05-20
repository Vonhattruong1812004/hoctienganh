import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { ProgressService } from './progress.service';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('teacher/learning-control')
  findTeacherLearningControl(@CurrentUser() user: AuthUser) {
    return this.progressService.findTeacherLearningControl(user);
  }

  @Get('students/:studentId')
  findByStudent(@Param('studentId') studentId: string, @CurrentUser() user: AuthUser) {
    return this.progressService.findByStudent(studentId, user);
  }
}
