import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RecordGamePlayDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  score!: number;

  @IsInt()
  @Min(0)
  @Max(3)
  @Type(() => Number)
  stars!: number;

  @IsOptional()
  @IsIn(['DangChoi', 'HoanThanh', 'DatKyLuc'])
  @IsString()
  result?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  durationSeconds?: number;
}
