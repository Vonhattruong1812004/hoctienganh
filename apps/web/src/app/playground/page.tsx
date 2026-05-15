'use client';

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Camera,
  Flame,
  Gamepad2,
  Heart,
  PlayCircle,
  Sparkles,
  PawPrint,
  Target,
  Trophy,
  Upload,
  ScanSearch,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentHubPanel } from '../../components/content-hub-panel';
import { PetMascot } from '../../components/pet-mascot';
import { PetGarden } from '../../components/pet-garden';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { ApiError, apiGet, apiPost, apiPostForm } from '../../lib/api';
import { getStoredSession, type WebAuthSession } from '../../lib/session';

type GameDashboard = {
  pet: {
    id: string;
    ownerName: string;
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
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: string;
    icon: string | null;
    color: string | null;
    rewardXp: number;
    earnedAt: string;
    level?: string;
  }>;
  quests: Array<{
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
    completedAt: string | null;
  }>;
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
  analyses: Array<{
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
    analyzedAt: string;
  }>;
  stats: {
    totalPlays: number;
  };
  summary: {
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
};

type VisionResponse = {
  imageUrl: string;
  detectedWord: string;
  meaning: string;
  phonetic: string;
  example: string;
  contentType: string;
  vocabularyIdea: string;
  confidence: number;
  history: GameDashboard['analyses'];
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

const flashMatchPairs = [
  { id: 'book', en: 'book', vi: 'quyển sách' },
  { id: 'pen', en: 'pen', vi: 'cây bút' },
  { id: 'apple', en: 'apple', vi: 'quả táo' },
  { id: 'chair', en: 'chair', vi: 'cái ghế' },
] as const;

const petActions = [
  { action: 'Study' as const, label: 'Học cùng', icon: BookOpen },
  { action: 'Play' as const, label: 'Chơi cùng', icon: Gamepad2 },
  { action: 'Feed' as const, label: 'Cho ăn', icon: Heart },
  { action: 'Rest' as const, label: 'Nghỉ ngơi', icon: Flame },
];

function buildFlashMatchDeck(): FlashMatchCard[] {
  return [...flashMatchPairs]
    .flatMap((pair) => [
      { id: `${pair.id}-en`, pairId: pair.id, label: pair.en, language: 'en' as const },
      { id: `${pair.id}-vi`, pairId: pair.id, label: pair.vi, language: 'vi' as const },
    ])
    .sort(() => Math.random() - 0.5);
}

function getMatchScore(moves: number, durationSeconds: number) {
  const timeBonus = Math.max(0, 28 - Math.round(durationSeconds / 6));
  const precisionBonus = Math.max(0, 20 - Math.max(0, moves - flashMatchPairs.length) * 6);
  return Math.min(100, flashMatchPairs.length * 18 + timeBonus + precisionBonus);
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedGameCode, setSelectedGameCode] = useState<string>('');
  const [hint, setHint] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [visionResult, setVisionResult] = useState<VisionResponse | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState('');
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
        setVisionResult({
          imageUrl: '',
          detectedWord: '',
          meaning: '',
          phonetic: '',
          example: '',
          contentType: '',
          vocabularyIdea: '',
          confidence: 0,
          history: response.analyses,
        });
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được sân chơi.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pet = dashboard?.pet;
  const petMood = useMemo(() => normalizeMood(pet?.mood), [pet?.mood]);
  const progress = pet ? Math.min(100, Math.round((pet.xp / Math.max(pet.nextLevelXp, 1)) * 100)) : 0;
  const summary = dashboard?.summary;
  const selectedGame = useMemo(() => {
    if (!dashboard?.games.length) return null;
    return dashboard.games.find((game) => game.code === selectedGameCode) ?? dashboard.games[0];
  }, [dashboard?.games, selectedGameCode]);

  useEffect(() => {
    if (!dashboard?.games.length) return;

    setSelectedGameCode((current) => {
      if (current && dashboard.games.some((game) => game.code === current)) {
        return current;
      }

      return dashboard.summary.bestGameCode ?? dashboard.games[0].code;
    });
  }, [dashboard?.games, dashboard?.summary.bestGameCode]);

  useEffect(() => {
    if (dashboard?.games.length) {
      resetFlashMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame?.code]);

  useEffect(() => {
    return () => {
      if (matchResolveTimer.current) {
        window.clearTimeout(matchResolveTimer.current);
        matchResolveTimer.current = null;
      }
    };
  }, []);

  async function handlePetAction(action: (typeof petActions)[number]['action']) {
    if (!session) return;
    setActionLoading(action);
    try {
      const response = await apiPost<{ pet: GameDashboard['pet']; reward: unknown; message: string }>(
        '/gamification/me/pet/action',
        { action },
        session.accessToken,
      );
      setDashboard((current) =>
        current
          ? {
              ...current,
              pet: response.pet ?? current.pet,
            }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được pet.');
    } finally {
      setActionLoading(null);
    }
  }

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setVisionError('');
    setVisionResult((current) => (current ? { ...current, imageUrl: '' } : current));

    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview('');
    }

    if (nextFile) {
      setPreview(URL.createObjectURL(nextFile));
    }
  }

  async function handleAnalyze() {
    if (!session || !file) {
      setVisionError('Hãy chọn một hình ảnh trước.');
      return;
    }

    setVisionLoading(true);
    setVisionError('');

    try {
      const form = new FormData();
      form.append('image', file);
      if (hint.trim()) {
        form.append('hint', hint.trim());
      }

      const response = await apiPostForm<VisionResponse>('/vision/analyze', form, session.accessToken);
      setVisionResult(response);
      setDashboard((current) =>
        current
          ? {
              ...current,
              analyses: response.history,
              summary: {
                ...current.summary,
                totalAnalyses: current.summary.totalAnalyses + 1,
              },
            }
          : current,
      );
    } catch (err) {
      setVisionError(err instanceof Error ? err.message : 'Không phân tích được ảnh.');
    } finally {
      setVisionLoading(false);
    }
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetFlashMatch() {
    if (matchResolveTimer.current) {
      window.clearTimeout(matchResolveTimer.current);
      matchResolveTimer.current = null;
    }

    setMatchDeck(buildFlashMatchDeck());
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
    if (!selectedGame || selectedGame.code !== 'flash-match') return;
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
    if (!session || !selectedGame) return;
    if (matchSubmitting || matchSubmitted) return;

    setMatchSubmitting(true);
    try {
      const response = await apiPost<GamePlayResponse>(
        `/gamification/games/${selectedGame.id}/play`,
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
          game.id === selectedGame.id && response.game
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
    if (selectedGame?.code !== 'flash-match') return;
    if (matchMatchedPairIds.length !== flashMatchPairs.length) return;
    if (matchSubmitted) return;

    const endedAt = Date.now();
    const duration = matchStartedAt ? Math.max(15, Math.round((endedAt - matchStartedAt) / 1000)) : 15;
    const score = getMatchScore(matchMoves, duration);
    const stars = getStarCount(score);

    setMatchStatus('completed');
    setMatchDuration(duration);
    setMatchScore(score);
    setMatchStars(stars);
    setMatchBanner('Hoàn thành Flash Match. Lượt chơi này sẽ được ghi nhận.');
    void submitFlashMatch(score, stars, duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchMatchedPairIds, selectedGame?.code]);

  useEffect(() => {
    if (selectedGame?.code !== 'flash-match') {
      setMatchFeedback('');
      return;
    }

    if (!matchDeck.length) {
      resetFlashMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame?.code, matchDeck.length]);

  useEffect(() => {
    if (selectedGame?.code !== 'flash-match') return;
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
      setMatchBanner(`Đúng rồi. ${matchMatchedPairIds.length + 1}/${flashMatchPairs.length} cặp đã mở khóa.`);
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
  }, [matchSelectedIds, selectedGame?.code]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang tải sân chơi...</p>
      </main>
    );
  }

  return (
    <main className="playgroundShell">
      <header className="playgroundTopbar">
        <Link className="backLink" href="/dashboard">
          <ArrowLeft size={16} />
          Về dashboard
        </Link>
        <div className="playgroundTitle">
          <p className="eyebrow">Sân chơi học tiếng Anh</p>
          <h1>Pet Pingu, mini game và AI Vision Lab</h1>
        </div>
        <ThemeToggleButton />
      </header>

      {error ? <div className="errorBox">{error}</div> : null}
      {loading && !dashboard ? <div className="subtleBox">Đang tải sân chơi...</div> : null}

      <section className="playgroundIntro panel">
        <div className="playgroundIntroCopy">
          <p className="eyebrow">UC9 • Sử dụng sân chơi học tập</p>
          <h2>Biến tiếng Anh thành chuỗi thử thách có pet, nhiệm vụ, mini game và AI thật.</h2>
          <p>
            Đây là không gian học tập mang tính giải trí của EnglishPro. Mỗi lượt chơi có thể làm
            tăng XP cho Pingu, hoàn thành nhiệm vụ ngày, mở khóa huy hiệu và ghi lại dữ liệu thật
            để hệ thống ngày càng thông minh hơn.
          </p>
          <div className="playgroundActionRail">
            <button className="iconButton" type="button" onClick={() => scrollToSection('playground-pet')}>
              <Heart size={16} />
              Chăm Pingu
            </button>
            <button className="iconButton" type="button" onClick={() => scrollToSection('playground-quests')}>
              <BadgeCheck size={16} />
              Nhiệm vụ ngày
            </button>
            <button className="iconButton" type="button" onClick={() => scrollToSection('playground-games')}>
              <Gamepad2 size={16} />
              Chơi mini game
            </button>
            <button className="iconButton" type="button" onClick={() => scrollToSection('playground-pets')}>
              <PawPrint size={16} />
              Bộ pet
            </button>
            <button className="iconButton" type="button" onClick={() => scrollToSection('playground-content-hub')}>
              <Sparkles size={16} />
              Kho API
            </button>
            <button className="iconButton" type="button" onClick={() => scrollToSection('playground-vision')}>
              <ScanSearch size={16} />
              AI Vision
            </button>
          </div>
        </div>

        <div className="playgroundStatGrid">
          <article className="playgroundStatCard">
            <span>Hoàn thành nhiệm vụ</span>
            <strong>
              {summary ? `${summary.completedQuests}/${summary.totalQuests}` : '0/0'}
            </strong>
            <em>{summary?.questCompletionRate ?? 0}% tiến độ</em>
          </article>
          <article className="playgroundStatCard">
            <span>Mini game</span>
            <strong>{summary?.totalGames ?? 0}</strong>
            <em>{summary?.bestGameName ?? 'Chưa có game nổi bật'}</em>
          </article>
          <article className="playgroundStatCard">
            <span>Lượt chơi</span>
            <strong>{summary?.totalPlays ?? 0}</strong>
            <em>{summary?.bestGameScore ?? 0} điểm cao nhất</em>
          </article>
          <article className="playgroundStatCard">
            <span>AI phân tích</span>
            <strong>{summary?.totalAnalyses ?? 0}</strong>
            <em>{summary?.claimableQuests ?? 0} nhiệm vụ sẵn sàng nhận</em>
          </article>
        </div>
      </section>

      <section id="playground-pet" className="playgroundHero">
        <div className="petStage">
          <PetMascot mood={petMood} level={pet?.level ?? 1} size={260} />
        </div>

        <div className="petPanel">
          <div className="sectionTitle">
            <div>
              <h2>{pet?.name ?? 'Pingu'}</h2>
              <span>{pet?.kind ?? 'Chim cánh cụt học tập'}</span>
            </div>
            <span className="inlineBadge">Bạn đồng hành</span>
          </div>

          <p className="petCopy">
            Pingu lớn lên cùng XP, coin và chuỗi học tập của bạn. Mỗi lần học, chơi hoặc phân tích
            ảnh đều tạo ra một lượt tiến bộ thật trong hệ thống.
          </p>

          <div className="petStats">
            <div>
              <span>XP</span>
              <strong>{pet?.xp ?? 0}</strong>
            </div>
            <div>
              <span>Vàng</span>
              <strong>{pet?.coins ?? 0}</strong>
            </div>
            <div>
              <span>Gắn bó</span>
              <strong>{pet?.bond ?? 0}</strong>
            </div>
            <div>
              <span>Mood</span>
              <strong>{pet?.mood ?? 'VuiVe'}</strong>
            </div>
          </div>

          <div className="progressRail" aria-label="Tiến độ cấp pet">
            <div className="progressFill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progressMeta">
            <span>{progress}% tới cấp tiếp theo</span>
            <span>Lv. {pet?.level ?? 1}</span>
          </div>

          <div className="petActionBar">
            {petActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.action}
                  className="petActionButton"
                  type="button"
                  onClick={() => handlePetAction(item.action)}
                  disabled={actionLoading !== null}
                >
                  <Icon size={16} />
                  {actionLoading === item.action ? 'Đang xử lý...' : item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="playgroundGrid">
        <div id="playground-quests" className="panel questPanel">
          <div className="sectionTitle">
            <div>
              <h2>Nhiệm vụ ngày</h2>
              <span>Hoàn thành để nhận XP, vàng và huy hiệu</span>
            </div>
            <span className="inlineBadge">
              <BadgeCheck size={16} />
              {dashboard?.stats.totalPlays ?? 0} lượt chơi
            </span>
          </div>

          <div className="questList">
            {dashboard?.quests.map((quest) => (
              <article className="questCard" key={quest.id}>
                <div className="questHead">
                  <div>
                    <strong>{quest.title}</strong>
                    <span>{quest.description}</span>
                  </div>
                  <span className={`questState ${quest.claimed ? 'claimed' : quest.status.toLowerCase()}`}>
                    {quest.claimed ? 'Đã nhận' : quest.status === 'HoanThanh' ? 'Hoàn thành' : 'Đang làm'}
                  </span>
                </div>

                <div className="questProgress">
                  <div className="progressRail">
                    <div
                      className="progressFill"
                      style={{ width: `${Math.min(100, (quest.progress / Math.max(quest.target, 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="progressMeta">
                    <span>
                      {quest.progress}/{quest.target}
                    </span>
                    <span>
                      +{quest.rewardXp} XP / +{quest.rewardCoins} vàng
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div id="playground-games" className="panel gamePanel">
          <div className="sectionTitle">
            <div>
              <h2>Mini game</h2>
              <span>Chọn một trò chơi và theo dõi thành tích thật</span>
            </div>
            <span className="inlineBadge">
              <Gamepad2 size={16} />
              {dashboard?.games.length ?? 0} game
            </span>
          </div>

          <div className="gameShowcase">
            <article className="gameFocusCard">
              <div className="gameFocusArt">
                <div className="gameFocusIcon">
                  <Sparkles size={22} />
                </div>
                <div>
                  <strong>{selectedGame?.name ?? 'Chọn một mini game'}</strong>
                  <span>{selectedGame?.description ?? 'Mở một trò chơi để xem thành tích, thưởng và chế độ chơi.'}</span>
                </div>
              </div>

              <div className="gameFocusStats">
                <div>
                  <span>Thể loại</span>
                  <strong>{selectedGame?.type ?? 'Chưa chọn'}</strong>
                </div>
                <div>
                  <span>Cấp độ</span>
                  <strong>{selectedGame?.level ?? 'A1'}</strong>
                </div>
                <div>
                  <span>Thưởng</span>
                  <strong>{selectedGame?.rewardXp ?? 0} XP</strong>
                </div>
                <div>
                  <span>Điểm tốt nhất</span>
                  <strong>{selectedGame?.bestScore ?? 0}</strong>
                </div>
              </div>

              <div className="gameFocusMeta">
                <span>
                  <Trophy size={14} />
                  {selectedGame?.bestStars ?? 0} sao
                </span>
                <span>
                  <PlayCircle size={14} />
                  {selectedGame?.totalPlays ?? 0} lần chơi
                </span>
                <span>
                  <Target size={14} />
                  {selectedGame?.code === dashboard?.summary.bestGameCode ? 'Game nổi bật' : 'Đang mở rộng'}
                </span>
              </div>

              {selectedGame?.code === 'flash-match' ? (
                <div className="matchLab">
                  <div className="matchLabHead">
                    <div>
                      <h3>Flash Match</h3>
                      <span>{matchBanner}</span>
                    </div>
                    <button className="secondaryButton" type="button" onClick={resetFlashMatch}>
                      Chơi lại
                    </button>
                  </div>

                  <div className="matchGrid">
                    {matchDeck.map((card) => {
                      const matched = matchMatchedPairIds.includes(card.pairId);
                      const active = matchSelectedIds.includes(card.id);
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
                        </button>
                      );
                    })}
                  </div>

                  <div className="matchFooter">
                    <div>
                      <span>Ván đấu</span>
                      <strong>{matchStatus === 'completed' ? 'Hoàn thành' : 'Đang chơi'}</strong>
                    </div>
                    <div>
                      <span>Lượt chọn</span>
                      <strong>{matchMoves}</strong>
                    </div>
                    <div>
                      <span>Điểm</span>
                      <strong>{matchScore}</strong>
                    </div>
                    <div>
                      <span>Sao</span>
                      <strong>{matchStars}</strong>
                    </div>
                  </div>

                  {matchFeedback ? <div className="subtleBox">{matchFeedback}</div> : null}
                  {matchSubmitting ? <div className="subtleBox">Đang ghi nhận lượt chơi vào hệ thống...</div> : null}
                  {matchDuration ? (
                    <div className="subtleBox">Thời gian hoàn thành: {matchDuration}s • XP thưởng sẽ được cập nhật vào pet.</div>
                  ) : null}
                </div>
              ) : (
                <div className="subtleBox">
                  Trò chơi này đang ở chế độ xem trước. Chọn {dashboard?.games[0]?.name ?? 'một game khác'} hoặc quay về Flash Match
                  để chơi trực tiếp trong sân chơi.
                </div>
              )}
            </article>

            <div className="gameList">
              {dashboard?.games.map((game) => {
                const active = selectedGame?.id === game.id;
                return (
                  <button
                    className={`gameCard gameCardButton ${active ? 'active' : ''}`}
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGameCode(game.code)}
                  >
                    <div className="gameIcon">
                      {game.code === 'photo-lab' ? <ScanSearch size={18} /> : <PlayCircle size={18} />}
                    </div>
                    <div className="gameBody">
                      <strong>{game.name}</strong>
                      <span>{game.description}</span>
                      <em>
                        {game.type} • {game.level ?? 'A1'} • thưởng {game.rewardXp} XP
                      </em>
                    </div>
                    <div className="gameStats">
                      <span>{game.bestScore} điểm</span>
                      <small>{game.totalPlays} lần chơi</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <PetGarden />

      <ContentHubPanel token={session.accessToken} />

      <section id="playground-vision" className="visionPanel panel">
        <div className="sectionTitle">
          <div>
            <h2>AI Vision Lab</h2>
            <span>Upload ảnh để nhận từ vựng, phiên âm và ví dụ bằng tiếng Anh</span>
          </div>
          <span className="inlineBadge">
            <Camera size={16} />
            Nhận diện hình ảnh
          </span>
        </div>

        <div className="visionGrid">
          <div className="visionUpload">
            <label className="field">
              <span>Gợi ý từ khóa</span>
              <input
                value={hint}
                onChange={(event) => setHint(event.target.value)}
                placeholder="Ví dụ: book, chair, milk..."
              />
            </label>

            <label className="visionDrop">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              />
              <Upload size={18} />
              <strong>Kéo thả hoặc chọn ảnh</strong>
              <span>Ảnh sẽ được nhận diện và đổi thành từ vựng tiếng Anh</span>
            </label>

            <button className="primaryButton fullWidth" type="button" onClick={handleAnalyze} disabled={visionLoading}>
              {visionLoading ? 'Đang phân tích...' : 'Phân tích ảnh'}
            </button>

            {visionError ? <div className="errorBox">{visionError}</div> : null}

            {preview ? (
              <div className="visionPreview">
                <img src={preview} alt="Ảnh xem trước" />
              </div>
            ) : null}
          </div>

          <div className="visionResult">
            <div className="visionResultCard">
              <div className="sectionTitle">
                <div>
                  <h3>Kết quả AI</h3>
                  <span>Hiển thị từ vựng, phát âm và câu ví dụ</span>
                </div>
                <span className="inlineBadge">{visionResult?.confidence ?? 0}%</span>
              </div>

              {visionResult?.detectedWord ? (
                <div className="visionResultBody">
                  <div className="visionWord">
                    <strong>{visionResult.detectedWord}</strong>
                    <span>{visionResult.meaning}</span>
                    <em>{visionResult.phonetic}</em>
                  </div>
                  <p>{visionResult.example}</p>
                  <div className="visionMeta">
                    <span>{visionResult.contentType}</span>
                    <span>{visionResult.vocabularyIdea}</span>
                  </div>
                </div>
              ) : (
                <div className="subtleBox">Tải ảnh lên để nhận kết quả đầu tiên.</div>
              )}
            </div>

            <div className="visionHistory">
              <div className="sectionTitle">
                <div>
                  <h3>Lịch sử gần đây</h3>
                  <span>Những lần nhận diện ảnh gần nhất</span>
                </div>
              </div>

              <div className="historyList">
                {visionResult?.history.map((item) => (
                  <article className="historyCard" key={item.id}>
                    <div>
                      <strong>{item.detectedWord}</strong>
                      <span>{item.meaning}</span>
                    </div>
                    <em>{item.confidence}%</em>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function normalizeMood(mood?: string | null) {
  if (!mood) return 'VuiVe';
  if (mood === 'HocChung' || mood === 'PhanKich' || mood === 'BinhAn' || mood === 'NhoBan') {
    return mood;
  }
  return 'VuiVe';
}
