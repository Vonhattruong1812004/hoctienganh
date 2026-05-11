import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateStudentSupportDto } from './dto/create-student-support.dto';
import { UpdateStudentSupportStatusDto } from './dto/update-student-support-status.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Get('summary')
  getSummary() {
    return this.usersService.getSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Get('students')
  getStudents() {
    return this.usersService.getStudents();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Get('students/support-suggestions')
  getStudentSupportSuggestions() {
    return this.usersService.getStudentSupportSuggestions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Post('students/:studentId/support')
  createStudentSupport(
    @Param('studentId') studentId: string,
    @Body() dto: CreateStudentSupportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.createStudentSupport(studentId, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GiaoVien', 'QuanTriVien')
  @Patch('students/support-suggestions/:suggestionId/status')
  updateStudentSupportStatus(
    @Param('suggestionId') suggestionId: string,
    @Body() dto: UpdateStudentSupportStatusDto,
  ) {
    return this.usersService.updateStudentSupportStatus(suggestionId, dto);
  }
}
