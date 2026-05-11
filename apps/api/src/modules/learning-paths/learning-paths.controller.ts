import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathStatusDto } from './dto/update-learning-path-status.dto';
import { LearningPathsService } from './learning-paths.service';

@UseGuards(JwtAuthGuard)
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Get()
  findPublished() {
    return this.learningPathsService.findPublished();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Get('manage')
  findManagement() {
    return this.learningPathsService.findManagement();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Post()
  create(@Body() dto: CreateLearningPathDto, @CurrentUser() user: AuthUser) {
    return this.learningPathsService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLearningPathStatusDto) {
    return this.learningPathsService.updateStatus(id, dto);
  }

  @Get(':id')
  findDetail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.learningPathsService.findDetail(id, user);
  }
}
