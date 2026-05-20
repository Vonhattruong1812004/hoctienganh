import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import type { AuthRole, AuthUser } from '../auth/auth.types';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { CreateStudentSupportDto } from './dto/create-student-support.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';
import { UpdateStudentSupportStatusDto } from './dto/update-student-support-status.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
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

type AdminAccountAuditRow = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  description: string | null;
  targetId: string | null;
  createdAt: string;
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

  async getAdminAccountAudit() {
    return this.prisma.$queryRaw<AdminAccountAuditRow[]>`
      SELECT
        nk."maNhatKy" AS id,
        nd."hoTen" AS "actorName",
        nd.email AS "actorEmail",
        nk."hanhDong" AS action,
        nk."moTa" AS description,
        nk."maDoiTuong"::text AS "targetId",
        nk."thoiGian" AS "createdAt"
      FROM nhatkyhoatdong nk
      LEFT JOIN nguoidung nd ON nd."maNguoiDung" = nk."maNguoiDung"
      WHERE nk."loaiDoiTuong" = 'NguoiDung'
      ORDER BY nk."thoiGian" DESC
      LIMIT 20
    `;
  }

  async createAdminAccount(dto: CreateAdminAccountDto, currentUser: AuthUser) {
    const fullName = dto.fullName.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim() || null;
    const roles = Array.from(new Set(dto.roles));

    await this.ensureUniqueAccountIdentity(email, phone);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const [created] = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO nguoidung (
        "hoTen", email, "soDienThoai", "matKhau", "gioiTinh", "trangThai", "ngayTao", "ngayCapNhat"
      )
      VALUES (
        ${fullName}, ${email}, ${phone}, ${passwordHash}, ${dto.gender ?? null}, ${dto.status ?? 'HoatDong'}, NOW(), NOW()
      )
      RETURNING "maNguoiDung" AS id
    `;

    await this.replaceUserRoles(created.id, roles);

    if (roles.includes('HocVien')) {
      await this.prisma.$executeRaw`
        INSERT INTO hosohocvien ("maNguoiDung", "trinhDoHienTai", "mucTieuHocTap", "ngayBatDauHoc")
        VALUES (${created.id}::uuid, 'TOEIC Starter', 'Học TOEIC theo chủ đề và luyện đề mô phỏng.', NOW())
        ON CONFLICT ("maNguoiDung") DO NOTHING
      `;
    }

    await this.writeUserAudit(currentUser.id, 'TAO_TAI_KHOAN', created.id, `Tạo tài khoản ${fullName} với vai trò ${roles.join(', ')}.`);
    return this.findAdminAccountById(created.id);
  }

  async updateAdminAccount(userId: string, dto: UpdateAdminAccountDto, currentUser: AuthUser) {
    await this.ensureAccountExists(userId);

    const fullName = dto.fullName?.trim();
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone === undefined ? undefined : dto.phone?.trim() || null;
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    if (email || phone !== undefined) {
      await this.ensureUniqueAccountIdentity(email, phone, userId);
    }

    if (currentUser.id === userId && dto.status && dto.status !== 'HoatDong') {
      throw new BadRequestException('Không thể tự khóa hoặc tự ngừng hoạt động tài khoản đang đăng nhập.');
    }

    if (dto.status && dto.status !== 'HoatDong') {
      await this.ensureActiveAdminWillRemain(userId, 'Không thể khóa hoặc ngừng hoạt động quản trị viên cuối cùng.');
    }

    await this.prisma.$executeRaw`
      UPDATE nguoidung
      SET
        "hoTen" = COALESCE(${fullName ?? null}, "hoTen"),
        email = COALESCE(${email ?? null}, email),
        "soDienThoai" = CASE WHEN ${phone === undefined} THEN "soDienThoai" ELSE ${phone ?? null} END,
        "matKhau" = COALESCE(${passwordHash ?? null}, "matKhau"),
        "gioiTinh" = CASE WHEN ${dto.gender === undefined} THEN "gioiTinh" ELSE ${dto.gender ?? null} END,
        "trangThai" = COALESCE(${dto.status ?? null}, "trangThai"),
        "ngayCapNhat" = NOW()
      WHERE "maNguoiDung" = ${userId}::uuid
    `;

    await this.writeUserAudit(currentUser.id, 'SUA_TAI_KHOAN', userId, `Cập nhật thông tin tài khoản ${userId}.`);
    return this.findAdminAccountById(userId);
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

    if (dto.status !== 'HoatDong') {
      await this.ensureActiveAdminWillRemain(userId, 'Không thể khóa hoặc ngừng hoạt động quản trị viên cuối cùng.');
    }

    await this.prisma.$executeRaw`
      UPDATE nguoidung
      SET "trangThai" = ${dto.status}, "ngayCapNhat" = NOW()
      WHERE "maNguoiDung" = ${userId}::uuid
    `;

    await this.writeUserAudit(
      currentUser.id,
      'CAP_NHAT_TRANG_THAI_TAI_KHOAN',
      userId,
      `Cập nhật trạng thái tài khoản ${userId} thành ${dto.status}.`,
    );

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

  async updateUserRoles(userId: string, dto: UpdateUserRolesDto, currentUser: AuthUser) {
    const roles = Array.from(new Set(dto.roles));

    if (!roles.length) {
      throw new BadRequestException('Tài khoản phải có ít nhất một vai trò.');
    }

    if (currentUser.id === userId && !roles.includes('QuanTriVien')) {
      throw new BadRequestException('Không thể tự gỡ quyền quản trị viên của tài khoản đang đăng nhập.');
    }

    const [existing] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT "maNguoiDung" AS id
      FROM nguoidung
      WHERE "maNguoiDung" = ${userId}::uuid
      LIMIT 1
    `;

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài khoản cần phân quyền.');
    }

    if (!roles.includes('QuanTriVien')) {
      await this.ensureActiveAdminWillRemain(userId, 'Không thể gỡ quyền quản trị viên cuối cùng.');
    }

    await this.replaceUserRoles(userId, roles);

    if (roles.includes('HocVien')) {
      await this.prisma.$executeRaw`
        INSERT INTO hosohocvien ("maNguoiDung", "trinhDoHienTai", "mucTieuHocTap", "ngayBatDauHoc")
        VALUES (${userId}::uuid, 'TOEIC Starter', 'Học TOEIC theo chủ đề và luyện đề mô phỏng.', NOW())
        ON CONFLICT ("maNguoiDung") DO NOTHING
      `;
    }

    await this.writeUserAudit(currentUser.id, 'PHAN_QUYEN_TAI_KHOAN', userId, `Cập nhật vai trò: ${roles.join(', ')}.`);
    const updated = await this.findAdminAccountById(userId);

    return updated;
  }

  async deleteAdminAccount(userId: string, currentUser: AuthUser) {
    if (currentUser.id === userId) {
      throw new BadRequestException('Không thể tự xóa tài khoản đang đăng nhập.');
    }

    const existing = await this.ensureAccountExists(userId);

    await this.ensureActiveAdminWillRemain(userId, 'Không thể xóa quản trị viên cuối cùng.');

    await this.writeUserAudit(
      currentUser.id,
      'XOA_TAI_KHOAN',
      userId,
      `Xóa tài khoản ${existing.fullName} (${existing.email}).`,
    );

    await this.prisma.$executeRaw`
      DELETE FROM nguoidung
      WHERE "maNguoiDung" = ${userId}::uuid
    `;

    return { id: userId, deleted: true };
  }

  private async ensureUniqueAccountIdentity(email?: string | null, phone?: string | null, exceptUserId?: string) {
    if (!email && !phone) return;

    const duplicates = await this.prisma.$queryRaw<Array<{ id: string; email: string; phone: string | null }>>`
      SELECT "maNguoiDung" AS id, email, "soDienThoai" AS phone
      FROM nguoidung
      WHERE (${email ?? null} IS NOT NULL AND email = ${email ?? null})
         OR (${phone ?? null} IS NOT NULL AND "soDienThoai" = ${phone ?? null})
    `;

    const duplicate = duplicates.find((item) => item.id !== exceptUserId);
    if (!duplicate) return;

    if (email && duplicate.email === email) {
      throw new BadRequestException('Email này đã được dùng cho tài khoản khác.');
    }

    throw new BadRequestException('Số điện thoại này đã được dùng cho tài khoản khác.');
  }

  private async ensureAccountExists(userId: string) {
    const [existing] = await this.prisma.$queryRaw<Array<{ id: string; fullName: string; email: string }>>`
      SELECT "maNguoiDung" AS id, "hoTen" AS "fullName", email
      FROM nguoidung
      WHERE "maNguoiDung" = ${userId}::uuid
      LIMIT 1
    `;

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài khoản cần xử lý.');
    }

    return existing;
  }

  private async replaceUserRoles(userId: string, roles: AuthRole[]) {
    const normalizedRoles = Array.from(new Set(roles));

    if (!normalizedRoles.length) {
      throw new BadRequestException('Tài khoản phải có ít nhất một vai trò.');
    }

    const availableRoles = await this.prisma.$queryRaw<Array<{ id: string; role: AuthRole }>>`
      SELECT "maVaiTro" AS id, "tenVaiTro" AS role
      FROM vaitro
      WHERE "tenVaiTro" = ANY(${normalizedRoles}::text[])
    `;

    if (availableRoles.length !== normalizedRoles.length) {
      throw new BadRequestException('Danh sách vai trò không hợp lệ.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM nguoidung_vaitro
        WHERE "maNguoiDung" = ${userId}::uuid
      `;

      for (const role of availableRoles) {
        await tx.$executeRaw`
          INSERT INTO nguoidung_vaitro ("maNguoiDung", "maVaiTro")
          VALUES (${userId}::uuid, ${role.id}::uuid)
          ON CONFLICT ("maNguoiDung", "maVaiTro") DO NOTHING
        `;
      }

      await tx.$executeRaw`
        UPDATE nguoidung
        SET "ngayCapNhat" = NOW()
        WHERE "maNguoiDung" = ${userId}::uuid
      `;
    });
  }

  private async ensureActiveAdminWillRemain(targetUserId: string, message: string) {
    const [target] = await this.prisma.$queryRaw<Array<{ isActiveAdmin: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM nguoidung nd
        JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
        JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
        WHERE nd."maNguoiDung" = ${targetUserId}::uuid
          AND nd."trangThai" = 'HoatDong'
          AND vt."tenVaiTro" = 'QuanTriVien'
      ) AS "isActiveAdmin"
    `;

    if (!target?.isActiveAdmin) return;

    const [remaining] = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT nd."maNguoiDung")::bigint AS count
      FROM nguoidung nd
      JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
      JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
      WHERE nd."maNguoiDung" <> ${targetUserId}::uuid
        AND nd."trangThai" = 'HoatDong'
        AND vt."tenVaiTro" = 'QuanTriVien'
    `;

    if (Number(remaining?.count ?? 0) < 1) {
      throw new BadRequestException(message);
    }
  }

  private async findAdminAccountById(userId: string) {
    const accounts = await this.getAdminAccounts();
    const account = accounts.find((item) => item.id === userId);
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản sau khi cập nhật.');
    }
    return account;
  }

  private async writeUserAudit(actorId: string, action: string, targetId: string, description: string) {
    await this.prisma.$executeRaw`
      INSERT INTO nhatkyhoatdong ("maNguoiDung", "hanhDong", "loaiDoiTuong", "maDoiTuong", "moTa")
      VALUES (${actorId}::uuid, ${action}, 'NguoiDung', ${targetId}::uuid, ${description})
    `;
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
