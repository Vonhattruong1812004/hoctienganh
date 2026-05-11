import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findLinkedStudents(parentId: string) {
    return this.prisma.$queryRaw`
      SELECT
        nd."maNguoiDung" AS id,
        nd."hoTen" AS "fullName",
        nd."email" AS email,
        lk."trangThai" AS "linkStatus",
        hshv."trinhDoHienTai" AS "currentLevel",
        hshv."mucTieuHocTap" AS "learningGoal",
        hshv."tongDiem" AS "totalPoints",
        hshv."chuoiNgayHoc" AS "learningStreak",
        COALESCE(COUNT(tt."maTienTrinh") FILTER (WHERE tt."trangThai" = 'HoanThanh'), 0)::int AS "completedLessons",
        COALESCE(COUNT(tt."maTienTrinh") FILTER (WHERE tt."trangThai" = 'DangHoc'), 0)::int AS "activeLessons",
        COALESCE(COUNT(tt."maTienTrinh") FILTER (WHERE tt."trangThai" = 'BiKhoa'), 0)::int AS "lockedLessons",
        ROUND(COALESCE(AVG(tt."phanTramHoanThanh"), 0))::int AS "averageProgress"
      FROM lienket_phuhuynh_hocvien lk
      JOIN nguoidung nd ON nd."maNguoiDung" = lk."maHocVien"
      LEFT JOIN hosohocvien hshv ON hshv."maNguoiDung" = nd."maNguoiDung"
      LEFT JOIN tientrinhhoctap tt ON tt."maHocVien" = nd."maNguoiDung"
      WHERE lk."maPhuHuynh" = ${parentId}::uuid
        AND lk."trangThai" = 'DaChapNhan'
      GROUP BY
        nd."maNguoiDung",
        nd."hoTen",
        nd."email",
        lk."trangThai",
        hshv."trinhDoHienTai",
        hshv."mucTieuHocTap",
        hshv."tongDiem",
        hshv."chuoiNgayHoc"
      ORDER BY nd."hoTen";
    `;
  }

  async findQuizResults(parentId: string) {
    return this.prisma.$queryRaw`
      SELECT
        llb."maLanLam" AS id,
        nd."maNguoiDung" AS "studentId",
        nd."hoTen" AS "studentName",
        nd."email" AS "studentEmail",
        bkt."maBaiKiemTra" AS "quizId",
        bkt."tieuDe" AS "quizTitle",
        bkt."loaiBaiKiemTra" AS "quizType",
        bkt."diemDatYeuCau"::float AS "passingScore",
        bkt."thoiGianLamBai" AS "durationMinutes",
        llb."lanThu" AS "attemptNumber",
        llb."diemSo"::float AS score,
        llb."phanTramDung"::float AS percentage,
        llb."soCauDung" AS "correctCount",
        llb."soCauSai" AS "wrongCount",
        llb."trangThai" AS status,
        (llb."phanTramDung" >= bkt."diemDatYeuCau") AS passed,
        llb."thoiGianBatDau" AS "startedAt",
        llb."thoiGianNopBai" AS "submittedAt",
        bh."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        gd."tenGiaiDoan" AS "stageName",
        lt."tenLoTrinh" AS "pathName"
      FROM lienket_phuhuynh_hocvien lk
      JOIN nguoidung nd ON nd."maNguoiDung" = lk."maHocVien"
      JOIN lanlambai llb ON llb."maHocVien" = lk."maHocVien"
      JOIN baikiemtra bkt ON bkt."maBaiKiemTra" = llb."maBaiKiemTra"
      JOIN baihoc bh ON bh."maBaiHoc" = bkt."maBaiHoc"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      WHERE lk."maPhuHuynh" = ${parentId}::uuid
        AND lk."trangThai" = 'DaChapNhan'
      ORDER BY
        llb."thoiGianNopBai" DESC NULLS LAST,
        llb."thoiGianBatDau" DESC,
        nd."hoTen";
    `;
  }

  async findReviewSuggestions(parentId: string) {
    return this.prisma.$queryRaw`
      WITH latest_attempt AS (
        SELECT DISTINCT ON (llb."maHocVien", bkt."maBaiHoc")
          llb."maHocVien",
          bkt."maBaiHoc",
          bkt."tieuDe" AS "quizTitle",
          llb."phanTramDung"::float AS percentage,
          llb."trangThai" AS status,
          llb."thoiGianNopBai" AS "submittedAt"
        FROM lanlambai llb
        JOIN baikiemtra bkt ON bkt."maBaiKiemTra" = llb."maBaiKiemTra"
        ORDER BY
          llb."maHocVien",
          bkt."maBaiHoc",
          llb."thoiGianNopBai" DESC NULLS LAST,
          llb."thoiGianBatDau" DESC
      )
      SELECT
        gy."maGoiY" AS id,
        nd."maNguoiDung" AS "studentId",
        nd."hoTen" AS "studentName",
        nd."email" AS "studentEmail",
        gy."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        cd."tenChuDe" AS "topicName",
        lt."tenLoTrinh" AS "pathName",
        gd."tenGiaiDoan" AS "stageName",
        gy."lyDo" AS reason,
        gy."mucDoUuTien" AS priority,
        gy."trangThai" AS status,
        gy."ngayTao" AS "createdAt",
        COALESCE(tt."trangThai", 'ChuaHoc') AS "lessonStatus",
        COALESCE(tt."phanTramHoanThanh", 0)::float AS "lessonProgress",
        COALESCE(tt."diemCaoNhat", 0)::float AS "bestScore",
        latest_attempt."quizTitle" AS "latestQuizTitle",
        latest_attempt.percentage AS "latestQuizPercentage",
        latest_attempt.status AS "latestQuizStatus",
        latest_attempt."submittedAt" AS "latestQuizSubmittedAt"
      FROM lienket_phuhuynh_hocvien lk
      JOIN nguoidung nd ON nd."maNguoiDung" = lk."maHocVien"
      JOIN goiyontap gy ON gy."maHocVien" = lk."maHocVien"
      LEFT JOIN baihoc bh ON bh."maBaiHoc" = gy."maBaiHoc"
      LEFT JOIN chudehoc cd ON cd."maChuDe" = COALESCE(gy."maChuDe", bh."maChuDe")
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN tientrinhhoctap tt
        ON tt."maHocVien" = nd."maNguoiDung"
       AND tt."maBaiHoc" = gy."maBaiHoc"
      LEFT JOIN latest_attempt
        ON latest_attempt."maHocVien" = nd."maNguoiDung"
       AND latest_attempt."maBaiHoc" = gy."maBaiHoc"
      WHERE lk."maPhuHuynh" = ${parentId}::uuid
        AND lk."trangThai" = 'DaChapNhan'
      ORDER BY
        gy."mucDoUuTien" ASC,
        gy."ngayTao" DESC,
        nd."hoTen";
    `;
  }

  async findNotifications(parentId: string) {
    return this.prisma.$queryRaw`
      WITH linked_students AS (
        SELECT lk."maHocVien"
        FROM lienket_phuhuynh_hocvien lk
        WHERE lk."maPhuHuynh" = ${parentId}::uuid
          AND lk."trangThai" = 'DaChapNhan'
      )
      SELECT
        tb."maThongBao" AS id,
        tb."maNguoiDung" AS "recipientId",
        nd."hoTen" AS "recipientName",
        nd."email" AS "recipientEmail",
        CASE
          WHEN tb."maNguoiDung" = ${parentId}::uuid THEN 'PhuHuynh'
          ELSE 'HocVien'
        END AS "recipientKind",
        tb."tieuDe" AS title,
        tb."noiDung" AS content,
        tb."loaiThongBao" AS type,
        tb."daDoc" AS "isRead",
        tb."ngayGui" AS "sentAt"
      FROM thongbao tb
      JOIN nguoidung nd ON nd."maNguoiDung" = tb."maNguoiDung"
      WHERE tb."maNguoiDung" = ${parentId}::uuid
         OR tb."maNguoiDung" IN (SELECT "maHocVien" FROM linked_students)
      ORDER BY
        tb."daDoc" ASC,
        tb."ngayGui" DESC;
    `;
  }
}
