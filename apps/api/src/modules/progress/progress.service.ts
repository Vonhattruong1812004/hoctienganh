import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStudent(studentId: string, currentUser: AuthUser) {
    await this.ensureCanViewStudentProgress(studentId, currentUser);

    return this.prisma.$queryRaw`
      SELECT
        tt."maTienTrinh" AS id,
        tt."trangThai" AS status,
        tt."phanTramHoanThanh" AS "percentComplete",
        tt."diemCaoNhat" AS "bestScore",
        tt."ngayBatDau" AS "startedAt",
        tt."ngayHoanThanh" AS "completedAt",
        bh."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        bh."thuTu" AS "lessonOrder",
        bh."diemDatYeuCau" AS "passingScore",
        gd."maGiaiDoan" AS "stageId",
        gd."tenGiaiDoan" AS "stageName",
        gd."loaiGiaiDoan" AS "stageType",
        gd."thuTu" AS "stageOrder",
        lt."tenLoTrinh" AS "pathName"
      FROM tientrinhhoctap tt
      JOIN baihoc bh ON bh."maBaiHoc" = tt."maBaiHoc"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      WHERE tt."maHocVien" = ${studentId}::uuid
      ORDER BY COALESCE(gd."thuTu", 0), bh."thuTu"
    `;
  }

  private async ensureCanViewStudentProgress(studentId: string, currentUser: AuthUser) {
    if (currentUser.id === studentId) {
      return;
    }

    if (currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien')) {
      return;
    }

    if (currentUser.roles.includes('PhuHuynh')) {
      const links = await this.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
          FROM lienket_phuhuynh_hocvien
          WHERE "maPhuHuynh" = ${currentUser.id}::uuid
            AND "maHocVien" = ${studentId}::uuid
            AND "trangThai" = 'DaChapNhan'
        ) AS exists
      `;

      if (links[0]?.exists) {
        return;
      }
    }

    throw new ForbiddenException('Bạn không có quyền xem tiến trình của học viên này.');
  }
}
