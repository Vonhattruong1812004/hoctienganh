'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { ApiError, apiGet, apiPost } from '../../lib/api';
import { getStoredSession, type WebAuthSession } from '../../lib/session';

type GameDashboard = {
  pet: {
    id: string;
    name: string;
    kind: string;
    level: number;
    xp: number;
    coins: number;
    mood: string;
    bond: number;
    accessory: string | null;
    nextLevelXp: number;
  } | null;
  games: Array<{
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
  }>;
  stats: {
    totalPlays: number;
  };
  summary: {
    totalGames: number;
    totalPlays: number;
    bestGameName: string | null;
    bestGameCode: string | null;
    bestGameScore: number;
    bestGameStars: number;
  };
};

type GamePlayResponse = {
  message: string;
  reward: {
    xp: number;
    coins: number;
  };
  game: GameDashboard['games'][number] | null;
  pet: GameDashboard['pet'];
  summary: GameDashboard['summary'];
};

type FlashMatchCard = {
  id: string;
  pairId: string;
  label: string;
  language: 'en' | 'vi';
};

type FlashMatchPair = {
  id: string;
  en: string;
  vi: string;
  topic: string;
};

const cardsPerRound = 6;

const flashMatchWordBank: FlashMatchPair[] = [
  { id: 'book', en: 'book', vi: 'quyển sách', topic: 'Cơ bản' },
  { id: 'pen', en: 'pen', vi: 'cây bút', topic: 'Cơ bản' },
  { id: 'apple', en: 'apple', vi: 'quả táo', topic: 'Cơ bản' },
  { id: 'chair', en: 'chair', vi: 'cái ghế', topic: 'Cơ bản' },
  { id: 'mother', en: 'mother', vi: 'mẹ', topic: 'Gia đình' },
  { id: 'father', en: 'father', vi: 'bố/cha', topic: 'Gia đình' },
  { id: 'sister', en: 'sister', vi: 'chị/em gái', topic: 'Gia đình' },
  { id: 'brother', en: 'brother', vi: 'anh/em trai', topic: 'Gia đình' },
  { id: 'grandmother', en: 'grandmother', vi: 'bà', topic: 'Gia đình' },
  { id: 'grandfather', en: 'grandfather', vi: 'ông', topic: 'Gia đình' },
  { id: 'teacher', en: 'teacher', vi: 'giáo viên', topic: 'Lớp học' },
  { id: 'student', en: 'student', vi: 'học sinh', topic: 'Lớp học' },
  { id: 'desk', en: 'desk', vi: 'bàn học', topic: 'Lớp học' },
  { id: 'ruler', en: 'ruler', vi: 'thước kẻ', topic: 'Lớp học' },
  { id: 'eraser', en: 'eraser', vi: 'cục tẩy', topic: 'Lớp học' },
  { id: 'notebook', en: 'notebook', vi: 'vở ghi', topic: 'Lớp học' },
  { id: 'milk', en: 'milk', vi: 'sữa', topic: 'Đồ ăn' },
  { id: 'bread', en: 'bread', vi: 'bánh mì', topic: 'Đồ ăn' },
  { id: 'rice', en: 'rice', vi: 'cơm/gạo', topic: 'Đồ ăn' },
  { id: 'egg', en: 'egg', vi: 'quả trứng', topic: 'Đồ ăn' },
  { id: 'orange', en: 'orange', vi: 'quả cam', topic: 'Đồ ăn' },
  { id: 'water', en: 'water', vi: 'nước', topic: 'Đồ ăn' },
  { id: 'red', en: 'red', vi: 'màu đỏ', topic: 'Màu sắc' },
  { id: 'blue', en: 'blue', vi: 'màu xanh dương', topic: 'Màu sắc' },
  { id: 'green', en: 'green', vi: 'màu xanh lá', topic: 'Màu sắc' },
  { id: 'yellow', en: 'yellow', vi: 'màu vàng', topic: 'Màu sắc' },
  { id: 'black', en: 'black', vi: 'màu đen', topic: 'Màu sắc' },
  { id: 'white', en: 'white', vi: 'màu trắng', topic: 'Màu sắc' },
  { id: 'cat', en: 'cat', vi: 'con mèo', topic: 'Động vật' },
  { id: 'dog', en: 'dog', vi: 'con chó', topic: 'Động vật' },
  { id: 'rabbit', en: 'rabbit', vi: 'con thỏ', topic: 'Động vật' },
  { id: 'turtle', en: 'turtle', vi: 'con rùa', topic: 'Động vật' },
  { id: 'fish', en: 'fish', vi: 'con cá', topic: 'Động vật' },
  { id: 'penguin', en: 'penguin', vi: 'chim cánh cụt', topic: 'Động vật' },
  { id: 'get-up', en: 'get up', vi: 'thức dậy', topic: 'Hoạt động' },
  { id: 'brush', en: 'brush', vi: 'chải', topic: 'Hoạt động' },
  { id: 'study', en: 'study', vi: 'học', topic: 'Hoạt động' },
  { id: 'play', en: 'play', vi: 'chơi', topic: 'Hoạt động' },
  { id: 'sleep', en: 'sleep', vi: 'ngủ', topic: 'Hoạt động' },
  { id: 'listen', en: 'listen', vi: 'nghe', topic: 'Hoạt động' },
  { id: 'happy', en: 'happy', vi: 'vui vẻ', topic: 'Cảm xúc' },
  { id: 'sad', en: 'sad', vi: 'buồn', topic: 'Cảm xúc' },
  { id: 'hungry', en: 'hungry', vi: 'đói', topic: 'Cảm xúc' },
  { id: 'tired', en: 'tired', vi: 'mệt', topic: 'Cảm xúc' },
  { id: 'excited', en: 'excited', vi: 'hào hứng', topic: 'Cảm xúc' },
  { id: 'school', en: 'school', vi: 'trường học', topic: 'Địa điểm' },
  { id: 'home', en: 'home', vi: 'nhà', topic: 'Địa điểm' },
  { id: 'park', en: 'park', vi: 'công viên', topic: 'Địa điểm' },
  { id: 'library', en: 'library', vi: 'thư viện', topic: 'Địa điểm' },
  { id: 'classroom', en: 'classroom', vi: 'phòng học', topic: 'Địa điểm' },
];

