import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { LearningPathsModule } from './modules/learning-paths/learning-paths.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ParentsModule } from './modules/parents/parents.module';
import { ProgressModule } from './modules/progress/progress.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { VisionModule } from './modules/vision/vision.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    HealthModule,
    AdminModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    LearningPathsModule,
    LessonsModule,
    GamificationModule,
    ParentsModule,
    QuizzesModule,
    ProgressModule,
    VisionModule,
  ],
})
export class AppModule {}
