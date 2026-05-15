import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PublicIntegrationsController } from './public-integrations.controller';

@Module({
  controllers: [IntegrationsController, PublicIntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