function shuffleItems<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildFlashMatchRound() {
  return shuffleItems(flashMatchWordBank).slice(0, cardsPerRound);
}

function buildFlashMatchDeck(pairs: FlashMatchPair[]): FlashMatchCard[] {
  return shuffleItems(
    pairs
    .flatMap((pair) => [
        { id: `${pair.id}-en`, pairId: pair.id, label: pair.en, language: 'en' as const },
        { id: `${pair.id}-vi`, pairId: pair.id, label: pair.vi, language: 'vi' as const },
      ]),
  );
}

function getMatchScore(moves: number, durationSeconds: number, pairCount: number) {
  const timeBonus = Math.max(0, 28 - Math.round(durationSeconds / 6));
  const precisionBonus = Math.max(0, 20 - Math.max(0, moves - pairCount) * 5);
  return Math.min(100, pairCount * 12 + timeBonus + precisionBonus);
}

function getStarCount(score: number) {
  if (score >= 92) return 3;
  if (score >= 78) return 2;
  if (score >= 60) return 1;
  return 0;
}

export default function PlaygroundPage() {
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [dashboard, setDashboard] = useState<GameDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundPairs, setRoundPairs] = useState<FlashMatchPair[]>([]);
  const [matchDeck, setMatchDeck] = useState<FlashMatchCard[]>([]);
  const [matchSelectedIds, setMatchSelectedIds] = useState<string[]>([]);
  const [matchMatchedPairIds, setMatchMatchedPairIds] = useState<string[]>([]);
  const [matchMoves, setMatchMoves] = useState(0);
  const [matchStartedAt, setMatchStartedAt] = useState<number | null>(null);
  const [matchStatus, setMatchStatus] = useState<'ready' | 'playing' | 'completed'>('ready');
  const [matchBanner, setMatchBanner] = useState('Chọn 2 thẻ để ghép từ và nghĩa.');
  const [matchFeedback, setMatchFeedback] = useState('');
  const [matchSubmitting, setMatchSubmitting] = useState(false);
  const [matchSubmitted, setMatchSubmitted] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [matchStars, setMatchStars] = useState(0);
  const [matchDuration, setMatchDuration] = useState(0);
  const matchResolveTimer = useRef<number | null>(null);

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      window.location.replace('/login');
      return;
    }

    setSession(storedSession);
  }, []);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const response = await apiGet<GameDashboard>('/gamification/me', currentSession.accessToken);
        if (!active) return;
        setDashboard(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được trò chơi.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [session]);

  const flashGame = useMemo(() => {
    if (!dashboard?.games.length) return null;
    return dashboard.games.find((game) => game.code === 'flash-match') ?? dashboard.games[0];
  }, [dashboard?.games]);

  const pairCount = Math.max(roundPairs.length, 1);
  const completionPercent = Math.round((matchMatchedPairIds.length / pairCount) * 100);
  const roundTopics = Array.from(new Set(roundPairs.map((pair) => pair.topic))).slice(0, 4);

  useEffect(() => {
    if (flashGame) {
      resetFlashMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashGame?.id]);

  useEffect(() => {
    return () => {
      if (matchResolveTimer.current) {
        window.clearTimeout(matchResolveTimer.current);
        matchResolveTimer.current = null;
      }
    };
  }, []);

  function resetFlashMatch() {
    if (matchResolveTimer.current) {
      window.clearTimeout(matchResolveTimer.current);
      matchResolveTimer.current = null;
    }

    const nextPairs = buildFlashMatchRound();
    setRoundPairs(nextPairs);
    setMatchDeck(buildFlashMatchDeck(nextPairs));
    setMatchSelectedIds([]);
    setMatchMatchedPairIds([]);
    setMatchMoves(0);
    setMatchStartedAt(null);
    setMatchStatus('ready');
    setMatchBanner('Chọn 2 thẻ để ghép từ và nghĩa.');
    setMatchFeedback('');
    setMatchSubmitting(false);
    setMatchSubmitted(false);
    setMatchScore(0);
    setMatchStars(0);
    setMatchDuration(0);
  }

  function handleMatchPick(card: FlashMatchCard) {
    if (!flashGame || flashGame.code !== 'flash-match') return;
    if (matchStatus === 'completed' || matchSubmitting) return;
    if (matchMatchedPairIds.includes(card.pairId) || matchSelectedIds.includes(card.id)) return;

    setMatchStatus('playing');
    if (!matchStartedAt) {
      setMatchStartedAt(Date.now());
    }

    setMatchSelectedIds((current) => {
      if (current.length >= 2) {
        return [card.id];
      }
      return [...current, card.id];
    });
  }

  async function submitFlashMatch(finalScore: number, finalStars: number, finalDuration: number) {
    if (!session || !flashGame) return;
    if (matchSubmitting || matchSubmitted) return;

    setMatchSubmitting(true);
    try {
      const response = await apiPost<GamePlayResponse>(
        `/gamification/games/${flashGame.id}/play`,
        {
          score: finalScore,
          stars: finalStars,
          result: 'HoanThanh',
          durationSeconds: finalDuration,
        },
        session.accessToken,
      );

      setDashboard((current) => {
        if (!current) return current;

        const updatedGames = current.games.map((game) =>
          game.id === flashGame.id && response.game
            ? {
                ...game,
                bestScore: response.game.bestScore,
                bestStars: response.game.bestStars,
                totalPlays: response.game.totalPlays,
              }
            : game,
        );

        return {
          ...current,
          pet: response.pet ?? current.pet,
          games: updatedGames,
          summary: response.summary ?? current.summary,
        };
      });

      setMatchFeedback(response.message);
      setMatchSubmitted(true);
    } catch (err) {
      setMatchFeedback(err instanceof Error ? err.message : 'Không lưu được lượt chơi.');
    } finally {
      setMatchSubmitting(false);
    }
  }

  useEffect(() => {
    if (!flashGame || flashGame.code !== 'flash-match') return;
    if (matchMatchedPairIds.length !== roundPairs.length) return;
    if (matchSubmitted) return;

    const endedAt = Date.now();
    const duration = matchStartedAt ? Math.max(15, Math.round((endedAt - matchStartedAt) / 1000)) : 15;
    const score = getMatchScore(matchMoves, duration, roundPairs.length);
    const stars = getStarCount(score);

    setMatchStatus('completed');
    setMatchDuration(duration);
    setMatchScore(score);
    setMatchStars(stars);
    setMatchBanner('Hoàn thành Flash Match. Lượt chơi đã được ghi nhận.');
    void submitFlashMatch(score, stars, duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchMatchedPairIds, flashGame?.id, roundPairs.length]);

  useEffect(() => {
    if (!flashGame || flashGame.code !== 'flash-match') return;
    if (matchSelectedIds.length !== 2) return;

    const [firstId, secondId] = matchSelectedIds;
    const firstCard = matchDeck.find((item) => item.id === firstId);
    const secondCard = matchDeck.find((item) => item.id === secondId);

    setMatchMoves((current) => current + 1);

    if (firstCard && secondCard && firstCard.pairId === secondCard.pairId && firstCard.language !== secondCard.language) {
      setMatchMatchedPairIds((current) => {
        if (current.includes(firstCard.pairId)) return current;
        return [...current, firstCard.pairId];
      });
      setMatchFeedback(`Ghép đúng: ${firstCard.label} ↔ ${secondCard.label}.`);
      setMatchBanner(`Đúng rồi. ${matchMatchedPairIds.length + 1}/${roundPairs.length} cặp đã mở khóa.`);
      setMatchSelectedIds([]);
      return;
    }

    setMatchFeedback('Chưa khớp. Hãy thử lại.');
    setMatchBanner('Chưa đúng. Xem lại từ và nghĩa rồi chọn tiếp.');
    if (matchResolveTimer.current) {
      window.clearTimeout(matchResolveTimer.current);
    }
    matchResolveTimer.current = window.setTimeout(() => {
      setMatchSelectedIds([]);
      matchResolveTimer.current = null;
    }, 650);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchSelectedIds, flashGame?.id]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang tải trò chơi...</p>
      </main>
    );
  }

  return (
    <main className="playgroundShell gameOnlyShell">
      <header className="playgroundTopbar gameOnlyTopbar">
        <Link className="backLink" href="/dashboard">
          <ArrowLeft size={16} />
          Về dashboard
        </Link>
        <div className="playgroundTitle">
          <p className="eyebrow">UC9 • Sử dụng sân chơi học tập</p>
          <h1>Flash Match</h1>
        </div>
        <ThemeToggleButton />
      </header>

      {error ? <div className="errorBox">{error}</div> : null}
      {loading && !dashboard ? <div className="subtleBox">Đang tải trò chơi...</div> : null}

      <section className="panel gameOnlyHero" aria-label="Tổng quan trò chơi Flash Match">
        <div className="gameOnlyHeroCopy">
          <span className="inlineBadge">
            <Gamepad2 size={16} />
            Một UC, một trò chơi rõ ràng
          </span>
          <h2>Nối từ vựng tiếng Anh với nghĩa tiếng Việt thật nhanh.</h2>
          <p>
            Mỗi ván bốc ngẫu nhiên {cardsPerRound} cặp từ từ kho {flashMatchWordBank.length} từ vựng đa chủ đề,
            tính điểm theo tốc độ và số lượt chọn, rồi lưu kết quả thật vào hệ thống gamification.
          </p>
          <div className="gameOnlyChips">
            <span>
              <Target size={14} />
              {flashMatchWordBank.length} từ trong kho
            </span>
            <span>
              <Sparkles size={14} />
              +{flashGame?.rewardXp ?? 70} XP
            </span>
            <span>
              <Trophy size={14} />
              {flashGame?.bestScore ?? 0} điểm tốt nhất
            </span>
          </div>
          <div className="gameTopicRail" aria-label="Chủ đề của ván hiện tại">
            {roundTopics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </div>

        <div className="gameOnlyStats">
          <div>
            <span>Tiến độ ván</span>
            <strong>{completionPercent}%</strong>
          </div>
          <div>
            <span>Cặp đã đúng</span>
            <strong>
              {matchMatchedPairIds.length}/{roundPairs.length || cardsPerRound}
            </strong>
          </div>
          <div>
            <span>Lượt chọn</span>
            <strong>{matchMoves}</strong>
          </div>
          <div>
            <span>Lượt đã chơi</span>
            <strong>{flashGame?.totalPlays ?? dashboard?.stats.totalPlays ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="gameOnlyLayout" aria-label="Màn chơi chính">
        <div className="panel gameOnlyBoard">
          <div className="sectionTitle">
            <div>
              <h2>Ván chơi Flash Match</h2>
              <span>{matchBanner}</span>
            </div>
            <button className="secondaryButton" type="button" onClick={resetFlashMatch}>
              <RotateCcw size={16} />
              Đổi bộ từ
            </button>
          </div>

          {flashGame?.code === 'flash-match' ? (
            <>
              <div className="matchGrid">
                {matchDeck.map((card) => {
                  const matched = matchMatchedPairIds.includes(card.pairId);
                  const active = matchSelectedIds.includes(card.id);
                  const cardTopic = roundPairs.find((pair) => pair.id === card.pairId)?.topic ?? 'Từ vựng';
                  return (
                    <button
                      key={card.id}
                      className={`matchTile ${matched ? 'matched' : ''} ${active ? 'active' : ''}`}
                      type="button"
                      onClick={() => handleMatchPick(card)}
                      disabled={matched || matchStatus === 'completed'}
                    >
                      <span>{card.language === 'en' ? 'English' : 'Nghĩa'}</span>
                      <strong>{card.label}</strong>
                      <em>{cardTopic}</em>
                    </button>
                  );
                })}
              </div>

              <div className="matchFooter">
                <div>
                  <span>Trạng thái</span>
                  <strong>{matchStatus === 'completed' ? 'Hoàn thành' : matchStatus === 'playing' ? 'Đang chơi' : 'Sẵn sàng'}</strong>
                </div>
                <div>
                  <span>Điểm</span>
                  <strong>{matchScore}</strong>
                </div>
                <div>
                  <span>Sao</span>
                  <strong>{matchStars}</strong>
                </div>
                <div>
                  <span>Thời gian</span>
                  <strong>{matchDuration ? `${matchDuration}s` : '--'}</strong>
                </div>
              </div>

              {matchFeedback ? <div className="subtleBox">{matchFeedback}</div> : null}
              {matchSubmitting ? <div className="subtleBox">Đang lưu kết quả vào hệ thống...</div> : null}
            </>
          ) : (
            <div className="subtleBox">Chưa tìm thấy cấu hình game Flash Match trong dữ liệu.</div>
          )}
        </div>

        <aside className="panel gameOnlyRulePanel">
          <div className="sectionTitle">
            <div>
              <h2>Luật chơi</h2>
              <span>Ngắn gọn, đúng mục tiêu UC</span>
            </div>
          </div>

          <div className="gameRuleList">
            <div>
              <CheckCircle2 size={18} />
              <span>Chọn một thẻ English và một thẻ Nghĩa.</span>
            </div>
            <div>
              <CheckCircle2 size={18} />
              <span>Ghép đúng để khóa cặp và tăng tiến độ.</span>
            </div>
            <div>
              <CheckCircle2 size={18} />
              <span>Hoàn thành {roundPairs.length || cardsPerRound} cặp để hệ thống tính điểm, sao và XP.</span>
            </div>
          </div>

          <div className="gameOnlyProgressCard">
            <span>Điểm tốt nhất</span>
            <strong>{flashGame?.bestScore ?? 0}</strong>
            <em>{flashGame?.bestStars ?? 0} sao • {flashGame?.totalPlays ?? 0} lượt chơi</em>
          </div>

          <div className="subtleBox">
            Pet, nhiệm vụ ngày, AI Vision và kho API đã được tách khỏi UC này để dashboard giữ vai trò tổng quan.
          </div>

          <Link className="primaryButton fullWidth" href="/dashboard">
            <PlayCircle size={16} />
            Về dashboard
          </Link>
        </aside>
      </section>
    </main>
  );
}
