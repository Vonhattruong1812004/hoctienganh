import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @IsIn(['HoatDong', 'BiKhoa', 'NgungHoatDong'])
  status!: 'HoatDong' | 'BiKhoa' | 'NgungHoatDong';
}
