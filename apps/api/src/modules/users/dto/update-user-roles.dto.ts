import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';
import type { AuthRole } from '../../auth/auth.types';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['HocVien', 'PhuHuynh', 'GiaoVien', 'QuanTriVien'], { each: true })
  roles!: AuthRole[];
}
