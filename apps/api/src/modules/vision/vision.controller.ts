import { Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { VisionService } from './vision.service';

type VisionUploadFile = {
  originalname?: string;
  mimetype?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('vision')
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  analyze(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: VisionUploadFile,
    @Body('hint') hint?: string,
  ) {
    return this.visionService.analyze(user.id, file, hint);
  }

  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.visionService.getHistory(user.id);
  }
}
