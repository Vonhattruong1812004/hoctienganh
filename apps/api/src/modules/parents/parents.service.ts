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

  async findLearningAudit(parentId: string) {
    const [students, logs] = await Promise.all([
      this.findLinkedStudents(parentId),
      this.prisma.$queryRaw`
        WITH linked_students AS (
          SELECT
            nd."maNguoiDung" AS "studentId",
            nd."hoTen"::text AS "studentName",
            nd.email::text AS "studentEmail"
          FROM lienket_phuhuynh_hocvien lk
          JOIN nguoidung nd ON nd."maNguoiDung" = lk."maHocVien"
          WHERE lk."maPhuHuynh" = ${parentId}::uuid
            AND lk."trangThai" = 'DaChapNhan'
        ),
        audit_events AS (
          SELECT
            nk."maNhatKy"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            nk."hanhDong"::text AS "eventType",
            'HeThong'::text AS "eventGroup",
            nk."hanhDong"::text AS title,
            COALESCE(nk."moTa", 'Hoạt động hệ thống được ghi nhận.')::text AS description,
            COALESCE(nk."loaiDoiTuong", 'HeThong')::text AS "targetType",
            nk."maDoiTuong"::text AS "targetId",
            'DaGhiNhan'::text AS status,
            NULL::double precision AS progress,
            NULL::double precision AS score,
            nk."thoiGian" AS "occurredAt",
            jsonb_build_object('source', 'nhatkyhoatdong') AS metadata
          FROM nhatkyhoatdong nk
          JOIN linked_students ls ON ls."studentId" = nk."maNguoiDung"

          UNION ALL

          SELECT
            tt."maTienTrinh"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'CapNhatTienTrinh'::text AS "eventType",
            'BaiHoc'::text AS "eventGroup",
            CONCAT('Cập nhật bài học: ', bh."tieuDe")::text AS title,
            CONCAT('Trạng thái ', tt."trangThai", ', hoàn thành ', ROUND(tt."phanTramHoanThanh"), '%.')::text AS description,
            'BaiHoc'::text AS "targetType",
            bh."maBaiHoc"::text AS "targetId",
            tt."trangThai"::text AS status,
            tt."phanTramHoanThanh"::double precision AS progress,
            tt."diemCaoNhat"::double precision AS score,
            COALESCE(tt."ngayHoanThanh", tt."ngayCapNhat", tt."ngayBatDau") AS "occurredAt",
            jsonb_build_object(
              'source', 'tientrinhhoctap',
              'lessonTitle', bh."tieuDe",
              'level', bh."capDo",
              'bestScore', tt."diemCaoNhat"
            ) AS metadata
          FROM tientrinhhoctap tt
          JOIN linked_students ls ON ls."studentId" = tt."maHocVien"
          JOIN baihoc bh ON bh."maBaiHoc" = tt."maBaiHoc"

          UNION ALL

          SELECT
            ht."maHoanThanh"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'HoanThanhNhiemVu'::text AS "eventType",
            'NhiemVu'::text AS "eventGroup",
            CONCAT('Hoàn thành nhiệm vụ: ', nv."tieuDe")::text AS title,
            COALESCE(nv."huongDan", CONCAT('Nhiệm vụ thuộc bài ', bh."tieuDe", '.'))::text AS description,
            'NhiemVuHocTap'::text AS "targetType",
            nv."maNhiemVu"::text AS "targetId",
            ht."trangThai"::text AS status,
            CASE WHEN ht."trangThai" = 'HoanThanh' THEN 100 ELSE 0 END::double precision AS progress,
            NULL::double precision AS score,
            ht."thoiGianHoanThanh" AS "occurredAt",
            jsonb_build_object(
              'source', 'hoanthanh_nhiemvu',
              'lessonTitle', bh."tieuDe",
              'taskType', nv."loaiNhiemVu",
              'required', nv."batBuoc"
            ) AS metadata
          FROM hoanthanh_nhiemvu ht
          JOIN linked_students ls ON ls."studentId" = ht."maHocVien"
          JOIN nhiemvuhoctap nv ON nv."maNhiemVu" = ht."maNhiemVu"
          JOIN baihoc bh ON bh."maBaiHoc" = nv."maBaiHoc"
          WHERE ht."thoiGianHoanThanh" IS NOT NULL

          UNION ALL

          SELECT
            llb."maLanLam"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'LamKiemTra'::text AS "eventType",
            'Quiz'::text AS "eventGroup",
            CONCAT('Làm quiz: ', bkt."tieuDe")::text AS title,
            CONCAT(
              'Lần ', llb."lanThu",
              ', đúng ', llb."soCauDung",
              ', sai ', llb."soCauSai",
              ', đạt ', ROUND(llb."phanTramDung"), '%.'
            )::text AS description,
            'BaiKiemTra'::text AS "targetType",
            bkt."maBaiKiemTra"::text AS "targetId",
            llb."trangThai"::text AS status,
            llb."phanTramDung"::double precision AS progress,
            llb."diemSo"::double precision AS score,
            COALESCE(llb."thoiGianNopBai", llb."thoiGianBatDau") AS "occurredAt",
            jsonb_build_object(
              'source', 'lanlambai',
              'lessonTitle', bh."tieuDe",
              'quizType', bkt."loaiBaiKiemTra",
              'attemptNumber', llb."lanThu",
              'passingScore', bkt."diemDatYeuCau"
            ) AS metadata
          FROM lanlambai llb
          JOIN linked_students ls ON ls."studentId" = llb."maHocVien"
          JOIN baikiemtra bkt ON bkt."maBaiKiemTra" = llb."maBaiKiemTra"
          LEFT JOIN baihoc bh ON bh."maBaiHoc" = bkt."maBaiHoc"

          UNION ALL

          SELECT
            lc."maLanChoi"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'ChoiMiniGame'::text AS "eventType",
            'TroChoi'::text AS "eventGroup",
            CONCAT('Chơi mini game: ', mg."tenMiniGame")::text AS title,
            CONCAT('Điểm ', lc."diemSo", ', ', lc."soSao", ' sao, trạng thái ', lc."ketQua", '.')::text AS description,
            'MiniGame'::text AS "targetType",
            mg."maMiniGame"::text AS "targetId",
            lc."ketQua"::text AS status,
            NULL::double precision AS progress,
            lc."diemSo"::double precision AS score,
            lc."ngayChoi" AS "occurredAt",
            jsonb_build_object(
              'source', 'lanchoigame',
              'gameType', mg."loaiMiniGame",
              'stars', lc."soSao",
              'durationSeconds', lc."thoiGianChoi"
            ) AS metadata
          FROM lanchoigame lc
          JOIN linked_students ls ON ls."studentId" = lc."maNguoiDung"
          JOIN minigame mg ON mg."maMiniGame" = lc."maMiniGame"

          UNION ALL

          SELECT
            CONCAT(ndq."maNguoiDung"::text, ':', ndq."maNhiemVuNgay"::text) AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'NhiemVuNgay'::text AS "eventType",
            'NhiemVuNgay'::text AS "eventGroup",
            CONCAT('Nhiệm vụ ngày: ', nvng."tieuDe")::text AS title,
            COALESCE(nvng."moTa", 'Cập nhật nhiệm vụ ngày của học viên.')::text AS description,
            'NhiemVuNgay'::text AS "targetType",
            nvng."maNhiemVuNgay"::text AS "targetId",
            ndq."trangThai"::text AS status,
            LEAST(100, ROUND((ndq."soTienDo"::numeric / GREATEST(nvng."mucTieu", 1)) * 100))::double precision AS progress,
            NULL::double precision AS score,
            COALESCE(ndq."ngayHoanThanh", nvng."ngayTao") AS "occurredAt",
            jsonb_build_object(
              'source', 'nguoidung_nhiemvungay',
              'questType', nvng."loaiNhiemVu",
              'current', ndq."soTienDo",
              'target', nvng."mucTieu",
              'claimed', ndq."daNhanThuong",
              'xpReward', nvng."xpThuong",
              'coinReward', nvng."vangThuong"
            ) AS metadata
          FROM nguoidung_nhiemvungay ndq
          JOIN linked_students ls ON ls."studentId" = ndq."maNguoiDung"
          JOIN nhiemvungay nvng ON nvng."maNhiemVuNgay" = ndq."maNhiemVuNgay"

          UNION ALL

          SELECT
            pt."maPhanTich"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'PhanTichAnhAI'::text AS "eventType",
            'AI'::text AS "eventGroup",
            CONCAT('AI nhận diện ảnh: ', pt."tuKhoaNhanRa")::text AS title,
            CONCAT(
              'Từ vựng ', pt."tuKhoaNhanRa",
              ' - ', pt."nghiaTiengViet",
              ', độ tin cậy ', ROUND(pt."doTinCay"), '%.'
            )::text AS description,
            'PhanTichHinhAnh'::text AS "targetType",
            pt."maPhanTich"::text AS "targetId",
            pt."nguonNhanDang"::text AS status,
            pt."doTinCay"::double precision AS progress,
            pt."doTinCay"::double precision AS score,
            pt."ngayPhanTich" AS "occurredAt",
            jsonb_build_object(
              'source', 'phantichhinhanh',
              'fileName', pt."tenTapTin",
              'inputHint', pt."tuKhoaNhap",
              'contentType', pt."loaiNoiDung",
              'example', pt."cauViDu"
            ) AS metadata
          FROM phantichhinhanh pt
          JOIN linked_students ls ON ls."studentId" = pt."maNguoiDung"

          UNION ALL

          SELECT
            gy."maGoiY"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'GoiYOnTap'::text AS "eventType",
            'CanhBao'::text AS "eventGroup",
            COALESCE(CONCAT('Gợi ý ôn tập: ', bh."tieuDe"), 'Gợi ý ôn tập theo chủ đề')::text AS title,
            gy."lyDo"::text AS description,
            'GoiYOnTap'::text AS "targetType",
            gy."maGoiY"::text AS "targetId",
            gy."trangThai"::text AS status,
            NULL::double precision AS progress,
            gy."mucDoUuTien"::double precision AS score,
            gy."ngayTao" AS "occurredAt",
            jsonb_build_object(
              'source', 'goiyontap',
              'priority', gy."mucDoUuTien",
              'lessonTitle', bh."tieuDe",
              'topicName', cd."tenChuDe"
            ) AS metadata
          FROM goiyontap gy
          JOIN linked_students ls ON ls."studentId" = gy."maHocVien"
          LEFT JOIN baihoc bh ON bh."maBaiHoc" = gy."maBaiHoc"
          LEFT JOIN chudehoc cd ON cd."maChuDe" = COALESCE(gy."maChuDe", bh."maChuDe")

          UNION ALL

          SELECT
            tb."maThongBao"::text AS id,
            ls."studentId",
            ls."studentName",
            ls."studentEmail",
            'ThongBaoHocTap'::text AS "eventType",
            'ThongBao'::text AS "eventGroup",
            tb."tieuDe"::text AS title,
            tb."noiDung"::text AS description,
            'ThongBao'::text AS "targetType",
            tb."maThongBao"::text AS "targetId",
            CASE WHEN tb."daDoc" THEN 'DaDoc' ELSE 'ChuaDoc' END::text AS status,
            NULL::double precision AS progress,
            NULL::double precision AS score,
            tb."ngayGui" AS "occurredAt",
            jsonb_build_object(
              'source', 'thongbao',
              'notificationType', tb."loaiThongBao",
              'isRead', tb."daDoc"
            ) AS metadata
          FROM thongbao tb
          JOIN linked_students ls ON ls."studentId" = tb."maNguoiDung"
        )
        SELECT *
        FROM audit_events
        WHERE "occurredAt" IS NOT NULL
        ORDER BY "occurredAt" DESC
        LIMIT 180;
      `,
    ]);

    return { students, logs };
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

  async markNotificationAsRead(parentId: string, notificationId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; isRead: boolean }>>`
      WITH linked_students AS (
        SELECT lk."maHocVien"
        FROM lienket_phuhuynh_hocvien lk
        WHERE lk."maPhuHuynh" = ${parentId}::uuid
          AND lk."trangThai" = 'DaChapNhan'
      ),
      allowed_notification AS (
        SELECT tb."maThongBao"
        FROM thongbao tb
        WHERE tb."maThongBao" = ${notificationId}::uuid
          AND (
            tb."maNguoiDung" = ${parentId}::uuid
            OR tb."maNguoiDung" IN (SELECT "maHocVien" FROM linked_students)
          )
      )
      UPDATE thongbao tb
      SET "daDoc" = true
      WHERE tb."maThongBao" IN (SELECT "maThongBao" FROM allowed_notification)
      RETURNING tb."maThongBao" AS id, tb."daDoc" AS "isRead";
    `;

    return rows[0] ?? { id: notificationId, isRead: false };
  }
}
