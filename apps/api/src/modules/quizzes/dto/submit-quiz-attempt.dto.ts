import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SubmitQuizAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsOptional()
  @IsString()
  answerId?: string;

  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers!: SubmitQuizAnswerDto[];
}
