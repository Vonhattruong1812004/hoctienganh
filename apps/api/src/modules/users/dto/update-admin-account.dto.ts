import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsIn(['Nam', 'Nu', 'Khac'])
  gender?: 'Nam' | 'Nu' | 'Khac' | null;

  @IsOptional()
  @IsIn(['HoatDong', 'BiKhoa', 'NgungHoatDong'])
  status?: 'HoatDong' | 'BiKhoa' | 'NgungHoatDong';
}
