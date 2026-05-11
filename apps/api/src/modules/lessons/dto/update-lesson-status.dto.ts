import { IsIn } from 'class-validator';

export class UpdateLessonStatusDto {
  @IsIn(['Nhap', 'CongBo', 'An'])
  status!: 'Nhap' | 'CongBo' | 'An';
}
