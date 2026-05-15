import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateAdminAuditLogDto {
  @IsIn(['KIEM_TRA_HE_THONG', 'CAP_NHAT_CAU_HINH', 'TAO_CHECKPOINT', 'XEM_NHAT_KY'])
  action!: 'KIEM_TRA_HE_THONG' | 'CAP_NHAT_CAU_HINH' | 'TAO_CHECKPOINT' | 'XEM_NHAT_KY';

  @IsOptional()
  @IsString()
  @Length(4, 120)
  targetType?: string;

  @IsOptional()
  @IsString()
  @Length(10, 500)
  description?: string;
}
