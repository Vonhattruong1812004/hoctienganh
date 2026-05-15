import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExploreContentQueryDto } from './dto/explore-content.query';
import { IntegrationsService } from './integrations.service';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('sources')
  sources() {
    return this.integrationsService.getSources();
  }

  @Get('explore')
  explore(@CurrentUser() user: AuthUser, @Query() query: ExploreContentQueryDto) {
    return this.integrationsService.explore(user.id, query);
  }
}
