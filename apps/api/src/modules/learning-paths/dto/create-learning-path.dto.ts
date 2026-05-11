import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateLearningPathDto {
  @IsString()
  @Length(5, 200)
  name!: string;

  @IsString()
  @Length(20, 1000)
  description!: string;

  @IsString()
  @Length(2, 50)
  level!: string;

  @IsString()
  @Length(3, 100)
  targetAudience!: string;

  @IsOptional()
  @IsIn(['Nhap', 'CongBo', 'LuuTru'])
  status?: 'Nhap' | 'CongBo' | 'LuuTru';
}
