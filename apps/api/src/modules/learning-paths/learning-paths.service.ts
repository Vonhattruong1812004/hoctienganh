import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathStatusDto } from './dto/update-learning-path-status.dto';

type LearningPathManagementRow = {
  id: string;
  name: string;
  description: string;
  level: string;
  targetAudience: string;
  status: string;
  createdAt: string;
  stagesCount: number;
  lessonsCount: number;
  publishedLessonsCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

function isStaff(currentUser: AuthUser) {
  return currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien');
}

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished() {
    return this.prisma.$queryRaw`
      SELECT
        "maLoTrinh" AS id,
        "tenLoTrinh" AS name,
        "moTa" AS description,
        "capDo" AS level,
        "doiTuong" AS "targetAudience",
        "trangThai" AS status
      FROM lotrinhhoc
      WHERE "trangThai" = 'CongBo'
      ORDER BY "ngayTao" DESC
    `;
  }

  async findManagement() {
    return this.prisma.$queryRaw<LearningPathManagementRow[]>`
      SELECT
        lt."maLoTrinh" AS id,
        lt."tenLoTrinh" AS name,
        lt."moTa" AS description,
        lt."capDo" AS level,
        lt."doiTuong" AS "targetAudience",
        lt."trangThai" AS status,
        lt."ngayTao" AS "createdAt",
        COALESCE(COUNT(DISTINCT gd."maGiaiDoan"), 0)::int AS "stagesCount",
        COALESCE(COUNT(DISTINCT bh."maBaiHoc"), 0)::int AS "lessonsCount",
        COALESCE(COUNT(DISTINCT CASE WHEN bh."trangThai" = 'CongBo' THEN bh."maBaiHoc" END), 0)::int AS "publishedLessonsCount",
        COALESCE(COUNT(DISTINCT bkt."maBaiKiemTra"), 0)::int AS "quizzesCount",
        COALESCE(COUNT(DISTINCT CASE WHEN bkt."trangThai" = 'CongBo' THEN bkt."maBaiKiemTra" END), 0)::int AS "publishedQuizzesCount"
      FROM lotrinhhoc lt
      LEFT JOIN giaidoanhoc gd ON gd."maLoTrinh" = lt."maLoTrinh"
      LEFT JOIN baihoc bh ON bh."maGiaiDoan" = gd."maGiaiDoan"
      LEFT JOIN baikiemtra bkt ON bkt."maBaiHoc" = bh."maBaiHoc"
      GROUP BY
        lt."maLoTrinh",
        lt."tenLoTrinh",
        lt."moTa",
        lt."capDo",
        lt."doiTuong",
        lt."trangThai",
        lt."ngayTao"
      ORDER BY lt."ngayTao" DESC, lt."tenLoTrinh" ASC
    `;
  }

  async create(dto: CreateLearningPathDto, currentUser: AuthUser) {
    const [created] = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO lotrinhhoc (
        "tenLoTrinh",
        "moTa",
        "capDo",
        "doiTuong",
        "trangThai",
        "maNguoiTao",
        "ngayTao",
        "ngayCapNhat"
      )
      VALUES (
        ${dto.name.trim()},
        ${dto.description.trim()},
        ${dto.level.trim()},
        ${dto.targetAudience.trim()},
        ${dto.status ?? 'Nhap'},
        ${currentUser.id}::uuid,
        NOW(),
        NOW()
      )
      RETURNING "maLoTrinh" AS id
    `;

    const [path] = await this.findManagementById(created.id);
    return path;
  }

  async updateStatus(id: string, dto: UpdateLearningPathStatusDto) {
    const [existing] = await this.findManagementById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy lộ trình cần cập nhật.');
    }

    await this.prisma.$executeRaw`
      UPDATE lotrinhhoc
      SET "trangThai" = ${dto.status}, "ngayCapNhat" = NOW()
      WHERE "maLoTrinh" = ${id}::uuid
    `;

    const [updated] = await this.findManagementById(id);
    return updated;
  }

  async findDetail(id: string, currentUser: AuthUser) {
    const staff = isStaff(currentUser);
    const paths = await this.prisma.$queryRaw<{ id: string; status: string; name: string; description: string; level: string }[]>`
      SELECT
        "maLoTrinh" AS id,
        "tenLoTrinh" AS name,
        "moTa" AS description,
        "capDo" AS level,
        "trangThai" AS status
      FROM lotrinhhoc
      WHERE "maLoTrinh" = ${id}::uuid
      LIMIT 1
    `;

    if (!paths[0] || (!staff && paths[0].status !== 'CongBo')) {
      throw new NotFoundException('Không tìm thấy lộ trình học.');
    }

    const stages = staff
      ? await this.prisma.$queryRaw`
          SELECT
            gd."maGiaiDoan" AS id,
            gd."tenGiaiDoan" AS name,
            gd."loaiGiaiDoan" AS type,
            gd."thuTu" AS "orderIndex",
            gd."moTa" AS description,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', bh."maBaiHoc",
                  'title', bh."tieuDe",
                  'description', bh."moTa",
                  'level', bh."capDo",
                  'orderIndex', bh."thuTu",
                  'passingScore', bh."diemDatYeuCau",
                  'status', bh."trangThai"
                )
                ORDER BY bh."thuTu"
              ) FILTER (WHERE bh."maBaiHoc" IS NOT NULL),
              '[]'
            ) AS lessons
          FROM giaidoanhoc gd
          LEFT JOIN baihoc bh ON bh."maGiaiDoan" = gd."maGiaiDoan"
          WHERE gd."maLoTrinh" = ${id}::uuid
          GROUP BY gd."maGiaiDoan"
          ORDER BY gd."thuTu"
        `
      : await this.prisma.$queryRaw`
          SELECT
            gd."maGiaiDoan" AS id,
            gd."tenGiaiDoan" AS name,
            gd."loaiGiaiDoan" AS type,
            gd."thuTu" AS "orderIndex",
            gd."moTa" AS description,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', bh."maBaiHoc",
                  'title', bh."tieuDe",
                  'description', bh."moTa",
                  'level', bh."capDo",
                  'orderIndex', bh."thuTu",
                  'passingScore', bh."diemDatYeuCau",
                  'status', bh."trangThai"
                )
                ORDER BY bh."thuTu"
              ) FILTER (WHERE bh."maBaiHoc" IS NOT NULL),
              '[]'
            ) AS lessons
          FROM giaidoanhoc gd
          LEFT JOIN baihoc bh ON bh."maGiaiDoan" = gd."maGiaiDoan" AND bh."trangThai" = 'CongBo'
          WHERE gd."maLoTrinh" = ${id}::uuid
          GROUP BY gd."maGiaiDoan"
          ORDER BY gd."thuTu"
        `;

    return {
      ...paths[0],
      stages,
    };
  }

  private findManagementById(id: string) {
    return this.prisma.$queryRaw<LearningPathManagementRow[]>`
      SELECT
        lt."maLoTrinh" AS id,
        lt."tenLoTrinh" AS name,
        lt."moTa" AS description,
        lt."capDo" AS level,
        lt."doiTuong" AS "targetAudience",
        lt."trangThai" AS status,
        lt."ngayTao" AS "createdAt",
        COALESCE(COUNT(DISTINCT gd."maGiaiDoan"), 0)::int AS "stagesCount",
        COALESCE(COUNT(DISTINCT bh."maBaiHoc"), 0)::int AS "lessonsCount",
        COALESCE(COUNT(DISTINCT CASE WHEN bh."trangThai" = 'CongBo' THEN bh."maBaiHoc" END), 0)::int AS "publishedLessonsCount",
        COALESCE(COUNT(DISTINCT bkt."maBaiKiemTra"), 0)::int AS "quizzesCount",
        COALESCE(COUNT(DISTINCT CASE WHEN bkt."trangThai" = 'CongBo' THEN bkt."maBaiKiemTra" END), 0)::int AS "publishedQuizzesCount"
      FROM lotrinhhoc lt
      LEFT JOIN giaidoanhoc gd ON gd."maLoTrinh" = lt."maLoTrinh"
      LEFT JOIN baihoc bh ON bh."maGiaiDoan" = gd."maGiaiDoan"
      LEFT JOIN baikiemtra bkt ON bkt."maBaiHoc" = bh."maBaiHoc"
      WHERE lt."maLoTrinh" = ${id}::uuid
      GROUP BY
        lt."maLoTrinh",
        lt."tenLoTrinh",
        lt."moTa",
        lt."capDo",
        lt."doiTuong",
        lt."trangThai",
        lt."ngayTao"
      LIMIT 1
    `;
  }
}
