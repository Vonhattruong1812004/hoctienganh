import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async findTeacherLearningControl(currentUser: AuthUser) {
    if (!currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien')) {
      throw new ForbiddenException('Bạn không có quyền xem bảng kiểm soát học tập của giáo viên.');
    }

    const [students, logs, alerts] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT
          nd."maNguoiDung" AS id,
          nd."hoTen" AS "fullName",
          nd.email AS email,
          hshv."trinhDoHienTai" AS "currentLevel",
          hshv."mucTieuHocTap" AS "learningGoal",
          COALESCE(hshv."tongDiem", 0)::int AS "totalPoints",
          COALESCE(hshv."chuoiNgayHoc", 0)::int AS "learningStreak",
          COALESCE(progress_summary."completedLessons", 0)::int AS "completedLessons",
          COALESCE(progress_summary."activeLessons", 0)::int AS "activeLessons",
          COALESCE(progress_summary."lockedLessons", 0)::int AS "lockedLessons",
          COALESCE(progress_summary."totalLessons", 0)::int AS "totalLessons",
          ROUND(COALESCE(progress_summary."averageProgress", 0))::int AS "averageProgress",
          COALESCE(quiz_summary."attemptsCount", 0)::int AS "attemptsCount",
          COALESCE(quiz_summary."passedAttemptsCount", 0)::int AS "passedAttemptsCount",
          COALESCE(quiz_summary."bestScore", 0)::float AS "bestQuizScore",
          quiz_summary."latestAttemptAt" AS "latestAttemptAt",
          COALESCE(parent_links."linkedParentsCount", 0)::int AS "linkedParentsCount"
        FROM nguoidung nd
        JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
        JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
        LEFT JOIN hosohocvien hshv ON hshv."maNguoiDung" = nd."maNguoiDung"
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS "totalLessons",
            COUNT(*) FILTER (WHERE tt."trangThai" = 'HoanThanh')::int AS "completedLessons",
            COUNT(*) FILTER (WHERE tt."trangThai" = 'DangHoc')::int AS "activeLessons",
            COUNT(*) FILTER (WHERE tt."trangThai" = 'BiKhoa')::int AS "lockedLessons",
            ROUND(COALESCE(AVG(tt."phanTramHoanThanh"), 0), 0)::float AS "averageProgress"
          FROM tientrinhhoctap tt
          WHERE tt."maHocVien" = nd."maNguoiDung"
        ) progress_summary ON TRUE
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS "attemptsCount",
            COUNT(*) FILTER (WHERE llb."trangThai" = 'Dat')::int AS "passedAttemptsCount",
            COALESCE(MAX(llb."phanTramDung"), 0)::float AS "bestScore",
            MAX(llb."thoiGianNopBai") AS "latestAttemptAt"
          FROM lanlambai llb
          WHERE llb."maHocVien" = nd."maNguoiDung"
        ) quiz_summary ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS "linkedParentsCount"
          FROM lienket_phuhuynh_hocvien lk
          WHERE lk."maHocVien" = nd."maNguoiDung"
            AND lk."trangThai" = 'DaChapNhan'
        ) parent_links ON TRUE
        WHERE vt."tenVaiTro" = 'HocVien'
        ORDER BY
          progress_summary."averageProgress" ASC NULLS LAST,
          quiz_summary."bestScore" ASC NULLS LAST,
          nd."hoTen" ASC
      `,
      this.prisma.$queryRaw`
        WITH students AS (
          SELECT
            nd."maNguoiDung" AS "studentId",
            nd."hoTen"::text AS "studentName",
            nd.email::text AS "studentEmail"
          FROM nguoidung nd
          JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
          JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
          WHERE vt."tenVaiTro" = 'HocVien'
        ),
        audit_events AS (
          SELECT
            tt."maTienTrinh"::text AS id,
            s."studentId",
            s."studentName",
            s."studentEmail",
            'BaiHoc'::text AS "eventGroup",
            'CapNhatTienTrinh'::text AS "eventType",
            CONCAT('Bài học: ', bh."tieuDe")::text AS title,
            CONCAT('Trạng thái ', tt."trangThai", ', hoàn thành ', ROUND(tt."phanTramHoanThanh"), '%.')::text AS description,
            'BaiHoc'::text AS "targetType",
            bh."maBaiHoc"::text AS "targetId",
            tt."trangThai"::text AS status,
            tt."phanTramHoanThanh"::double precision AS progress,
            tt."diemCaoNhat"::double precision AS score,
            COALESCE(tt."ngayHoanThanh", tt."ngayCapNhat", tt."ngayBatDau") AS "occurredAt"
          FROM tientrinhhoctap tt
          JOIN students s ON s."studentId" = tt."maHocVien"
          JOIN baihoc bh ON bh."maBaiHoc" = tt."maBaiHoc"

          UNION ALL

          SELECT
            llb."maLanLam"::text AS id,
            s."studentId",
            s."studentName",
            s."studentEmail",
            'Quiz'::text AS "eventGroup",
            'LamKiemTra'::text AS "eventType",
            CONCAT('Quiz: ', bkt."tieuDe")::text AS title,
            CONCAT('Lần ', llb."lanThu", ', đúng ', llb."soCauDung", ', sai ', llb."soCauSai", ', đạt ', ROUND(llb."phanTramDung"), '%.')::text AS description,
            'BaiKiemTra'::text AS "targetType",
            bkt."maBaiKiemTra"::text AS "targetId",
            llb."trangThai"::text AS status,
            llb."phanTramDung"::double precision AS progress,
            llb."diemSo"::double precision AS score,
            COALESCE(llb."thoiGianNopBai", llb."thoiGianBatDau") AS "occurredAt"
          FROM lanlambai llb
          JOIN students s ON s."studentId" = llb."maHocVien"
          JOIN baikiemtra bkt ON bkt."maBaiKiemTra" = llb."maBaiKiemTra"

          UNION ALL

          SELECT
            gy."maGoiY"::text AS id,
            s."studentId",
            s."studentName",
            s."studentEmail",
            'CanhBao'::text AS "eventGroup",
            'GoiYOnTap'::text AS "eventType",
            COALESCE(CONCAT('Cảnh báo ôn tập: ', bh."tieuDe"), 'Cảnh báo ôn tập')::text AS title,
            gy."lyDo"::text AS description,
            'GoiYOnTap'::text AS "targetType",
            gy."maGoiY"::text AS "targetId",
            gy."trangThai"::text AS status,
            NULL::double precision AS progress,
            gy."mucDoUuTien"::double precision AS score,
            gy."ngayTao" AS "occurredAt"
          FROM goiyontap gy
          JOIN students s ON s."studentId" = gy."maHocVien"
          LEFT JOIN baihoc bh ON bh."maBaiHoc" = gy."maBaiHoc"

          UNION ALL

          SELECT
            lc."maLanChoi"::text AS id,
            s."studentId",
            s."studentName",
            s."studentEmail",
            'TroChoi'::text AS "eventGroup",
            'ChoiMiniGame'::text AS "eventType",
            CONCAT('Game: ', mg."tenMiniGame")::text AS title,
            CONCAT('Điểm ', lc."diemSo", ', ', lc."soSao", ' sao, trạng thái ', lc."ketQua", '.')::text AS description,
            'MiniGame'::text AS "targetType",
            mg."maMiniGame"::text AS "targetId",
            lc."ketQua"::text AS status,
            NULL::double precision AS progress,
            lc."diemSo"::double precision AS score,
            lc."ngayChoi" AS "occurredAt"
          FROM lanchoigame lc
          JOIN students s ON s."studentId" = lc."maNguoiDung"
          JOIN minigame mg ON mg."maMiniGame" = lc."maMiniGame"

          UNION ALL

          SELECT
            pt."maPhanTich"::text AS id,
            s."studentId",
            s."studentName",
            s."studentEmail",
            'AI'::text AS "eventGroup",
            'PhanTichAnhAI'::text AS "eventType",
            CONCAT('AI Vision: ', pt."tuKhoaNhanRa")::text AS title,
            CONCAT('Từ ', pt."tuKhoaNhanRa", ' - ', pt."nghiaTiengViet", ', tin cậy ', ROUND(pt."doTinCay"), '%.')::text AS description,
            'PhanTichHinhAnh'::text AS "targetType",
            pt."maPhanTich"::text AS "targetId",
            pt."nguonNhanDang"::text AS status,
            pt."doTinCay"::double precision AS progress,
            pt."doTinCay"::double precision AS score,
            pt."ngayPhanTich" AS "occurredAt"
          FROM phantichhinhanh pt
          JOIN students s ON s."studentId" = pt."maNguoiDung"

          UNION ALL

          SELECT
            tb."maThongBao"::text AS id,
            s."studentId",
            s."studentName",
            s."studentEmail",
            'ThongBao'::text AS "eventGroup",
            'ThongBaoHocTap'::text AS "eventType",
            tb."tieuDe"::text AS title,
            tb."noiDung"::text AS description,
            'ThongBao'::text AS "targetType",
            tb."maThongBao"::text AS "targetId",
            CASE WHEN tb."daDoc" THEN 'DaDoc' ELSE 'ChuaDoc' END::text AS status,
            NULL::double precision AS progress,
            NULL::double precision AS score,
            tb."ngayGui" AS "occurredAt"
          FROM thongbao tb
          JOIN students s ON s."studentId" = tb."maNguoiDung"
        )
        SELECT *
        FROM audit_events
        WHERE "occurredAt" IS NOT NULL
        ORDER BY "occurredAt" DESC
        LIMIT 220
      `,
      this.prisma.$queryRaw`
        SELECT
          gy."maGoiY" AS id,
          nd."maNguoiDung" AS "studentId",
          nd."hoTen" AS "studentName",
          nd.email AS "studentEmail",
          gy."lyDo" AS reason,
          gy."mucDoUuTien"::int AS priority,
          gy."trangThai" AS status,
          gy."ngayTao" AS "createdAt",
          bh."maBaiHoc" AS "lessonId",
          bh."tieuDe" AS "lessonTitle",
          COALESCE(tt."phanTramHoanThanh", 0)::float AS "lessonProgress",
          COALESCE(tt."diemCaoNhat", 0)::float AS "bestScore"
        FROM goiyontap gy
        JOIN nguoidung nd ON nd."maNguoiDung" = gy."maHocVien"
        LEFT JOIN baihoc bh ON bh."maBaiHoc" = gy."maBaiHoc"
        LEFT JOIN tientrinhhoctap tt
          ON tt."maHocVien" = gy."maHocVien"
         AND tt."maBaiHoc" = gy."maBaiHoc"
        ORDER BY gy."mucDoUuTien" ASC, gy."ngayTao" DESC
        LIMIT 60
      `,
    ]);

    return { students, logs, alerts };
  }

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
