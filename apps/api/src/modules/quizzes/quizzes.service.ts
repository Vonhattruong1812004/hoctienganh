import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateQuizStatusDto } from './dto/update-quiz-status.dto';

type SqlClient = Pick<PrismaService, '$queryRaw' | '$executeRaw'>;

type QuizQuestionAnswer = {
  id: string;
  content: string;
  orderIndex: number;
  isCorrect?: boolean;
};

type QuizQuestion = {
  id: string;
  content: string;
  type: string;
  score: unknown;
  difficulty: string | null;
  audio: string | null;
  imageUrl: string | null;
  orderIndex: number;
  answers: QuizQuestionAnswer[];
};

type QuizDetail = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  durationMinutes: number | null;
  passingScore: unknown;
  maxAttempts: number | null;
  lessonId: string;
  lessonTitle: string;
  lessonLevel: string | null;
  topicName: string | null;
  stageName: string | null;
  stageOrder: number | null;
  pathName: string | null;
  createdAt: string;
  updatedAt: string;
};

type QuizManagementRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  durationMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  createdAt: string;
  updatedAt: string;
  lessonId: string;
  lessonTitle: string;
  lessonStatus: string;
  lessonLevel: string | null;
  lessonOrder: number;
  topicName: string | null;
  stageName: string | null;
  stageOrder: number | null;
  pathName: string | null;
  questionsCount: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  averageScore: number;
  latestAttemptAt: string | null;
};

type QuizEditableRow = QuizManagementRow;

