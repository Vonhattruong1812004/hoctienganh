import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type PetRow = {
  id: string;
  fullName: string;
  name: string;
  kind: string;
  level: number;
  xp: number;
  coins: number;
  mood: string;
  bond: number;
  accessory: string | null;
};

type BadgeRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  color: string | null;
  rewardXp: number;
  earnedAt: Date;
};

type QuestRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  icon: string | null;
  progress: number;
  status: string;
  claimed: boolean;
  completedAt: Date | null;
};

type GameRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  level: string | null;
  rewardXp: number;
  imageUrl: string | null;
  bestScore: number;
  bestStars: number;
  totalPlays: number;
};

type AnalysisRow = {
  id: string;
  imageName: string | null;
  imageUrl: string;
  inputKeyword: string | null;
  detectedWord: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  vocabularyIdea: string | null;
  confidence: number;
  contentType: string;
  provider: string;
  analyzedAt: Date;
};

type DashboardSummary = {
  totalQuests: number;
  completedQuests: number;
  activeQuests: number;
  claimableQuests: number;
  questCompletionRate: number;
  totalGames: number;
  totalAnalyses: number;
  totalPlays: number;
  bestGameName: string | null;
  bestGameCode: string | null;
  bestGameScore: number;
  bestGameStars: number;
};

const actionRewards: Record<
  'Feed' | 'Play' | 'Study' | 'Rest',
  { xp: number; coins: number; mood: string; bond: number; happiness: number }
