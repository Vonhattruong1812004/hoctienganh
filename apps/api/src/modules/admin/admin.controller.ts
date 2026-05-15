import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { AdminService } from './admin.service';
import { CreateAdminAuditLogDto } from './dto/create-admin-audit-log.dto';

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('QuanTriVien')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getSystemOverview() {
    return this.adminService.getSystemOverview();
  }

  @Post('audit-log')
  createAuditLog(@Body() dto: CreateAdminAuditLogDto, @CurrentUser() user: AuthUser) {
    return this.adminService.createAuditLog(dto, user);
  }
}
