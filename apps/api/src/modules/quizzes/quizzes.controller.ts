import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateQuizStatusDto } from './dto/update-quiz-status.dto';
import { QuizzesService } from './quizzes.service';

@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Get('manage')
  findManagement() {
    return this.quizzesService.findManagement();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Post()
  create(@Body() dto: CreateQuizDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuizStatusDto) {
    return this.quizzesService.updateStatus(id, dto);
  }

  @Get(':id')
  findDetail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.quizzesService.findDetail(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HocVien')
  @Post(':id/submit')
  submitAttempt(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    return this.quizzesService.submitAttempt(id, user.id, dto);
  }
}
