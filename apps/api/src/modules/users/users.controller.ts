import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { CreateStudentSupportDto } from './dto/create-student-support.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';
import { UpdateStudentSupportStatusDto } from './dto/update-student-support-status.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
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
  @Roles('QuanTriVien')
  @Get('admin/accounts')
  getAdminAccounts() {
    return this.usersService.getAdminAccounts();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('QuanTriVien')
  @Get('admin/accounts/audit')
  getAdminAccountAudit() {
    return this.usersService.getAdminAccountAudit();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('QuanTriVien')
  @Post('admin/accounts')
  createAdminAccount(@Body() dto: CreateAdminAccountDto, @CurrentUser() user: AuthUser) {
    return this.usersService.createAdminAccount(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('QuanTriVien')
  @Patch('admin/accounts/:userId')
  updateAdminAccount(
    @Param('userId') userId: string,
    @Body() dto: UpdateAdminAccountDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateAdminAccount(userId, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('QuanTriVien')
  @Patch('admin/accounts/:userId/status')
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateUserStatus(userId, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('QuanTriVien')
  @Patch('admin/accounts/:userId/roles')
  updateUserRoles(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRolesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateUserRoles(userId, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('QuanTriVien')
  @Delete('admin/accounts/:userId')
  deleteAdminAccount(@Param('userId') userId: string, @CurrentUser() user: AuthUser) {
    return this.usersService.deleteAdminAccount(userId, user);
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