function isStaff(currentUser: Pick<AuthUser, 'roles'>) {
  return currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien');
}

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async findDetail(id: string, currentUser: AuthUser) {
    const staff = isStaff(currentUser);
    const quiz = await this.findQuizDetail(this.prisma, id, staff);
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    }

    await this.ensureAccessToLesson(quiz.lessonId, currentUser);

    const questions = await this.findQuestions(this.prisma, id, staff);
    return {
      ...quiz,
      questions,
    };
  }

  async create(dto: CreateQuizDto, currentUser: AuthUser) {
    const [lesson] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT "maBaiHoc" AS id
      FROM baihoc
      WHERE "maBaiHoc" = ${dto.lessonId}::uuid
      LIMIT 1
    `;

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học để gắn quiz.');
    }

    const [created] = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO baikiemtra (
        "maBaiHoc",
        "tieuDe",
        "moTa",
        "loaiBaiKiemTra",
        "thoiGianLamBai",
        "diemDatYeuCau",
        "soLanLamToiDa",
        "trangThai",
        "ngayTao"
      )
      VALUES (
        ${dto.lessonId}::uuid,
        ${dto.title.trim()},
        ${dto.description?.trim() ?? null},
        ${dto.type},
        ${dto.durationMinutes ?? null},
        ${dto.passingScore ?? 80},
        ${dto.maxAttempts ?? null},
        ${dto.status ?? 'Nhap'},
        NOW()
      )
      RETURNING "maBaiKiemTra" AS id
    `;

    const [quiz] = await this.findManagementById(created.id);
    return quiz;
  }

  async updateStatus(id: string, dto: UpdateQuizStatusDto) {
    const [existing] = await this.findManagementById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra cần cập nhật.');
    }

    await this.prisma.$executeRaw`
      UPDATE baikiemtra
      SET "trangThai" = ${dto.status}
      WHERE "maBaiKiemTra" = ${id}::uuid
    `;

    const [updated] = await this.findManagementById(id);
    return updated;
  }

  async findManagement() {
    return this.prisma.$queryRaw<QuizManagementRow[]>`
      SELECT
        bkt."maBaiKiemTra" AS id,
        bkt."tieuDe" AS title,
        bkt."moTa" AS description,
        bkt."loaiBaiKiemTra" AS type,
        bkt."trangThai" AS status,
        bkt."thoiGianLamBai" AS "durationMinutes",
        bkt."diemDatYeuCau"::float AS "passingScore",
        bkt."soLanLamToiDa" AS "maxAttempts",
        bkt."ngayTao" AS "createdAt",
        bkt."ngayTao" AS "updatedAt",
        bh."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        bh."trangThai" AS "lessonStatus",
        bh."capDo" AS "lessonLevel",
        bh."thuTu" AS "lessonOrder",
        cd."tenChuDe" AS "topicName",
        gd."tenGiaiDoan" AS "stageName",
        gd."thuTu" AS "stageOrder",
        lt."tenLoTrinh" AS "pathName",
        COALESCE(question_counts."questionsCount", 0)::int AS "questionsCount",
        COALESCE(attempt_counts."attemptsCount", 0)::int AS "attemptsCount",
        COALESCE(attempt_counts."passedAttemptsCount", 0)::int AS "passedAttemptsCount",
        COALESCE(attempt_counts."averageScore", 0)::float AS "averageScore",
        attempt_counts."latestAttemptAt" AS "latestAttemptAt"
      FROM baikiemtra bkt
      LEFT JOIN baihoc bh ON bh."maBaiHoc" = bkt."maBaiHoc"
      LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "questionsCount"
        FROM cauhoi ch
        WHERE ch."maBaiKiemTra" = bkt."maBaiKiemTra"
      ) question_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "attemptsCount",
          COUNT(*) FILTER (WHERE llb."trangThai" = 'Dat')::int AS "passedAttemptsCount",
          ROUND(COALESCE(AVG(llb."phanTramDung"), 0), 1)::float AS "averageScore",
          MAX(llb."thoiGianNopBai") AS "latestAttemptAt"
        FROM lanlambai llb
        WHERE llb."maBaiKiemTra" = bkt."maBaiKiemTra"
      ) attempt_counts ON TRUE
      ORDER BY
        bkt."ngayTao" DESC,
        COALESCE(gd."thuTu", 0),
        bh."thuTu",
        bkt."tieuDe" ASC
    `;
  }

  async submitAttempt(id: string, studentId: string, dto: SubmitQuizAttemptDto) {
    const quiz = await this.findQuizDetail(this.prisma, id, false);
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    }

    await this.ensureAccessToLesson(quiz.lessonId, { id: studentId, roles: ['HocVien'] });

    return this.prisma.$transaction(async (tx) => {
      const questions = await this.findQuestions(tx, id, true);
      if (questions.length === 0) {
        throw new BadRequestException('Bài kiểm tra chưa có câu hỏi.');
      }

      const existingAttempts = await tx.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM lanlambai
        WHERE "maBaiKiemTra" = ${id}::uuid AND "maHocVien" = ${studentId}::uuid
      `;
      const attemptNumber = Number(existingAttempts[0]?.count ?? 0) + 1;
      if (quiz.maxAttempts && attemptNumber > quiz.maxAttempts) {
        throw new BadRequestException('Bạn đã vượt quá số lần làm tối đa.');
      }

      const submittedAt = new Date();
      const attemptRows = await tx.$queryRaw<{ maLanLam: string }[]>`
        INSERT INTO lanlambai (
          "maBaiKiemTra",
          "maHocVien",
          "thoiGianBatDau",
          "lanThu"
        )
        VALUES (
          ${id}::uuid,
          ${studentId}::uuid,
          ${submittedAt},
          ${attemptNumber}
        )
        RETURNING "maLanLam"
      `;

      const attemptId = attemptRows[0]?.maLanLam;
      if (!attemptId) {
        throw new BadRequestException('Không tạo được lần làm bài.');
      }

      const answerByQuestion = new Map(dto.answers.map((answer) => [answer.questionId, answer]));
      let totalScore = 0;
      let earnedScore = 0;
      let correctCount = 0;

      for (const question of questions) {
        const matchedAnswer = answerByQuestion.get(question.id);
        const correctAnswer = question.answers.find((answer) => answer.isCorrect);
        const isCorrect = this.isAnswerCorrect(question.type, matchedAnswer, correctAnswer);
        const questionScore = Number(question.score);
        const earnedQuestionScore = isCorrect ? questionScore : 0;

        totalScore += questionScore;
        earnedScore += earnedQuestionScore;
        if (isCorrect) {
          correctCount += 1;
        }

        await tx.$executeRaw`
          INSERT INTO cautraloihocvien (
            "maLanLam",
            "maCauHoi",
            "maDapAn",
            "noiDungTraLoi",
            "dungSai",
            "diemDatDuoc"
          )
          VALUES (
            ${attemptId}::uuid,
            ${question.id}::uuid,
            ${matchedAnswer?.answerId ?? null}::uuid,
            ${matchedAnswer?.textAnswer ?? null},
            ${isCorrect},
            ${earnedQuestionScore}
          )
        `;
      }

      const percentage = totalScore > 0 ? Number(((earnedScore / totalScore) * 100).toFixed(2)) : 0;
      const passingScore = Number(quiz.passingScore ?? 80);
      const passed = percentage >= passingScore;
      const finalStatus = passed ? 'Dat' : 'KhongDat';
      const lessonStatus = passed ? 'HoanThanh' : 'DangHoc';

      await tx.$executeRaw`
        UPDATE lanlambai
        SET
          "thoiGianNopBai" = ${submittedAt},
          "diemSo" = ${earnedScore},
          "soCauDung" = ${correctCount},
          "soCauSai" = ${questions.length - correctCount},
          "phanTramDung" = ${percentage},
          "trangThai" = ${finalStatus}
        WHERE "maLanLam" = ${attemptId}::uuid
      `;

      const progressRows = await tx.$queryRaw<
        Array<{
          maTienTrinh: string;
          trangThai: string;
          phanTramHoanThanh: unknown;
          diemCaoNhat: unknown;
          ngayBatDau: Date | null;
        }>
      >`
        SELECT
          "maTienTrinh",
          "trangThai",
          "phanTramHoanThanh",
          "diemCaoNhat",
          "ngayBatDau"
        FROM tientrinhhoctap
        WHERE "maHocVien" = ${studentId}::uuid AND "maBaiHoc" = ${quiz.lessonId}::uuid
        LIMIT 1
      `;

      const currentProgress = progressRows[0];
      const previousPercent = currentProgress ? Number(currentProgress.phanTramHoanThanh ?? 0) : 0;
      const previousBestScore = currentProgress ? Number(currentProgress.diemCaoNhat ?? 0) : 0;
      const nextPercent = passed
        ? 100
        : Math.max(previousPercent, Number((percentage > 0 ? percentage : 25).toFixed(2)));
      const nextBestScore = Math.max(previousBestScore, percentage);

      await tx.$executeRaw`
        INSERT INTO tientrinhhoctap (
          "maHocVien",
          "maBaiHoc",
          "trangThai",
          "phanTramHoanThanh",
          "diemCaoNhat",
          "ngayBatDau",
          "ngayHoanThanh"
        )
        VALUES (
          ${studentId}::uuid,
          ${quiz.lessonId}::uuid,
          ${lessonStatus},
          ${nextPercent},
          ${nextBestScore},
          ${submittedAt},
          ${passed ? submittedAt : null}
        )
        ON CONFLICT ("maHocVien", "maBaiHoc") DO UPDATE SET
          "trangThai" = EXCLUDED."trangThai",
          "phanTramHoanThanh" = GREATEST(tientrinhhoctap."phanTramHoanThanh", EXCLUDED."phanTramHoanThanh"),
          "diemCaoNhat" = GREATEST(tientrinhhoctap."diemCaoNhat", EXCLUDED."diemCaoNhat"),
          "ngayBatDau" = COALESCE(tientrinhhoctap."ngayBatDau", EXCLUDED."ngayBatDau"),
          "ngayHoanThanh" = CASE
            WHEN EXCLUDED."trangThai" = 'HoanThanh' THEN COALESCE(EXCLUDED."ngayHoanThanh", tientrinhhoctap."ngayHoanThanh")
            ELSE tientrinhhoctap."ngayHoanThanh"
          END,
          "ngayCapNhat" = CURRENT_TIMESTAMP
      `;

      const nextLesson = await this.findNextLesson(tx, quiz.lessonId);
      if (passed && nextLesson) {
        await this.ensureProgressUnlocked(tx, studentId, nextLesson.id);
      }

      const petReward = passed
        ? { xp: 50, coins: 12, vui: 8, ganBo: 12, mood: 'VuiVe' }
        : { xp: 15, coins: 3, vui: 3, ganBo: 4, mood: 'HocChung' };

      await tx.$executeRaw`
        UPDATE thucunghoctap
        SET
          "diemKinhNghiem" = "diemKinhNghiem" + ${petReward.xp},
          "vang" = "vang" + ${petReward.coins},
          "mucDoVui" = LEAST(100, "mucDoVui" + ${petReward.vui}),
          "mucDoGanBo" = LEAST(100, "mucDoGanBo" + ${petReward.ganBo}),
          "tamTrang" = ${petReward.mood},
          "capDo" = GREATEST(1, (("diemKinhNghiem" + ${petReward.xp}) / 250) + 1),
          "ngayCapNhat" = CURRENT_TIMESTAMP
        WHERE "maNguoiDung" = ${studentId}::uuid
      `;

      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          passingScore,
        },
        attempt: {
          id: attemptId,
          attemptNumber,
          score: Number(earnedScore.toFixed(2)),
          totalScore: Number(totalScore.toFixed(2)),
          percentage,
          passed,
          status: finalStatus,
          correctCount,
          wrongCount: questions.length - correctCount,
        },
        progress: {
          lessonId: quiz.lessonId,
          status: lessonStatus,
          percentComplete: nextPercent,
          bestScore: nextBestScore,
        },
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              title: nextLesson.title,
            }
          : null,
      };
    });
  }

  private async findQuizDetail(client: SqlClient, id: string, includeUnpublished = false): Promise<QuizDetail | null> {
    const quizzes = includeUnpublished
      ? await client.$queryRaw<QuizDetail[]>`
          SELECT
            bkt."maBaiKiemTra" AS id,
            bkt."tieuDe" AS title,
            bkt."moTa" AS description,
            bkt."loaiBaiKiemTra" AS type,
            bkt."trangThai" AS status,
            bkt."thoiGianLamBai" AS "durationMinutes",
            bkt."diemDatYeuCau" AS "passingScore",
            bkt."soLanLamToiDa" AS "maxAttempts",
            bkt."maBaiHoc" AS "lessonId",
            bh."tieuDe" AS "lessonTitle",
            bh."capDo" AS "lessonLevel",
            cd."tenChuDe" AS "topicName",
            gd."tenGiaiDoan" AS "stageName",
            gd."thuTu" AS "stageOrder",
            lt."tenLoTrinh" AS "pathName",
            bkt."ngayTao" AS "createdAt",
            bkt."ngayTao" AS "updatedAt"
          FROM baikiemtra bkt
          LEFT JOIN baihoc bh ON bh."maBaiHoc" = bkt."maBaiHoc"
          LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
          LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
          LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
          WHERE bkt."maBaiKiemTra" = ${id}::uuid
          LIMIT 1
        `
      : await client.$queryRaw<QuizDetail[]>`
          SELECT
            bkt."maBaiKiemTra" AS id,
            bkt."tieuDe" AS title,
            bkt."moTa" AS description,
            bkt."loaiBaiKiemTra" AS type,
            bkt."trangThai" AS status,
            bkt."thoiGianLamBai" AS "durationMinutes",
            bkt."diemDatYeuCau" AS "passingScore",
            bkt."soLanLamToiDa" AS "maxAttempts",
            bkt."maBaiHoc" AS "lessonId",
            bh."tieuDe" AS "lessonTitle",
            bh."capDo" AS "lessonLevel",
            cd."tenChuDe" AS "topicName",
            gd."tenGiaiDoan" AS "stageName",
            gd."thuTu" AS "stageOrder",
            lt."tenLoTrinh" AS "pathName",
            bkt."ngayTao" AS "createdAt",
            bkt."ngayTao" AS "updatedAt"
          FROM baikiemtra bkt
          LEFT JOIN baihoc bh ON bh."maBaiHoc" = bkt."maBaiHoc"
          LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
          LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
          LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
          WHERE bkt."maBaiKiemTra" = ${id}::uuid
            AND bkt."trangThai" = 'CongBo'
          LIMIT 1
        `;

    return quizzes[0] ?? null;
  }

  private async findManagementById(id: string) {
    return this.prisma.$queryRaw<QuizEditableRow[]>`
      SELECT
        bkt."maBaiKiemTra" AS id,
        bkt."tieuDe" AS title,
        bkt."moTa" AS description,
        bkt."loaiBaiKiemTra" AS type,
        bkt."trangThai" AS status,
        bkt."thoiGianLamBai" AS "durationMinutes",
        bkt."diemDatYeuCau"::float AS "passingScore",
        bkt."soLanLamToiDa" AS "maxAttempts",
        bkt."ngayTao" AS "createdAt",
        bkt."ngayTao" AS "updatedAt",
        bh."maBaiHoc" AS "lessonId",
        bh."tieuDe" AS "lessonTitle",
        bh."trangThai" AS "lessonStatus",
        bh."capDo" AS "lessonLevel",
        bh."thuTu" AS "lessonOrder",
        cd."tenChuDe" AS "topicName",
        gd."tenGiaiDoan" AS "stageName",
        gd."thuTu" AS "stageOrder",
        lt."tenLoTrinh" AS "pathName",
        COALESCE(question_counts."questionsCount", 0)::int AS "questionsCount",
        COALESCE(attempt_counts."attemptsCount", 0)::int AS "attemptsCount",
        COALESCE(attempt_counts."passedAttemptsCount", 0)::int AS "passedAttemptsCount",
        COALESCE(attempt_counts."averageScore", 0)::float AS "averageScore",
        attempt_counts."latestAttemptAt" AS "latestAttemptAt"
      FROM baikiemtra bkt
      LEFT JOIN baihoc bh ON bh."maBaiHoc" = bkt."maBaiHoc"
      LEFT JOIN chudehoc cd ON cd."maChuDe" = bh."maChuDe"
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      LEFT JOIN lotrinhhoc lt ON lt."maLoTrinh" = gd."maLoTrinh"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "questionsCount"
        FROM cauhoi ch
        WHERE ch."maBaiKiemTra" = bkt."maBaiKiemTra"
      ) question_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS "attemptsCount",
          COUNT(*) FILTER (WHERE llb."trangThai" = 'Dat')::int AS "passedAttemptsCount",
          ROUND(COALESCE(AVG(llb."phanTramDung"), 0), 1)::float AS "averageScore",
          MAX(llb."thoiGianNopBai") AS "latestAttemptAt"
        FROM lanlambai llb
        WHERE llb."maBaiKiemTra" = bkt."maBaiKiemTra"
      ) attempt_counts ON TRUE
      WHERE bkt."maBaiKiemTra" = ${id}::uuid
      LIMIT 1
    `;
  }

  private async findQuestions(client: SqlClient, id: string, includeCorrectAnswers: boolean) {
    return client.$queryRaw<QuizQuestion[]>`
      SELECT
        ch."maCauHoi" AS id,
        ch."noiDung" AS content,
        ch."loaiCauHoi" AS type,
        ch.diem AS score,
        ch."doKho" AS difficulty,
        ch.audio,
        ch."hinhAnh" AS "imageUrl",
        ch."thuTu" AS "orderIndex",
        COALESCE(
          json_agg(
            json_build_object(
              'id', da."maDapAn",
              'content', da."noiDung",
              'orderIndex', da."thuTu",
              'isCorrect', ${includeCorrectAnswers}::boolean AND da."laDapAnDung"
            )
            ORDER BY da."thuTu"
          ) FILTER (WHERE da."maDapAn" IS NOT NULL),
          '[]'
        ) AS answers
      FROM cauhoi ch
      LEFT JOIN dapan da ON da."maCauHoi" = ch."maCauHoi"
      WHERE ch."maBaiKiemTra" = ${id}::uuid
      GROUP BY ch."maCauHoi"
      ORDER BY ch."thuTu"
    `;
  }

  private isAnswerCorrect(
    questionType: string,
    submittedAnswer: SubmitQuizAttemptDto['answers'][number] | undefined,
    correctAnswer: QuizQuestionAnswer | undefined,
  ) {
    if (!submittedAnswer || !correctAnswer) {
      return false;
    }

    if (questionType === 'DienTu') {
      if (submittedAnswer.answerId) {
        return submittedAnswer.answerId === correctAnswer.id;
      }

      const normalizedText = this.normalizeText(submittedAnswer.textAnswer);
      return normalizedText.length > 0 && normalizedText === this.normalizeText(correctAnswer.content);
    }

    if (submittedAnswer.answerId) {
      return submittedAnswer.answerId === correctAnswer.id;
    }

    if (submittedAnswer.textAnswer) {
      return this.normalizeText(submittedAnswer.textAnswer) === this.normalizeText(correctAnswer.content);
    }

    return false;
  }

  private normalizeText(value: string | null | undefined) {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private async findNextLesson(client: SqlClient, lessonId: string) {
    const lessons = await client.$queryRaw<
      Array<{
        id: string;
        title: string;
      }>
    >`
      SELECT
        bh."maBaiHoc" AS id,
        bh."tieuDe" AS title
      FROM baihoc bh
      LEFT JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      WHERE bh."trangThai" = 'CongBo'
        AND (
          (bh."maGiaiDoan" = (
            SELECT "maGiaiDoan"
            FROM baihoc
            WHERE "maBaiHoc" = ${lessonId}::uuid
            LIMIT 1
          ) AND bh."thuTu" > (
            SELECT "thuTu"
            FROM baihoc
            WHERE "maBaiHoc" = ${lessonId}::uuid
            LIMIT 1
          ))
          OR gd."thuTu" > (
            SELECT gd2."thuTu"
            FROM baihoc bh2
            LEFT JOIN giaidoanhoc gd2 ON gd2."maGiaiDoan" = bh2."maGiaiDoan"
            WHERE bh2."maBaiHoc" = ${lessonId}::uuid
            LIMIT 1
          )
        )
      ORDER BY gd."thuTu", bh."thuTu"
      LIMIT 1
    `;

    return lessons[0] ?? null;
  }

  private async ensureProgressUnlocked(client: SqlClient, studentId: string, lessonId: string) {
    await client.$executeRaw`
      INSERT INTO tientrinhhoctap (
        "maHocVien",
        "maBaiHoc",
        "trangThai",
        "phanTramHoanThanh",
        "diemCaoNhat",
        "ngayBatDau"
      )
      VALUES (
        ${studentId}::uuid,
        ${lessonId}::uuid,
        'ChuaHoc',
        0,
        0,
        NULL
      )
      ON CONFLICT ("maHocVien", "maBaiHoc") DO UPDATE SET
        "trangThai" = CASE
          WHEN tientrinhhoctap."trangThai" = 'BiKhoa' THEN 'ChuaHoc'
          ELSE tientrinhhoctap."trangThai"
        END,
        "ngayCapNhat" = CURRENT_TIMESTAMP
    `;
  }

  private async ensureAccessToLesson(lessonId: string, currentUser: Pick<AuthUser, 'id' | 'roles'>) {
    const isStaff = currentUser.roles.some((role) => role === 'GiaoVien' || role === 'QuanTriVien');
    if (isStaff) {
      return;
    }

    const lessonMeta = await this.prisma.$queryRaw<{ stageOrder: number; lessonOrder: number }[]>`
      SELECT
        gd."thuTu" AS "stageOrder",
        bh."thuTu" AS "lessonOrder"
      FROM baihoc bh
      JOIN giaidoanhoc gd ON gd."maGiaiDoan" = bh."maGiaiDoan"
      WHERE bh."maBaiHoc" = ${lessonId}::uuid
      LIMIT 1
    `;

    if (!lessonMeta[0]) {
      throw new NotFoundException('Không tìm thấy bài học.');
    }

    const progressRows = await this.prisma.$queryRaw<{ status: string | null }[]>`
      SELECT "trangThai" AS status
      FROM tientrinhhoctap
      WHERE "maHocVien" = ${currentUser.id}::uuid
        AND "maBaiHoc" = ${lessonId}::uuid
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
            gd."thuTu" < ${lessonMeta[0].stageOrder}
            OR (gd."thuTu" = ${lessonMeta[0].stageOrder} AND bh."thuTu" < ${lessonMeta[0].lessonOrder})
          )
      ) AS "hasPriorLessons"
    `;

    if (!status && !priorLessons[0]?.hasPriorLessons) {
      return;
    }

    throw new ForbiddenException('Bài kiểm tra này đang bị khóa. Hãy hoàn thành bài học trước đó để mở khóa.');
  }
}
