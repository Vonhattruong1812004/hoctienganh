import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateQuizDto {
  @IsUUID()
  lessonId!: string;

  @IsString()
  @Length(5, 255)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  description?: string;

  @IsIn(['LuyenTap', 'CuoiBai', 'CuoiNgay'])
  type!: 'LuyenTap' | 'CuoiBai' | 'CuoiNgay';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxAttempts?: number;

  @IsOptional()
  @IsIn(['Nhap', 'CongBo', 'An'])
  status?: 'Nhap' | 'CongBo' | 'An';
}
