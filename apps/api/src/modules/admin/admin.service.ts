import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { CreateAdminAuditLogDto } from './dto/create-admin-audit-log.dto';

type CountRow = { count: bigint };
type NumberRow = { value: number | null };

type AuditLogRow = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  description: string | null;
  createdAt: string;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getSystemOverview() {
    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      totalPaths,
      publishedPaths,
      totalLessons,
      publishedLessons,
      totalQuizzes,
      publishedQuizzes,
      activeGames,
      aiVisionRows,
      averagePassingScore,
      averageQuizScore,
      supportStudents,
      latestLogs,
    ] = await Promise.all([
      this.count(`SELECT COUNT(*)::bigint AS count FROM nguoidung`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM nguoidung WHERE "trangThai" = 'HoatDong'`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM nguoidung WHERE "trangThai" <> 'HoatDong'`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM lotrinhhoc`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM lotrinhhoc WHERE "trangThai" = 'CongBo'`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM baihoc`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM baihoc WHERE "trangThai" = 'CongBo'`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM baikiemtra`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM baikiemtra WHERE "trangThai" = 'CongBo'`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM minigame WHERE "trangThai" = 'HoatDong'`),
      this.count(`SELECT COUNT(*)::bigint AS count FROM phantichhinhanh`),
      this.number(`SELECT ROUND(COALESCE(AVG("diemDatYeuCau"), 80), 0)::float AS value FROM baihoc`),
      this.number(`SELECT ROUND(COALESCE(AVG("phanTramDung"), 0), 0)::float AS value FROM lanlambai WHERE "trangThai" IN ('Dat', 'ChuaDat')`),
      this.count(`
        SELECT COUNT(*)::bigint AS count
        FROM (
          SELECT tt."maHocVien"
          FROM tientrinhhoctap tt
          GROUP BY tt."maHocVien"
          HAVING ROUND(COALESCE(AVG(tt."phanTramHoanThanh"), 0), 0) < 55
            OR COUNT(*) FILTER (WHERE tt."trangThai" = 'BiKhoa') >= 2
        ) support
      `),
      this.getAuditLogs(),
    ]);

    const contentReadiness = totalLessons ? Math.round((publishedLessons / totalLessons) * 100) : 0;
    const quizReadiness = totalQuizzes ? Math.round((publishedQuizzes / totalQuizzes) * 100) : 0;
    const pathReadiness = totalPaths ? Math.round((publishedPaths / totalPaths) * 100) : 0;
    const operationalScore = Math.round((contentReadiness + quizReadiness + pathReadiness) / 3);
    const aiMode = this.config.get<string>('OPENAI_API_KEY') ? 'AI thật' : 'Mô phỏng nội bộ';

    const configs = [
      {
        key: 'learning-gate',
        label: 'Điều kiện mở khóa bài học',
        value: `${Math.round(averagePassingScore || 80)}%`,
        status: 'Đang áp dụng',
        owner: 'Học thuật',
        description: 'Học viên cần đạt ngưỡng điểm yêu cầu để mở khóa bài tiếp theo.',
      },
      {
        key: 'content-publishing',
        label: 'Công bố nội dung học tập',
        value: `${contentReadiness}%`,
        status: contentReadiness >= 80 ? 'Ổn định' : 'Cần rà soát',
        owner: 'Nội dung',
        description: `${publishedLessons}/${totalLessons} bài học đã sẵn sàng cho học viên.`,
      },
      {
        key: 'quiz-quality',
        label: 'Chất lượng bài kiểm tra',
        value: `${Math.round(averageQuizScore || 0)}%`,
        status: averageQuizScore >= 80 ? 'Tốt' : 'Theo dõi',
        owner: 'Đánh giá',
        description: 'Theo dõi điểm trung bình để phát hiện quiz quá khó hoặc thiếu hướng dẫn.',
      },
      {
        key: 'ai-vision',
        label: 'AI nhận diện hình ảnh',
        value: aiMode,
        status: aiMode === 'AI thật' ? 'Sẵn sàng' : 'Chế độ demo',
        owner: 'AI Learning',
        description: `${aiVisionRows} lượt phân tích hình ảnh đã được ghi nhận.`,
      },
      {
        key: 'gamification',
        label: 'Sân chơi và mini game',
        value: `${activeGames} game`,
        status: activeGames > 0 ? 'Đang bật' : 'Chưa bật',
        owner: 'Gamification',
        description: 'Điều phối mini game, nhiệm vụ ngày và pet học tập.',
      },
    ];

    const checks = [
      {
        key: 'api',
        label: 'API backend',
        status: 'OK',
        detail: 'NestJS API phản hồi và kết nối được cơ sở dữ liệu.',
        severity: 'success',
      },
      {
        key: 'database',
        label: 'PostgreSQL',
        status: 'OK',
        detail: `${totalUsers} tài khoản, ${totalLessons} bài học, ${totalQuizzes} quiz.`,
        severity: 'success',
      },
      {
        key: 'auth',
        label: 'Phân quyền JWT',
        status: 'Bảo vệ',
        detail: 'Chỉ Quản trị viên mới truy cập được màn hình cấu hình hệ thống.',
        severity: 'success',
      },
      {
        key: 'content',
        label: 'Độ sẵn sàng nội dung',
        status: `${operationalScore}%`,
        detail: `Lộ trình ${pathReadiness}%, bài học ${contentReadiness}%, quiz ${quizReadiness}%.`,
        severity: operationalScore >= 80 ? 'success' : 'warning',
      },
    ];

    const risks = [
      {
        key: 'locked-users',
        title: 'Tài khoản bị giới hạn',
        value: lockedUsers,
        level: lockedUsers > 0 ? 'warning' : 'success',
        recommendation: lockedUsers > 0 ? 'Rà soát lý do khóa/ngừng hoạt động.' : 'Không có tài khoản bị giới hạn.',
      },
      {
        key: 'support-students',
        title: 'Học viên cần hỗ trợ',
        value: supportStudents,
        level: supportStudents > 0 ? 'warning' : 'success',
        recommendation: supportStudents > 0 ? 'Ưu tiên giáo viên gửi gợi ý hỗ trợ.' : 'Tiến độ học viên đang ổn định.',
      },
      {
        key: 'draft-content',
        title: 'Nội dung chưa công bố',
        value: Math.max(totalLessons - publishedLessons, 0),
        level: totalLessons - publishedLessons > 0 ? 'info' : 'success',
        recommendation: 'Kiểm tra bài nháp trước khi mở cho học viên.',
      },
    ];

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalUsers,
        activeUsers,
        lockedUsers,
        totalPaths,
        publishedPaths,
        totalLessons,
        publishedLessons,
        totalQuizzes,
        publishedQuizzes,
        operationalScore,
      },
      configs,
      checks,
      risks,
      logs: latestLogs,
    };
  }

  async createAuditLog(dto: CreateAdminAuditLogDto, user: AuthUser) {
    const targetType = dto.targetType ?? 'HeThong';
    const description = dto.description ?? 'Quản trị viên ghi nhận thao tác cấu hình hệ thống.';

    const [row] = await this.prisma.$queryRaw<AuditLogRow[]>`
      INSERT INTO nhatkyhoatdong (
        "maNguoiDung", "hanhDong", "loaiDoiTuong", "moTa"
      )
      VALUES (
        ${user.id}::uuid,
        ${dto.action},
        ${targetType},
        ${description}
      )
      RETURNING
        "maNhatKy"::text AS id,
        NULL::text AS "actorName",
        ${user.email}::text AS "actorEmail",
        "hanhDong" AS action,
        "loaiDoiTuong" AS "targetType",
        "moTa" AS description,
        "thoiGian"::text AS "createdAt"
    `;

    return row;
  }

  private async getAuditLogs() {
    return this.prisma.$queryRaw<AuditLogRow[]>`
      SELECT
        nk."maNhatKy"::text AS id,
        nd."hoTen" AS "actorName",
        nd."email" AS "actorEmail",
        nk."hanhDong" AS action,
        nk."loaiDoiTuong" AS "targetType",
        nk."moTa" AS description,
        nk."thoiGian"::text AS "createdAt"
      FROM nhatkyhoatdong nk
      LEFT JOIN nguoidung nd ON nd."maNguoiDung" = nk."maNguoiDung"
      ORDER BY nk."thoiGian" DESC
      LIMIT 10
    `;
  }

  private async count(query: string) {
    const rows = await this.prisma.$queryRawUnsafe<CountRow[]>(query);
    return Number(rows[0]?.count ?? 0);
  }

  private async number(query: string) {
    const rows = await this.prisma.$queryRawUnsafe<NumberRow[]>(query);
    return Number(rows[0]?.value ?? 0);
  }
}
