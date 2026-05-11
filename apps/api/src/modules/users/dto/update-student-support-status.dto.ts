import { IsIn } from 'class-validator';

export class UpdateStudentSupportStatusDto {
  @IsIn(['ChuaXem', 'DaXem', 'HoanThanh'])
  status!: 'ChuaXem' | 'DaXem' | 'HoanThanh';
}
