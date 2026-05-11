import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonStatusDto } from './dto/update-lesson-status.dto';
import { LessonsService } from './lessons.service';

@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Get('manage')
  findManagement() {
    return this.lessonsService.findManagement();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Post()
  create(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLessonStatusDto) {
    return this.lessonsService.updateStatus(id, dto);
  }

  @Get(':id')
  findDetail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.lessonsService.findDetail(id, user);
  }

  @Post(':id/start')
  startLesson(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.lessonsService.startLesson(id, user);
  }

  @Post(':id/tasks/:taskId/complete')
  completeTask(@Param('id') id: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.lessonsService.completeTask(id, taskId, user);
  }
}
