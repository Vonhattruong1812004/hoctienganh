import { IsIn } from 'class-validator';

export class UpdateLearningPathStatusDto {
  @IsIn(['Nhap', 'CongBo', 'LuuTru'])
  status!: 'Nhap' | 'CongBo' | 'LuuTru';
}