> = {
  Feed: { xp: 30, coins: 10, mood: 'VuiVe', bond: 10, happiness: 12 },
  Play: { xp: 25, coins: 8, mood: 'PhanKich', bond: 15, happiness: 18 },
  Study: { xp: 45, coins: 15, mood: 'HocChung', bond: 12, happiness: 6 },
  Rest: { xp: 15, coins: 4, mood: 'BinhAn', bond: 6, happiness: 20 },
};

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    await this.ensurePet(userId);

    const [petRows, badgeRows, questRows, gameRows, analysisRows, playRows, analysisCountRows] = await Promise.all([
      this.prisma.$queryRaw<PetRow[]>`
        SELECT
          pc."maThuCung" AS id,
          nd."hoTen" AS "fullName",
          pc."tenThuCung" AS name,
          pc."loaiThuCung" AS kind,
          pc."capDo" AS level,
          pc."diemKinhNghiem" AS xp,
          pc."vang" AS coins,
          pc."tamTrang" AS mood,
          pc."mucDoGanBo" AS bond,
          pc."phuKien" AS accessory
        FROM thucunghoctap pc
        JOIN nguoidung nd ON nd."maNguoiDung" = pc."maNguoiDung"
        WHERE pc."maNguoiDung" = ${userId}::uuid
        LIMIT 1
      `,
      this.prisma.$queryRaw<BadgeRow[]>`
        SELECT
          hh."maHuyHieu" AS id,
          hh."maCode" AS code,
          hh."tenHuyHieu" AS name,
          hh."moTa" AS description,
          hh."loaiHuyHieu" AS type,
          hh."icon" AS icon,
          hh."mauSac" AS color,
          hh."diemThuong" AS "rewardXp",
          ndh."ngayNhan" AS "earnedAt"
        FROM nguoidung_huyhieu ndh
        JOIN huyhieuhoctap hh ON hh."maHuyHieu" = ndh."maHuyHieu"
        WHERE ndh."maNguoiDung" = ${userId}::uuid
        ORDER BY ndh."ngayNhan" DESC
      `,
      this.getDailyQuests(userId),
      this.prisma.$queryRaw<GameRow[]>`
        SELECT
          mg."maMiniGame" AS id,
          mg."maCode" AS code,
          mg."tenMiniGame" AS name,
          mg."moTa" AS description,
          mg."loaiMiniGame" AS type,
          mg."capDo" AS level,
          mg."diemThuong" AS "rewardXp",
          mg."hinhAnh" AS "imageUrl",
          COALESCE(MAX(lg."diemSo"), 0)::int AS "bestScore",
          COALESCE(MAX(lg."soSao"), 0)::int AS "bestStars",
          COALESCE(COUNT(lg."maLanChoi"), 0)::int AS "totalPlays"
        FROM minigame mg
        LEFT JOIN lanchoigame lg
          ON lg."maMiniGame" = mg."maMiniGame"
         AND lg."maNguoiDung" = ${userId}::uuid
        WHERE mg."trangThai" = 'HoatDong'
        GROUP BY
          mg."maMiniGame",
          mg."maCode",
          mg."tenMiniGame",
          mg."moTa",
          mg."loaiMiniGame",
          mg."capDo",
          mg."diemThuong",
          mg."hinhAnh"
        ORDER BY mg."ngayTao" DESC
      `,
      this.prisma.$queryRaw<AnalysisRow[]>`
        SELECT
          pt."maPhanTich" AS id,
          pt."tenTapTin" AS "imageName",
          pt."duongDanAnh" AS "imageUrl",
          pt."tuKhoaNhap" AS "inputKeyword",
          pt."tuKhoaNhanRa" AS "detectedWord",
          pt."nghiaTiengViet" AS meaning,
          pt."phienAm" AS phonetic,
          pt."cauViDu" AS example,
          pt."yTuongTuVung" AS "vocabularyIdea",
          pt."doTinCay" AS confidence,
          pt."loaiNoiDung" AS "contentType",
          pt."nguonNhanDang" AS provider,
          pt."ngayPhanTich" AS "analyzedAt"
        FROM phantichhinhanh pt
        WHERE pt."maNguoiDung" = ${userId}::uuid
        ORDER BY pt."ngayPhanTich" DESC
        LIMIT 6
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM lanchoigame
        WHERE "maNguoiDung" = ${userId}::uuid
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM phantichhinhanh
        WHERE "maNguoiDung" = ${userId}::uuid
      `,
    ]);

    const completedQuests = questRows.filter((quest) => quest.status === 'HoanThanh').length;
    const activeQuests = questRows.filter((quest) => quest.status === 'DangLam').length;
    const claimableQuests = questRows.filter((quest) => quest.status === 'HoanThanh' && !quest.claimed).length;
    const bestGame = gameRows.reduce<GameRow | null>((best, current) => {
      if (!best) return current;
      if (current.bestScore > best.bestScore) return current;
      if (current.bestScore === best.bestScore && current.bestStars > best.bestStars) return current;
      if (current.bestScore === best.bestScore && current.bestStars === best.bestStars && current.totalPlays > best.totalPlays) {
        return current;
      }
      return best;
    }, null);

    return {
      pet: this.mapPet(petRows[0] ?? null),
      badges: badgeRows.map((badge) => ({
        ...badge,
        level: badge.rewardXp >= 60 ? 'Cao' : badge.rewardXp >= 40 ? 'Trung bình' : 'Khởi động',
      })),
      quests: questRows,
      games: gameRows,
      analyses: analysisRows,
      summary: {
        totalQuests: questRows.length,
        completedQuests,
        activeQuests,
        claimableQuests,
        questCompletionRate: questRows.length ? Math.round((completedQuests / questRows.length) * 100) : 0,
        totalGames: gameRows.length,
        totalAnalyses: Number(analysisCountRows[0]?.count ?? 0),
        totalPlays: Number(playRows[0]?.count ?? 0),
        bestGameName: bestGame?.name ?? null,
        bestGameCode: bestGame?.code ?? null,
        bestGameScore: bestGame?.bestScore ?? 0,
        bestGameStars: bestGame?.bestStars ?? 0,
      } satisfies DashboardSummary,
      stats: {
        totalPlays: Number(playRows[0]?.count ?? 0),
      },
    };
  }

  async getGames(userId: string) {
    return this.getDashboard(userId).then((dashboard) => dashboard.games);
  }

  async getDailyQuests(userId: string) {
    return this.prisma.$queryRaw<QuestRow[]>`
      SELECT
        nq."maNhiemVuNgay" AS id,
        nq."maCode" AS code,
        nq."tieuDe" AS title,
        nq."moTa" AS description,
        nq."loaiNhiemVu" AS type,
        nq."mucTieu" AS target,
        nq."xpThuong" AS "rewardXp",
        nq."vangThuong" AS "rewardCoins",
        nq."icon" AS icon,
        COALESCE(ndq."soTienDo", 0)::int AS progress,
        COALESCE(ndq."trangThai", 'DangLam') AS status,
        COALESCE(ndq."daNhanThuong", FALSE) AS claimed,
        ndq."ngayHoanThanh" AS "completedAt"
      FROM nhiemvungay nq
      LEFT JOIN nguoidung_nhiemvungay ndq
        ON ndq."maNhiemVuNgay" = nq."maNhiemVuNgay"
       AND ndq."maNguoiDung" = ${userId}::uuid
      WHERE nq."trangThai" = 'HoatDong'
      ORDER BY nq."ngayTao" DESC
    `;
  }

  async recordGamePlay(
    userId: string,
    gameId: string,
    dto: { score: number; stars: number; result?: string; durationSeconds?: number },
  ) {
    await this.ensurePet(userId);

    const gameRows = await this.prisma.$queryRaw<GameRow[]>`
      SELECT
        mg."maMiniGame" AS id,
        mg."maCode" AS code,
        mg."tenMiniGame" AS name,
        mg."moTa" AS description,
        mg."loaiMiniGame" AS type,
        mg."capDo" AS level,
        mg."diemThuong" AS "rewardXp",
        mg."hinhAnh" AS "imageUrl",
        COALESCE(MAX(lg."diemSo"), 0)::int AS "bestScore",
        COALESCE(MAX(lg."soSao"), 0)::int AS "bestStars",
        COALESCE(COUNT(lg."maLanChoi"), 0)::int AS "totalPlays"
      FROM minigame mg
      LEFT JOIN lanchoigame lg
        ON lg."maMiniGame" = mg."maMiniGame"
       AND lg."maNguoiDung" = ${userId}::uuid
      WHERE mg."trangThai" = 'HoatDong'
        AND mg."maMiniGame" = ${gameId}::uuid
      GROUP BY
        mg."maMiniGame",
        mg."maCode",
        mg."tenMiniGame",
        mg."moTa",
        mg."loaiMiniGame",
        mg."capDo",
        mg."diemThuong",
        mg."hinhAnh"
      LIMIT 1
    `;

    const game = gameRows[0];
    if (!game) {
      throw new NotFoundException('Không tìm thấy mini game.');
    }

    const rewardCoins = Math.max(5, Math.round(game.rewardXp / 6));
    const rewardMood = dto.stars >= 3 ? 'PhanKich' : dto.stars === 2 ? 'VuiVe' : 'HocChung';

    await this.prisma.$executeRaw`
      INSERT INTO lanchoigame (
        "maNguoiDung", "maMiniGame", "diemSo", "soSao", "ketQua", "thoiGianChoi"
      )
      VALUES (
        ${userId}::uuid,
        ${gameId}::uuid,
        ${dto.score},
        ${dto.stars},
        ${dto.result ?? 'HoanThanh'},
        ${dto.durationSeconds ?? null}
      )
    `;

    await this.prisma.$executeRaw`
      UPDATE thucunghoctap
      SET
        "diemKinhNghiem" = "diemKinhNghiem" + ${game.rewardXp},
        "vang" = "vang" + ${rewardCoins},
        "mucDoVui" = LEAST(100, "mucDoVui" + ${dto.stars >= 3 ? 10 : dto.stars === 2 ? 8 : 5}),
        "mucDoGanBo" = LEAST(100, "mucDoGanBo" + ${dto.stars >= 3 ? 8 : dto.stars === 2 ? 6 : 4}),
        "tamTrang" = ${rewardMood},
        "capDo" = GREATEST(1, (("diemKinhNghiem" + ${game.rewardXp}) / 250) + 1),
        "ngayCapNhat" = CURRENT_TIMESTAMP
      WHERE "maNguoiDung" = ${userId}::uuid
    `;

    const dashboard = await this.getDashboard(userId);
    const refreshedGame = dashboard.games.find((item) => item.id === game.id) ?? null;

    return {
      message:
        dto.result === 'DatKyLuc'
          ? 'Bài chơi này vừa được ghi nhận như một kỷ lục mới.'
          : 'Đã ghi nhận lượt chơi và cập nhật tiến trình sân chơi.',
      reward: {
        xp: game.rewardXp,
        coins: rewardCoins,
      },
      game: refreshedGame,
      pet: dashboard.pet,
      summary: dashboard.summary,
    };
  }

  async performPetAction(userId: string, action: keyof typeof actionRewards) {
    await this.ensurePet(userId);
    const reward = actionRewards[action];

    const pets = await this.prisma.$queryRaw<PetRow[]>`
      UPDATE thucunghoctap
      SET
        "diemKinhNghiem" = "diemKinhNghiem" + ${reward.xp},
        "vang" = "vang" + ${reward.coins},
        "mucDoVui" = LEAST(100, "mucDoVui" + ${reward.happiness}),
        "mucDoGanBo" = LEAST(100, "mucDoGanBo" + ${reward.bond}),
        "tamTrang" = ${reward.mood},
        "capDo" = GREATEST(1, (("diemKinhNghiem" + ${reward.xp}) / 250) + 1),
        "ngayCapNhat" = CURRENT_TIMESTAMP
      WHERE "maNguoiDung" = ${userId}::uuid
      RETURNING "maThuCung" AS id
    `;

    if (!pets[0]) {
      throw new BadRequestException('Không cập nhật được pet.');
    }

    const dashboard = await this.getDashboard(userId);
    return {
      pet: dashboard.pet,
      reward,
      message: this.getPetMessage(action),
    };
  }

  private async ensurePet(userId: string) {
    const userRows = await this.prisma.$queryRaw<{ fullName: string }[]>`
      SELECT "hoTen" AS "fullName"
      FROM nguoidung
      WHERE "maNguoiDung" = ${userId}::uuid
      LIMIT 1
    `;

    if (!userRows[0]) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    await this.prisma.$executeRaw`
      INSERT INTO thucunghoctap (
        "maNguoiDung", "tenThuCung", "loaiThuCung", "capDo",
        "diemKinhNghiem", "vang", "mucDoVui", "mucDoGanBo", "tamTrang", "phuKien"
      )
      VALUES (
        ${userId}::uuid,
        'Pingu',
        'ChimCanhCut',
        1,
        0,
        0,
        88,
        50,
        'VuiVe',
        'Khong'
      )
      ON CONFLICT ("maNguoiDung") DO NOTHING
    `;
  }

  private mapPet(row: PetRow | null) {
    if (!row) return null;

    return {
      id: row.id,
      ownerName: row.fullName,
      name: row.name,
      kind: row.kind,
      level: row.level,
      xp: row.xp,
      coins: row.coins,
      mood: row.mood,
      bond: row.bond,
      accessory: row.accessory,
      nextLevelXp: row.level * 250,
    };
  }

  private getPetMessage(action: keyof typeof actionRewards) {
    switch (action) {
      case 'Feed':
        return 'Pingu no bụng và vui hơn rồi.';
      case 'Play':
        return 'Pingu nhảy nhót cực sung.';
      case 'Study':
        return 'Pingu đang học chăm lắm.';
      case 'Rest':
        return 'Pingu đã được nạp lại năng lượng.';
      default:
        return 'Pingu rất vui.';
    }
  }
}
