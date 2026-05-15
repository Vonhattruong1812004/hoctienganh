import { Controller, Get, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class PublicIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('zoo-assets')
  zooAssets(@Query('limit') limit?: string) {
    return this.integrationsService.getZooAssets(Number(limit ?? 10));
  }
}
