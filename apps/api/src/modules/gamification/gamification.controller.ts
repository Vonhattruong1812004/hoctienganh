import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PetActionDto } from './dto/pet-action.dto';
import { RecordGamePlayDto } from './dto/record-game-play.dto';
import { GamificationService } from './gamification.service';

@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.gamificationService.getDashboard(user.id);
  }

  @Post('me/pet/action')
  performPetAction(@CurrentUser() user: AuthUser, @Body() dto: PetActionDto) {
    return this.gamificationService.performPetAction(user.id, dto.action);
  }

  @Get('games')
  getGames(@CurrentUser() user: AuthUser) {
    return this.gamificationService.getGames(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HocVien')
  @Post('games/:id/play')
  recordGamePlay(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RecordGamePlayDto) {
    return this.gamificationService.recordGamePlay(user.id, id, dto);
  }

  @Get('quests')
  getQuests(@CurrentUser() user: AuthUser) {
    return this.gamificationService.getDailyQuests(user.id);
  }
}
