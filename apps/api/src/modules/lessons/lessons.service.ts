import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonStatusDto } from './dto/update-lesson-status.dto';

type LessonManagementRow = {
  id: string;
  stageId: string | null;
  topicId: string | null;
  pathId: string | null;
  title: string;
  description: string | null;
  content: string | null;
  level: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  pathName: string | null;
  stageName: string | null;
  topicName: string | null;
  stageOrder: number | null;
  lessonOrder: number;
  passingScore: number;
  tasksCount: number;
  requiredTasksCount: number;
  vocabCount: number;
  grammarCount: number;
  resourcesCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findManagement() {
    return this.prisma.$queryRaw<LessonManagementRow[]>`
      SELECT
        bh."maBaiHoc" AS id,
        bh."maGiaiDoan" AS "stageId",
        bh."maChuDe" AS "topicId",
        lt."maLoTrinh" AS "pathId",
        bh."tieuDe" AS title,
        bh."moTa" AS description,
        bh."noiDung" AS content,
        bh."capDo" AS level,
        bh."trangThai" AS status,
        bh."ngayTao" AS "createdAt",
        bh."ngayCapNhat" AS "updatedAt",
        lt."tenLoTrinh" AS "pathName",
        gd."tenGiaiDoan" AS "stageName",
        cd."tenChuDe" AS "topicName",
        gd."thuTu" AS "stageOrder",
        bh."thuTu" AS "lessonOrder",
        bh."diemDatYeuCau" AS "passingScore",
        COALESCE(task_counts."tasksCount", 0)::int AS "tasksCount",
        COALESCE(task_counts."requiredTasksCount", 0)::int AS "requiredTasksCount",
        COALESCE(vocab_counts."vocabCount", 0)::int AS "vocabCount",
        COALESCE(grammar_counts."grammarCount", 0)::int AS "grammarCount",
        COALESCE(resource_counts."resourcesCount", 0)::int AS "resourcesCount",
        COALESCE(quiz_counts."quizzesCount", 0)::int AS "quizzesCount",
        COALESCE(quiz_counts."publishedQuizzesCount", 0)::int AS "publishedQuizzesCount"
      FROM baihoc bh
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "tasksCount",
          COUNT(*) FILTER (WHERE nv."batBuoc")::int AS "requiredTasksCount"
        FROM nhiemvuhoctap nv
        WHERE nv."maBaiHoc" = bh."maBaiHoc"
          AND nv."trangThai" = 'HoatDong'
      ) task_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "vocabCount"
        FROM tuvung tv
        WHERE tv."maBaiHoc" = bh."maBaiHoc"
      ) vocab_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "grammarCount"
        FROM nguphap np
        WHERE np."maBaiHoc" = bh."maBaiHoc"
      ) grammar_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "resourcesCount"
        FROM tainguyenhoctap tn
        WHERE tn."maBaiHoc" = bh."maBaiHoc"
      ) resource_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "quizzesCount",
          COUNT(*) FILTER (WHERE bkt."trangThai" = 'CongBo')::int AS "publishedQuizzesCount"
        FROM baikiemtra bkt
        WHERE bkt."maBaiHoc" = bh."maBaiHoc"
      ) quiz_counts ON TRUE
      ORDER BY
        COALESCE(gd."thuTu", 0),
        bh."thuTu",
        bh."ngayTao" DESC
    `;
  }

  async create(dto: CreateLessonDto, currentUser: AuthUser) {
    if (!dto.stageId && !dto.topicId) {
      throw new BadRequestException('Cần chọn giai đoạn hoặc chủ đề để tạo bài học.');
    }

    const [created] = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO baihoc (
        "maGiaiDoan",
        "maChuDe",
        "tieuDe",
        "moTa",
        "noiDung",
        "capDo",
        "thuTu",
        "diemDatYeuCau",
        "trangThai",
        "maNguoiTao",
        "ngayTao",
        "ngayCapNhat"
      )
      VALUES (
        ${dto.stageId ?? null}::uuid,
        ${dto.topicId ?? null}::uuid,
        ${dto.title.trim()},
        ${dto.description?.trim() ?? null},
        ${dto.content?.trim() ?? null},
        ${dto.level?.trim() ?? null},
        ${dto.orderIndex},
        ${dto.passingScore ?? 80},
        ${dto.status ?? 'Nhap'},
        ${currentUser.id}::uuid,
        NOW(),
        NOW()
      )
      RETURNING "maBaiHoc" AS id
    `;

    const [lesson] = await this.findManagementById(created.id);
    return lesson;
  }

  async updateStatus(id: string, dto: UpdateLessonStatusDto) {
    const [existing] = await this.findManagementById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài học cần cập nhật.');
    }

    await this.prisma.$executeRaw`
      UPDATE baihoc
      SET "trangThai" = ${dto.status}, "ngayCapNhat" = NOW()
      WHERE "maBaiHoc" = ${id}::uuid
    `;

    const [updated] = await this.findManagementById(id);
    return updated;
  }

  async findDetail(id: string, currentUser: AuthUser) {
    const isStaff = currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien');
    const lessons = await this.prisma.$queryRaw<LessonDetailRow[]>`
      SELECT
        bh."maBaiHoc" AS id,
        bh."tieuDe" AS title,
        bh."moTa" AS description,
        bh."noiDung" AS content,
        bh."capDo" AS level,
        bh."diemDatYeuCau" AS "passingScore",
        bh."trangThai" AS status,
        bh."ngayTao" AS "createdAt",
        bh."ngayCapNhat" AS "updatedAt",
        cd."tenChuDe" AS "topicName",
        gd."tenGiaiDoan" AS "stageName",
        gd."thuTu" AS "stageOrder",
        bh."thuTu" AS "lessonOrder",
        bh."maGiaiDoan" AS "stageId",
        lt."tenLoTrinh" AS "pathName"
      FROM baihoc bh
      LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      WHERE bh."maBaiHoc" = ${id}::uuid
      LIMIT 1
    `;

    if (!lessons[0]) {
      throw new NotFoundException('Không tìm thấy bài học.');
    }

    await this.ensureAccess(lessons[0], currentUser);

    const [tasks, vocabularies, grammarPoints, resources, quizzes, progressRows, completionRows, pathRows] = await Promise.all([
      this.prisma.$queryRaw<TaskRow[]>`
        SELECT "maNhiemVu" AS id, "tieuDe" AS title, "huongDan" AS instruction,
               "loaiNhiemVu" AS type, "batBuoc" AS required, "thuTu" AS "orderIndex"
        FROM nhiemvuhoctap
        WHERE "maBaiHoc" = ${id}::uuid AND "trangThai" = 'HoatDong'
        ORDER BY "thuTu"
      `,
      this.prisma.$queryRaw<VocabularyRow[]>`
        SELECT "maTuVung" AS id, tu AS word, nghia AS meaning, "phienAm" AS phonetic,
               "loaiTu" AS "wordType", "viDu" AS example, "nghiaViDu" AS "exampleMeaning",
               "audioPhatAm" AS "audioUrl", "hinhAnh" AS "imageUrl"
        FROM tuvung
        WHERE "maBaiHoc" = ${id}::uuid
        ORDER BY tu
      `,
      this.prisma.$queryRaw<GrammarRow[]>`
        SELECT "maNguPhap" AS id, "tieuDe" AS title, "cauTruc" AS structure,
               "giaiThich" AS explanation, "viDu" AS example, "ghiChu" AS note
        FROM nguphap
        WHERE "maBaiHoc" = ${id}::uuid
      `,
      this.prisma.$queryRaw<ResourceRow[]>`
        SELECT "maTaiNguyen" AS id, "tenTaiNguyen" AS name, "loaiTaiNguyen" AS type,
               "duongDan" AS url, "moTa" AS description
        FROM tainguyenhoctap
        WHERE "maBaiHoc" = ${id}::uuid
      `,
      isStaff
        ? this.prisma.$queryRaw<QuizRow[]>`
            SELECT
              "maBaiKiemTra" AS id,
              "tieuDe" AS title,
              "loaiBaiKiemTra" AS type,
              "thoiGianLamBai" AS "durationMinutes",
              "diemDatYeuCau" AS "passingScore",
              "trangThai" AS status
            FROM baikiemtra
            WHERE "maBaiHoc" = ${id}::uuid
            ORDER BY "ngayTao" DESC
          `
        : this.prisma.$queryRaw<QuizRow[]>`
            SELECT
              "maBaiKiemTra" AS id,
              "tieuDe" AS title,
              "loaiBaiKiemTra" AS type,
              "thoiGianLamBai" AS "durationMinutes",
              "diemDatYeuCau" AS "passingScore",
              "trangThai" AS status
            FROM baikiemtra
            WHERE "maBaiHoc" = ${id}::uuid AND "trangThai" = 'CongBo'
            ORDER BY "ngayTao" DESC
          `,
      currentUser.roles.includes('HocVien')
        ? this.prisma.$queryRaw<ProgressStateRow[]>`
            SELECT
              "trangThai" AS status,
              "phanTramHoanThanh" AS "percentComplete",
              "diemCaoNhat" AS "bestScore",
              "ngayBatDau" AS "startedAt",
              "ngayHoanThanh" AS "completedAt"
            FROM tientrinhhoctap
            WHERE "maHocVien" = ${currentUser.id}::uuid
              AND "maBaiHoc" = ${id}::uuid
            LIMIT 1
          `
        : Promise.resolve([] as ProgressStateRow[]),
      currentUser.roles.includes('HocVien')
        ? this.prisma.$queryRaw<TaskCompletionRow[]>`
            SELECT
              ht."maNhiemVu" AS "taskId",
              ht."trangThai" AS status,
              ht."thoiGianHoanThanh" AS "completedAt"
            FROM hoanthanh_nhiemvu ht
            JOIN nhiemvuhoctap nv ON nv."maNhiemVu" = ht."maNhiemVu"
            WHERE ht."maHocVien" = ${currentUser.id}::uuid
              AND nv."maBaiHoc" = ${id}::uuid
          `
        : Promise.resolve([] as TaskCompletionRow[]),
      lessons[0].stageId
      ? this.prisma.$queryRaw<PathRow[]>`
            SELECT
              gd."maGiaiDoan" AS "stageId",
              gd."tenGiaiDoan" AS "stageName",
              gd."thuTu" AS "stageOrder"
            FROM giaidoanhoc gd
            WHERE gd."maGiaiDoan" = ${lessons[0].stageId}::uuid
            LIMIT 1
          `
        : Promise.resolve([] as PathRow[]),
    ]);

    const lessonProgress = progressRows[0] ?? null;
    const taskStatusById = new Map(
      completionRows.map((row) => [
        row.taskId,
        {
          status: row.status,
          completedAt: row.completedAt,
        },
      ]),
    );

    const totalRequiredTasks = tasks.filter((task) => task.required).length || tasks.length || 1;
    const completedRequiredTasks = tasks.filter((task) => task.required && taskStatusById.get(task.id)?.status === 'HoanThanh').length;
    const baseProgress = Math.round((completedRequiredTasks / totalRequiredTasks) * 70);
    const progressPercent = lessonProgress?.percentComplete
      ? Math.max(Number(lessonProgress.percentComplete), baseProgress)
      : baseProgress;

    return {
      ...lessons[0],
      stage: pathRows[0] ?? null,
      progress: lessonProgress
        ? {
            status: lessonProgress.status,
            percentComplete: Number(lessonProgress.percentComplete),
            bestScore: Number(lessonProgress.bestScore),
            startedAt: lessonProgress.startedAt,
            completedAt: lessonProgress.completedAt,
          }
        : null,
      tasks,
      taskProgress: tasks.map((task) => ({
        ...task,
        completed: taskStatusById.has(task.id),
        completedAt: taskStatusById.get(task.id)?.completedAt ?? null,
      })),
      vocabularies,
      grammarPoints,
      resources,
      quizzes,
      progressPercent,
    };
  }

  private findManagementById(id: string) {
    return this.prisma.$queryRaw<LessonManagementRow[]>`
      SELECT
        bh."maBaiHoc" AS id,
        bh."maGiaiDoan" AS "stageId",
        bh."maChuDe" AS "topicId",
        lt."maLoTrinh" AS "pathId",
        bh."tieuDe" AS title,
        bh."moTa" AS description,
        bh."noiDung" AS content,
        bh."capDo" AS level,
        bh."trangThai" AS status,
        bh."ngayTao" AS "createdAt",
        bh."ngayCapNhat" AS "updatedAt",
        lt."tenLoTrinh" AS "pathName",
        gd."tenGiaiDoan" AS "stageName",
        cd."tenChuDe" AS "topicName",
        gd."thuTu" AS "stageOrder",
        bh."thuTu" AS "lessonOrder",
        bh."diemDatYeuCau" AS "passingScore",
        COALESCE(task_counts."tasksCount", 0)::int AS "tasksCount",
        COALESCE(task_counts."requiredTasksCount", 0)::int AS "requiredTasksCount",
        COALESCE(vocab_counts."vocabCount", 0)::int AS "vocabCount",
        COALESCE(grammar_counts."grammarCount", 0)::int AS "grammarCount",
        COALESCE(resource_counts."resourcesCount", 0)::int AS "resourcesCount",
        COALESCE(quiz_counts."quizzesCount", 0)::int AS "quizzesCount",
        COALESCE(quiz_counts."publishedQuizzesCount", 0)::int AS "publishedQuizzesCount"
      FROM baihoc bh
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "tasksCount",
          COUNT(*) FILTER (WHERE nv."batBuoc")::int AS "requiredTasksCount"
        FROM nhiemvuhoctap nv
        WHERE nv."maBaiHoc" = bh."maBaiHoc"
          AND nv."trangThai" = 'HoatDong'
      ) task_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "vocabCount"
        FROM tuvung tv
        WHERE tv."maBaiHoc" = bh."maBaiHoc"
      ) vocab_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "grammarCount"
        FROM nguphap np
        WHERE np."maBaiHoc" = bh."maBaiHoc"
      ) grammar_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "resourcesCount"
        FROM tainguyenhoctap tn
        WHERE tn."maBaiHoc" = bh."maBaiHoc"
      ) resource_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "quizzesCount",
          COUNT(*) FILTER (WHERE bkt."trangThai" = 'CongBo')::int AS "publishedQuizzesCount"
        FROM baikiemtra bkt
        WHERE bkt."maBaiHoc" = bh."maBaiHoc"
      ) quiz_counts ON TRUE
      WHERE bh."maBaiHoc" = ${id}::uuid
      GROUP BY
        bh."maBaiHoc",
        bh."maGiaiDoan",
        bh."maChuDe",
        lt."maLoTrinh",
        bh."tieuDe",
        bh."moTa",
        bh."noiDung",
        bh."capDo",
        bh."trangThai",
        bh."ngayTao",
        bh."ngayCapNhat",
        lt."tenLoTrinh",
        gd."tenGiaiDoan",
        cd."tenChuDe",
        gd."thuTu",
        bh."thuTu",
        bh."diemDatYeuCau"
      LIMIT 1
    `;
  }

  async startLesson(id: string, currentUser: AuthUser) {
    await this.ensureStudentAccess(id, currentUser);

    const started = await this.prisma.$transaction(async (tx) => {
      const [lesson] = await tx.$queryRaw<LessonDetailRow[]>`
        SELECT
          bh."maBaiHoc" AS id,
          bh."thuTu" AS "lessonOrder",
          gd."thuTu" AS "stageOrder"
        FROM baihoc bh
        LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
        WHERE bh."maBaiHoc" = ${id}::uuid
        LIMIT 1
      `;

      if (!lesson) {
        throw new NotFoundException('Không tìm thấy bài học.');
      }

      await tx.$executeRaw`
        INSERT INTO tientrinhhoctap (
          "maHocVien", "maBaiHoc", "trangThai", "phanTramHoanThanh", "diemCaoNhat", "ngayBatDau", "ngayCapNhat"
        )
        VALUES (
          ${currentUser.id}::uuid, ${id}::uuid, 'DangHoc', 10, 0, NOW(), NOW()
        )
        ON CONFLICT ("maHocVien", "maBaiHoc") DO UPDATE
        SET
          "trangThai" = CASE
            WHEN tientrinhhoctap."trangThai" = 'HoanThanh' THEN 'HoanThanh'
            ELSE 'DangHoc'
          END,
          "phanTramHoanThanh" = GREATEST(tientrinhhoctap."phanTramHoanThanh", EXCLUDED."phanTramHoanThanh"),
          "ngayBatDau" = COALESCE(tientrinhhoctap."ngayBatDau", EXCLUDED."ngayBatDau"),
          "ngayCapNhat" = NOW()
      `;

      return tx.$queryRaw<ProgressSummaryRow[]>`
        SELECT
          tt."maTienTrinh" AS id,
          tt."trangThai" AS status,
          tt."phanTramHoanThanh" AS "percentComplete",
          tt."diemCaoNhat" AS "bestScore"
        FROM tientrinhhoctap tt
        WHERE tt."maHocVien" = ${currentUser.id}::uuid
          AND tt."maBaiHoc" = ${id}::uuid
        LIMIT 1
      `;
    });

    return { success: true, progress: started[0] ?? null };
  }

  async completeTask(id: string, taskId: string, currentUser: AuthUser) {
    await this.ensureStudentAccess(id, currentUser);

    const result = await this.prisma.$transaction(async (tx) => {
      const [task] = await tx.$queryRaw<{ id: string; required: boolean }[]>`
        SELECT "maNhiemVu" AS id, "batBuoc" AS required
        FROM nhiemvuhoctap
        WHERE "maNhiemVu" = ${taskId}::uuid
          AND "maBaiHoc" = ${id}::uuid
          AND "trangThai" = 'HoatDong'
        LIMIT 1
      `;

      if (!task) {
        throw new NotFoundException('Không tìm thấy nhiệm vụ.');
      }

      await tx.$executeRaw`
        INSERT INTO hoanthanh_nhiemvu ("maHocVien", "maNhiemVu", "trangThai", "thoiGianHoanThanh")
        VALUES (${currentUser.id}::uuid, ${taskId}::uuid, 'HoanThanh', NOW())
        ON CONFLICT ("maHocVien", "maNhiemVu") DO UPDATE
        SET "trangThai" = 'HoanThanh',
            "thoiGianHoanThanh" = NOW()
      `;

      const counts = await tx.$queryRaw<{ totalRequiredTasks: number; completedRequiredTasks: number }[]>`
        SELECT
          COUNT(*) FILTER (WHERE nv."batBuoc")::int AS "totalRequiredTasks",
          COUNT(*) FILTER (
            WHERE nv."batBuoc" AND ht."trangThai" = 'HoanThanh'
          )::int AS "completedRequiredTasks"
        FROM nhiemvuhoctap nv
        LEFT JOIN hoanthanh_nhiemvu ht
          ON ht."maNhiemVu" = nv."maNhiemVu"
         AND ht."maHocVien" = ${currentUser.id}::uuid
        WHERE nv."maBaiHoc" = ${id}::uuid
          AND nv."trangThai" = 'HoatDong'
      `;

      const totalRequiredTasks = counts[0]?.totalRequiredTasks ?? 0;
      const completedRequiredTasks = counts[0]?.completedRequiredTasks ?? 0;
      const taskProgress = totalRequiredTasks > 0 ? Math.round((completedRequiredTasks / totalRequiredTasks) * 70) : 70;

      await tx.$executeRaw`
        INSERT INTO tientrinhhoctap (
          "maHocVien", "maBaiHoc", "trangThai", "phanTramHoanThanh", "diemCaoNhat", "ngayBatDau", "ngayCapNhat"
        )
        VALUES (
          ${currentUser.id}::uuid, ${id}::uuid, 'DangHoc', ${taskProgress}, 0, NOW(), NOW()
        )
        ON CONFLICT ("maHocVien", "maBaiHoc") DO UPDATE
        SET
          "trangThai" = CASE
            WHEN tientrinhhoctap."trangThai" = 'HoanThanh' THEN 'HoanThanh'
            ELSE 'DangHoc'
          END,
          "phanTramHoanThanh" = GREATEST(tientrinhhoctap."phanTramHoanThanh", EXCLUDED."phanTramHoanThanh"),
          "ngayBatDau" = COALESCE(tientrinhhoctap."ngayBatDau", EXCLUDED."ngayBatDau"),
          "ngayCapNhat" = NOW()
      `;

      return tx.$queryRaw<ProgressSummaryRow[]>`
        SELECT
          tt."maTienTrinh" AS id,
          tt."trangThai" AS status,
          tt."phanTramHoanThanh" AS "percentComplete",
          tt."diemCaoNhat" AS "bestScore"
        FROM tientrinhhoctap tt
        WHERE tt."maHocVien" = ${currentUser.id}::uuid
          AND tt."maBaiHoc" = ${id}::uuid
        LIMIT 1
      `;
    });

    return { success: true, progress: result[0] ?? null };
  }

  private async ensureStudentAccess(id: string, currentUser: AuthUser) {
    if (!currentUser.roles.includes('HocVien')) {
      throw new ForbiddenException('Bạn không có quyền thao tác với bài học này.');
    }

    const [lesson] = await this.prisma.$queryRaw<LessonDetailRow[]>`
      SELECT
        bh."maBaiHoc" AS id,
        bh."thuTu" AS "lessonOrder",
        gd."thuTu" AS "stageOrder"
      FROM baihoc bh
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      WHERE bh."maBaiHoc" = ${id}::uuid
      LIMIT 1
    `;

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học.');
    }

    const progressRows = await this.prisma.$queryRaw<{ status: string }[]>`
      SELECT "trangThai" AS status
      FROM tientrinhhoctap
      WHERE "maHocVien" = ${currentUser.id}::uuid
        AND "maBaiHoc" = ${id}::uuid
      LIMIT 1
    `;
    const status = progressRows[0]?.status;

    if (status && status !== 'BiKhoa') {
      return;
    }

    const priorLessons = await this.prisma.$queryRaw<{ hasPriorLessons: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM baihoc bh
        JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
        WHERE bh."trangThai" = 'CongBo'
          AND (
            gd."thuTu" < ${lesson.stageOrder}
            OR (gd."thuTu" = ${lesson.stageOrder} AND bh."thuTu" < ${lesson.lessonOrder})
          )
      ) AS "hasPriorLessons"
    `;

    if (!status && !priorLessons[0]?.hasPriorLessons) {
      return;
    }

    throw new ForbiddenException('Bài học này đang bị khóa. Hãy hoàn thành bài trước để mở khóa.');
  }

  private async ensureAccess(lesson: LessonDetailRow, currentUser: AuthUser) {
    const isStaff = currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien');
    if (isStaff) {
      return;
    }

    if (!currentUser.roles.includes('HocVien')) {
      throw new ForbiddenException('Bạn không có quyền xem bài học này.');
    }

    const progressRows = await this.prisma.$queryRaw<{ status: string }[]>`
      SELECT "trangThai" AS status
      FROM tientrinhhoctap
      WHERE "maHocVien" = ${currentUser.id}::uuid
        AND "maBaiHoc" = ${lesson.id}::uuid
      LIMIT 1
    `;
    const status = progressRows[0]?.status;

    if (status && status !== 'BiKhoa') {
      return;
    }

    const priorLessons = await this.prisma.$queryRaw<{ hasPriorLessons: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM baihoc bh
        JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
        WHERE bh."trangThai" = 'CongBo'
          AND (
            gd."thuTu" < ${lesson.stageOrder}
            OR (gd."thuTu" = ${lesson.stageOrder} AND bh."thuTu" < ${lesson.lessonOrder})
          )
      ) AS "hasPriorLessons"
    `;

    if (!status && !priorLessons[0]?.hasPriorLessons) {
      return;
    }

    throw new ForbiddenException('Bài học này đang bị khóa. Hãy hoàn thành bài trước để mở khóa.');
  }
}

type LessonDetailRow = {
  id: string;
  title: string;
  description: string;
  content: string;
  level: string;
  passingScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  topicName: string | null;
  stageName: string | null;
  stageOrder: number;
  lessonOrder: number;
  stageId: string | null;
  pathName: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  instruction: string | null;
  type: string;
  required: boolean;
  orderIndex: number;
};

type VocabularyRow = {
  id: string;
  word: string;
  meaning: string;
  phonetic: string | null;
  wordType: string | null;
  example: string | null;
  exampleMeaning: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
};

type GrammarRow = {
  id: string;
  title: string;
  structure: string | null;
  explanation: string | null;
  example: string | null;
  note: string | null;
};

type ResourceRow = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  description: string | null;
};

type QuizRow = {
  id: string;
  title: string;
  type: string;
  durationMinutes: number | null;
  passingScore: number;
  status?: string;
};

type ProgressSummaryRow = {
  id: string;
  status: string;
  percentComplete: number;
  bestScore: number;
};

type ProgressStateRow = {
  status: string;
  percentComplete: number;
  bestScore: number;
  startedAt: Date | null;
  completedAt: Date | null;
};

type TaskCompletionRow = {
  taskId: string;
  status: string;
  completedAt: Date | null;
};

type PathRow = {
  stageId: string | null;
  stageName: string | null;
  stageOrder: number | null;
};
