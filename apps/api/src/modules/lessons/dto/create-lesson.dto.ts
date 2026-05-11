import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateLessonDto {
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsString()
  @Length(5, 255)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(20, 5000)
  content?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  level?: string;

  @IsInt()
  @Min(1)
  orderIndex!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @IsIn(['Nhap', 'CongBo', 'An'])
  status?: 'Nhap' | 'CongBo' | 'An';
}
