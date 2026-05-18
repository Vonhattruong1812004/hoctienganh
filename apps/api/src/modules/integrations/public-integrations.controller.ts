import { Controller, Get, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class PublicIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('zoo-assets')
  zooAssets(@Query('limit') limit?: string) {
    return this.integrationsService.getZooAssets(Number(limit ?? 10));
  }

  @Get('images')
  images(@Query('query') query?: string, @Query('limit') limit?: string) {
    return this.integrationsService.getPublicImages(query ?? '', Number(limit ?? 6));
  }

  @Get('smart-images')
  smartImages(
    @Query('query') query?: string,
    @Query('meaning') meaning?: string,
    @Query('context') context?: string,
    @Query('limit') limit?: string,
  ) {
    return this.integrationsService.getSmartImages(query ?? '', meaning ?? '', context ?? '', Number(limit ?? 6));
  }
}
