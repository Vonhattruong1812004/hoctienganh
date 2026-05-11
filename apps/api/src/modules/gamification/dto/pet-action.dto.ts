import { IsIn } from 'class-validator';

export class PetActionDto {
  @IsIn(['Feed', 'Play', 'Study', 'Rest'])
  action!: 'Feed' | 'Play' | 'Study' | 'Rest';
}
