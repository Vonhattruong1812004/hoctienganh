import { ArrayNotEmpty, IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { AuthRole } from '../../auth/auth.types';

export class CreateAdminAccountDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsIn(['Nam', 'Nu', 'Khac'])
  gender?: 'Nam' | 'Nu' | 'Khac' | null;

  @IsOptional()
  @IsIn(['HoatDong', 'BiKhoa', 'NgungHoatDong'])
  status?: 'HoatDong' | 'BiKhoa' | 'NgungHoatDong';

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['HocVien', 'PhuHuynh', 'GiaoVien', 'QuanTriVien'], { each: true })
  roles!: AuthRole[];
}
