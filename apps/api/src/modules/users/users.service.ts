import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { CreateStudentSupportDto } from './dto/create-student-support.dto';
import { UpdateStudentSupportStatusDto } from './dto/update-student-support-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

type FocusLessonRow = {
  id: string;
  title: string;
  status: string | null;
  percentComplete: number | null;
};

type SupportSuggestionRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lessonId: string;
  lessonTitle: string;
  pathName: string | null;
  stageName: string | null;
  feedback: string;
  priority: number;
  status: string;
  createdAt: string;
  progressStatus: string;
  progressPercent: number;
  bestScore: number;
};

type AdminAccountRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  birthDate: string | null;
  gender: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  studentCount: number;
  linkedParentCount: number;
  totalPoints: number;
  streak: number;
  avgProgress: number;
  lastQuizAt: string | null;
  activeLessons: number;
  lockedLessons: number;
  publishedPaths: number;
  publishedLessons: number;
  publishedQuizzes: number;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents() {
    return this.prisma.$queryRaw`
      SELECT
        nd."maNguoiDung" AS id,
        nd."hoTen" AS "fullName",
        nd."email" AS email,
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
      GROUP BY
        nd."maNguoiDung",
        nd."hoTen",
        nd."email",
        hshv."trinhDoHienTai",
        hshv."mucTieuHocTap",
        hshv."tongDiem",
        hshv."chuoiNgayHoc",
        progress_summary."completedLessons",
        progress_summary."activeLessons",
        progress_summary."lockedLessons",
        progress_summary."totalLessons",
        progress_summary."averageProgress",
        quiz_summary."attemptsCount",
        quiz_summary."passedAttemptsCount",
        quiz_summary."bestScore",
        quiz_summary."latestAttemptAt",
        parent_links."linkedParentsCount"
      ORDER BY
        progress_summary."averageProgress" DESC NULLS LAST,
        hshv."tongDiem" DESC NULLS LAST,
        nd."hoTen" ASC
    `;
  }

  async getSummary() {
    const [
      totalUsers,
      totalStudents,
      totalParents,
      totalTeachers,
      totalPaths,
      totalPublishedPaths,
      totalLessons,
      totalPublishedLessons,
      totalQuizzes,
      totalPublishedQuizzes,
    ] = await Promise.all([
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM nguoidung`,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM nguoidung_vaitro ndvt
        JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
        WHERE vt."tenVaiTro" = 'HocVien'
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM nguoidung_vaitro ndvt
        JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
        WHERE vt."tenVaiTro" = 'PhuHuynh'
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM nguoidung_vaitro ndvt
        JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
        WHERE vt."tenVaiTro" = 'GiaoVien'
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM lotrinhhoc`,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM lotrinhhoc
        WHERE "trangThai" = 'CongBo'
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM baihoc`,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM baihoc
        WHERE "trangThai" = 'CongBo'
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM baikiemtra`,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM baikiemtra
        WHERE "trangThai" = 'CongBo'
      `,
    ]);

    return {
      totalUsers: Number(totalUsers[0]?.count ?? 0),
      totalStudents: Number(totalStudents[0]?.count ?? 0),
      totalParents: Number(totalParents[0]?.count ?? 0),
      totalTeachers: Number(totalTeachers[0]?.count ?? 0),
      totalPaths: Number(totalPaths[0]?.count ?? 0),
      totalPublishedPaths: Number(totalPublishedPaths[0]?.count ?? 0),
      totalLessons: Number(totalLessons[0]?.count ?? 0),
      totalPublishedLessons: Number(totalPublishedLessons[0]?.count ?? 0),
      totalQuizzes: Number(totalQuizzes[0]?.count ?? 0),
      totalPublishedQuizzes: Number(totalPublishedQuizzes[0]?.count ?? 0),
    };
  }

  async getAdminAccounts() {
    return this.prisma.$queryRaw<AdminAccountRow[]>`
      SELECT
        nd."maNguoiDung" AS id,
        nd."hoTen" AS "fullName",
        nd."email" AS email,
        nd."soDienThoai" AS phone,
        nd."anhDaiDien" AS avatar,
        nd."ngaySinh"::text AS "birthDate",
        nd."gioiTinh" AS gender,
        nd."trangThai" AS status,
        nd."ngayTao" AS "createdAt",
        nd."ngayCapNhat" AS "updatedAt",
        COALESCE(array_agg(DISTINCT vt."tenVaiTro") FILTER (WHERE vt."tenVaiTro" IS NOT NULL), '{}') AS roles,
        COALESCE(student_count."count", 0)::int AS "studentCount",
        COALESCE(parent_link_count."count", 0)::int AS "linkedParentCount",
        COALESCE(profile_summary."totalPoints", 0)::int AS "totalPoints",
        COALESCE(profile_summary."streak", 0)::int AS "streak",
        ROUND(COALESCE(progress_summary."avgProgress", 0))::int AS "avgProgress",
        activity_summary."lastQuizAt" AS "lastQuizAt",
        COALESCE(progress_summary."activeLessons", 0)::int AS "activeLessons",
        COALESCE(progress_summary."lockedLessons", 0)::int AS "lockedLessons",
        COALESCE(content_summary."publishedPaths", 0)::int AS "publishedPaths",
        COALESCE(content_summary."publishedLessons", 0)::int AS "publishedLessons",
        COALESCE(content_summary."publishedQuizzes", 0)::int AS "publishedQuizzes"
      FROM nguoidung nd
      LEFT JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
      LEFT JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM lienket_phuhuynh_hocvien lk
        WHERE lk."maPhuHuynh" = nd."maNguoiDung"
          AND lk."trangThai" = 'DaChapNhan'
      ) parent_link_count ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM nguoidung_vaitro ndvt2
        JOIN vaitro vt2 ON vt2."maVaiTro" = ndvt2."maVaiTro"
        WHERE ndvt2."maNguoiDung" = nd."maNguoiDung"
          AND vt2."tenVaiTro" = 'HocVien'
      ) student_count ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(hshv."tongDiem", 0)::int AS "totalPoints",
          COALESCE(hshv."chuoiNgayHoc", 0)::int AS streak
        FROM hosohocvien hshv
        WHERE hshv."maNguoiDung" = nd."maNguoiDung"
        LIMIT 1
      ) profile_summary ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE tt."trangThai" = 'DangHoc')::int AS "activeLessons",
          COUNT(*) FILTER (WHERE tt."trangThai" = 'BiKhoa')::int AS "lockedLessons",
          ROUND(COALESCE(AVG(tt."phanTramHoanThanh"), 0), 0)::float AS "avgProgress"
        FROM tientrinhhoctap tt
        WHERE tt."maHocVien" = nd."maNguoiDung"
      ) progress_summary ON TRUE
      LEFT JOIN LATERAL (
        SELECT MAX(llb."thoiGianNopBai") AS "lastQuizAt"
        FROM lanlambai llb
        WHERE llb."maHocVien" = nd."maNguoiDung"
      ) activity_summary ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE lt."trangThai" = 'CongBo')::int AS "publishedPaths",
          COUNT(DISTINCT CASE WHEN bh."trangThai" = 'CongBo' THEN bh."maBaiHoc" END)::int AS "publishedLessons",
          COUNT(DISTINCT CASE WHEN bkt."trangThai" = 'CongBo' THEN bkt."maBaiKiemTra" END)::int AS "publishedQuizzes"
        FROM nguoidung_vaitro ndvt3
        JOIN vaitro vt3 ON vt3."maVaiTro" = ndvt3."maVaiTro"
        LEFT JOIN lotrinhhoc lt ON lt."maNguoiTao" = nd."maNguoiDung"
        LEFT JOIN baihoc bh ON bh."maNguoiTao" = nd."maNguoiDung"
        LEFT JOIN baikiemtra bkt ON bkt."maBaiHoc" = bh."maBaiHoc"
        WHERE ndvt3."maNguoiDung" = nd."maNguoiDung"
          AND vt3."tenVaiTro" IN ('GiaoVien', 'QuanTriVien')
      ) content_summary ON TRUE
      GROUP BY
        nd."maNguoiDung",
        nd."hoTen",
        nd."email",
        nd."soDienThoai",
        nd."anhDaiDien",
        nd."ngaySinh",
        nd."gioiTinh",
        nd."trangThai",
        nd."ngayTao",
        nd."ngayCapNhat",
        student_count."count",
        parent_link_count."count",
        profile_summary."totalPoints",
        profile_summary."streak",
        progress_summary."activeLessons",
        progress_summary."lockedLessons",
        progress_summary."avgProgress",
        activity_summary."lastQuizAt",
        content_summary."publishedPaths",
        content_summary."publishedLessons",
        content_summary."publishedQuizzes"
      ORDER BY nd."ngayCapNhat" DESC, nd."hoTen" ASC
    `;
  }

  async getStudentSupportSuggestions() {
    return this.prisma.$queryRaw<SupportSuggestionRow[]>`
      SELECT
        gy."maGoiY" AS id,
        nd."maNguoiDung" AS "studentId",
        nd."hoTen" AS "studentName",
        nd."email" AS "studentEmail",
        bh."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        lt."tenLoTrinh" AS "pathName",
        gd."tenGiaiDoan" AS "stageName",
        gy."lyDo" AS feedback,
        gy."mucDoUuTien"::int AS priority,
        gy."trangThai" AS status,
        gy."ngayTao" AS "createdAt",
        COALESCE(tt."trangThai", 'ChuaHoc') AS "progressStatus",
        COALESCE(tt."phanTramHoanThanh", 0)::float AS "progressPercent",
        COALESCE(tt."diemCaoNhat", 0)::float AS "bestScore"
      FROM goiyontap gy
      JOIN nguoidung nd ON nd."maNguoiDung" = gy."maHocVien"
      JOIN baihoc bh ON bh."maBaiHoc" = gy."maBaiHoc"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN tientrinhhoctap tt
        ON tt."maHocVien" = gy."maHocVien"
       AND tt."maBaiHoc" = gy."maBaiHoc"
      ORDER BY
        gy."ngayTao" DESC,
        gy."mucDoUuTien" ASC
      LIMIT 40
    `;
  }

  async createStudentSupport(studentId: string, dto: CreateStudentSupportDto, currentUser: AuthUser) {
    const feedback = dto.feedback.trim();
    const priority = dto.priority ?? 1;
    const title = dto.title?.trim() || 'Nhiệm vụ hỗ trợ từ giáo viên';

    const [student] = await this.prisma.$queryRaw<{ id: string; fullName: string }[]>`
      SELECT nd."maNguoiDung" AS id, nd."hoTen" AS "fullName"
      FROM nguoidung nd
      JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
      JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
      WHERE nd."maNguoiDung" = ${studentId}::uuid
        AND vt."tenVaiTro" = 'HocVien'
      LIMIT 1
    `;

    if (!student) {
      throw new NotFoundException('Không tìm thấy học viên để giao nhiệm vụ.');
    }

    const focusLesson = dto.lessonId
      ? await this.findLessonById(dto.lessonId)
      : await this.findFocusLessonForStudent(studentId);

    if (!focusLesson) {
      throw new BadRequestException('Chưa có bài học công bố để giao nhiệm vụ hỗ trợ.');
    }

    const [created] = await this.prisma.$transaction(async (tx) => {
      const [suggestion] = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO goiyontap (
          "maHocVien",
          "maBaiHoc",
          "lyDo",
          "mucDoUuTien",
          "trangThai",
          "ngayTao"
        )
        VALUES (
          ${studentId}::uuid,
          ${focusLesson.id}::uuid,
          ${`Giáo viên ${currentUser.fullName}: ${feedback}`},
          ${priority},
          'ChuaXem',
          NOW()
        )
        RETURNING "maGoiY" AS id
      `;

      await tx.$executeRaw`
        INSERT INTO thongbao (
          "maNguoiDung",
          "tieuDe",
          "noiDung",
          "loaiThongBao",
          "daDoc",
          "ngayGui"
        )
        VALUES (
          ${studentId}::uuid,
          ${title},
          ${`Bài cần tập trung: ${focusLesson.title}. ${feedback}`},
          'CanhBao',
          FALSE,
          NOW()
        )
      `;

      return this.findSupportSuggestionById(tx, suggestion.id);
    });

    return created;
  }

  async updateStudentSupportStatus(suggestionId: string, dto: UpdateStudentSupportStatusDto) {
    const [existing] = await this.findSupportSuggestionById(this.prisma, suggestionId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy phiếu hỗ trợ cần cập nhật.');
    }

    await this.prisma.$executeRaw`
      UPDATE goiyontap
      SET "trangThai" = ${dto.status}
      WHERE "maGoiY" = ${suggestionId}::uuid
    `;

    const [updated] = await this.findSupportSuggestionById(this.prisma, suggestionId);
    return updated;
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto, currentUser: AuthUser) {
    if (currentUser.id === userId && dto.status !== 'HoatDong') {
      throw new BadRequestException('Không thể tự khóa hoặc tự ngừng hoạt động tài khoản đang đăng nhập.');
    }

    const [existing] = await this.prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT nd."maNguoiDung" AS id, nd."trangThai" AS status
      FROM nguoidung nd
      WHERE nd."maNguoiDung" = ${userId}::uuid
      LIMIT 1
    `;

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài khoản cần cập nhật.');
    }

    await this.prisma.$executeRaw`
      UPDATE nguoidung
      SET "trangThai" = ${dto.status}, "ngayCapNhat" = NOW()
      WHERE "maNguoiDung" = ${userId}::uuid
    `;

    const [updated] = await this.prisma.$queryRaw<AdminAccountRow[]>`
      SELECT
        nd."maNguoiDung" AS id,
        nd."hoTen" AS "fullName",
        nd."email" AS email,
        nd."soDienThoai" AS phone,
        nd."anhDaiDien" AS avatar,
        nd."ngaySinh"::text AS "birthDate",
        nd."gioiTinh" AS gender,
        nd."trangThai" AS status,
        nd."ngayTao" AS "createdAt",
        nd."ngayCapNhat" AS "updatedAt",
        COALESCE(array_agg(DISTINCT vt."tenVaiTro") FILTER (WHERE vt."tenVaiTro" IS NOT NULL), '{}') AS roles,
        0::int AS "studentCount",
        0::int AS "linkedParentCount",
        COALESCE(hshv."tongDiem", 0)::int AS "totalPoints",
        COALESCE(hshv."chuoiNgayHoc", 0)::int AS "streak",
        0::int AS "avgProgress",
        NULL::timestamp AS "lastQuizAt",
        0::int AS "activeLessons",
        0::int AS "lockedLessons",
        0::int AS "publishedPaths",
        0::int AS "publishedLessons",
        0::int AS "publishedQuizzes"
      FROM nguoidung nd
      LEFT JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
      LEFT JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
      LEFT JOIN hosohocvien hshv ON hshv."maNguoiDung" = nd."maNguoiDung"
      WHERE nd."maNguoiDung" = ${userId}::uuid
      GROUP BY nd."maNguoiDung", hshv."tongDiem", hshv."chuoiNgayHoc"
      LIMIT 1
    `;

    return updated;
  }

  private async findLessonById(lessonId: string) {
    const [lesson] = await this.prisma.$queryRaw<FocusLessonRow[]>`
      SELECT
        bh."maBaiHoc" AS id,
        bh."tieuDe" AS title,
        NULL::varchar AS status,
        NULL::float AS "percentComplete"
      FROM baihoc bh
      WHERE bh."maBaiHoc" = ${lessonId}::uuid
      LIMIT 1
    `;

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học cần giao.');
    }

    return lesson;
  }

  private async findFocusLessonForStudent(studentId: string) {
    const [lesson] = await this.prisma.$queryRaw<FocusLessonRow[]>`
      SELECT
        bh."maBaiHoc" AS id,
        bh."tieuDe" AS title,
        tt."trangThai" AS status,
        tt."phanTramHoanThanh"::float AS "percentComplete"
      FROM baihoc bh
      LEFT JOIN tientrinhhoctap tt
        ON tt."maBaiHoc" = bh."maBaiHoc"
       AND tt."maHocVien" = ${studentId}::uuid
      WHERE bh."trangThai" = 'CongBo'
      ORDER BY
        CASE
          WHEN tt."trangThai" = 'DangHoc' THEN 0
          WHEN tt."trangThai" = 'ChuaHoc' THEN 1
          WHEN tt."trangThai" = 'BiKhoa' THEN 2
          WHEN tt."trangThai" IS NULL THEN 3
          ELSE 4
        END,
        COALESCE(tt."phanTramHoanThanh", 0) ASC,
        bh."thuTu" ASC,
        bh."ngayTao" ASC
      LIMIT 1
    `;

    return lesson ?? null;
  }

  private async findSupportSuggestionById(
    client: Pick<PrismaService, '$queryRaw'>,
    suggestionId: string,
  ) {
    return client.$queryRaw<SupportSuggestionRow[]>`
      SELECT
        gy."maGoiY" AS id,
        nd."maNguoiDung" AS "studentId",
        nd."hoTen" AS "studentName",
        nd."email" AS "studentEmail",
        bh."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        lt."tenLoTrinh" AS "pathName",
        gd."tenGiaiDoan" AS "stageName",
        gy."lyDo" AS feedback,
        gy."mucDoUuTien"::int AS priority,
        gy."trangThai" AS status,
        gy."ngayTao" AS "createdAt",
        COALESCE(tt."trangThai", 'ChuaHoc') AS "progressStatus",
        COALESCE(tt."phanTramHoanThanh", 0)::float AS "progressPercent",
        COALESCE(tt."diemCaoNhat", 0)::float AS "bestScore"
      FROM goiyontap gy
      JOIN nguoidung nd ON nd."maNguoiDung" = gy."maHocVien"
      JOIN baihoc bh ON bh."maBaiHoc" = gy."maBaiHoc"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN tientrinhhoctap tt
        ON tt."maHocVien" = gy."maHocVien"
       AND tt."maBaiHoc" = gy."maBaiHoc"
      WHERE gy."maGoiY" = ${suggestionId}::uuid
      LIMIT 1
    `;
  }
}
