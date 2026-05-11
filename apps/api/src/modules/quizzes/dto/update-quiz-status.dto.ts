import { IsIn } from 'class-validator';

export class UpdateQuizStatusDto {
  @IsIn(['Nhap', 'CongBo', 'An'])
  status!: 'Nhap' | 'CongBo' | 'An';
}
