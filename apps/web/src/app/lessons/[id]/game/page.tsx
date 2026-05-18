'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Gamepad2, LogOut, RotateCcw, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../../../components/theme-toggle';
import { ApiError, apiGet } from '../../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../../lib/session';
import { getLibraryLessonDetail, isLibraryTopicId } from '../../../../lib/topic-library';
import { mergeTopicVocabulary, resolveVocabularyTopic } from '../../../../lib/topic-meta';

type LessonDetail = {
  id: string;
  title: string;
  description: string;
  topicName: string;
  level: string;
  vocabularies: Array<{
    id: string;
    word: string;
    meaning: string;
    phonetic: string | null;
    example: string | null;
    audioUrl: string | null;
  }>;
  quizzes: Array<{ id: string; title: string; status?: string }>;
};

type GameCard = {
  id: string;
  pairId: string;
  kind: 'word' | 'meaning';
  label: string;
  helper: string;
  speakText: string;
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function TopicGamePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const lessonId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('Chọn một thẻ English và một thẻ Nghĩa để ghép cặp.');

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  useEffect(() => {
    if (!session || !lessonId) return;
    const currentSession = session;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        if (isLibraryTopicId(lessonId)) {
          const libraryLesson = getLibraryLessonDetail(lessonId);
          if (active && libraryLesson) setLesson(libraryLesson);
          return;
        }
        const response = await apiGet<LessonDetail>(`/lessons/${lessonId}`, currentSession.accessToken);
        if (active) setLesson(response);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được game chủ đề.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [lessonId, router, session]);

  const topicMeta = useMemo(
    () =>
      lesson
        ? resolveVocabularyTopic({
            title: lesson.title,
            description: lesson.description,
            topicName: lesson.topicName,
          })
        : null,
    [lesson],
  );
  const expandedVocabulary = useMemo(
    () => mergeTopicVocabulary(lesson?.vocabularies, topicMeta),
    [lesson?.vocabularies, topicMeta],
  );
  const gameWords = useMemo(() => shuffle(expandedVocabulary).slice(0, 8), [expandedVocabulary, round]);
  const cards = useMemo(
    () =>
      shuffle(
        gameWords.flatMap((item) => [
          {
            id: `${round}-${item.id}-word`,
            pairId: item.id,
            kind: 'word' as const,
            label: item.word,
            helper: item.phonetic ?? 'English',
            speakText: item.word,
          },
          {
            id: `${round}-${item.id}-meaning`,
            pairId: item.id,
            kind: 'meaning' as const,
            label: item.meaning,
            helper: 'Nghĩa tiếng Việt',
            speakText: `${item.word}. ${item.meaning}. ${item.example ?? ''}`,
          },
        ]),
      ),
    [gameWords, round],
  );
  const completed = gameWords.length > 0 && matchedIds.length === gameWords.length;
  const progress = gameWords.length ? Math.round((matchedIds.length / gameWords.length) * 100) : 0;
  const score = gameWords.length ? Math.max(0, 100 - Math.max(0, moves - gameWords.length) * 6) : 0;
  const firstQuizId = lesson?.quizzes.find((quiz) => quiz.status !== 'An')?.id ?? lesson?.quizzes[0]?.id ?? null;

  function resetGame() {
    setRound((current) => current + 1);
    setSelectedCards([]);
    setMatchedIds([]);
    setMoves(0);
    setMessage('Ván mới đã sẵn sàng. Chọn cặp từ đúng nhé.');
  }

  function selectCard(card: GameCard) {
    if (matchedIds.includes(card.pairId)) return;
    if (selectedCards.some((item) => item.id === card.id)) return;

    const nextSelection = [...selectedCards, card];
    setSelectedCards(nextSelection);

    if (nextSelection.length < 2) {
      setMessage(card.kind === 'word' ? 'Chọn nghĩa tiếng Việt tương ứng.' : 'Chọn từ tiếng Anh tương ứng.');
      return;
    }

    setMoves((current) => current + 1);
    const [first, second] = nextSelection;
    const correct = first.pairId === second.pairId && first.kind !== second.kind;

    if (correct) {
      setMatchedIds((current) => [...current, first.pairId]);
      setMessage('Đúng rồi. Cặp từ đã được khóa.');
    } else {
      setMessage('Chưa khớp. Hãy dựa vào nghĩa và phát âm để chọn lại.');
    }

    window.setTimeout(() => setSelectedCards([]), 650);
  }

  function logout() {
    clearStoredSession();
    router.replace('/login');
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở game...</p>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone lessonDetailStandalone topicGameStandalone">
      <header className="studentUcTopbar">
        <div>
          <p className="eyebrow">Học từ vựng theo chủ đề</p>
          <h1>Game ôn từ vựng</h1>
        </div>
        <div className="topbarActions">
          <ThemeToggleButton />
          <button className="secondaryButton" type="button" onClick={logout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải bộ từ game...</div> : null}

      {lesson ? (
        <section className="topicGameArena">
          <div className="topicGameArenaHeader">
            <div className="topicGameTitleBlock">
              <Link className="backLink" href={`/lessons/${lessonId}/learn`}>
                <ArrowLeft size={16} />
                Về màn học từ vựng
              </Link>
              <p className="eyebrow">{topicMeta?.categoryLabel ?? 'Flash Match'}</p>
              <h2>Flash Match</h2>
              <span>{topicMeta ? `${topicMeta.englishLabel} - ${topicMeta.label}` : 'Đang tải game...'}</span>
            </div>

            <div className="topicGameScoreStrip" aria-label="Thông tin ván chơi">
              <div>
                <strong>{matchedIds.length}/{gameWords.length}</strong>
                <span>Cặp đúng</span>
              </div>
              <div>
                <strong>{moves}</strong>
                <span>Lượt chọn</span>
              </div>
              <div>
                <strong>{score}</strong>
                <span>Điểm</span>
              </div>
              <button className="secondaryButton" type="button" onClick={resetGame}>
                <RotateCcw size={16} />
                Ván mới
              </button>
            </div>
          </div>

          <div className="topicGameStatusBar">
            <Gamepad2 size={18} />
            <strong>{message}</strong>
            <span>{progress}%</span>
            <div className="progressRail">
              <div className="progressFill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <section className="topicGameBoard large">
            {cards.map((card) => {
              const selected = selectedCards.some((item) => item.id === card.id);
              const matched = matchedIds.includes(card.pairId);

              return (
                <article className={`topicGameCardShell ${matched ? 'matched' : ''}`} key={card.id}>
                  <button
                    className={`topicGameCard topicGamePickButton ${card.kind} ${selected ? 'selected' : ''} ${
                      matched ? 'matched' : ''
                    }`}
                    type="button"
                    disabled={matched}
                    onClick={() => selectCard(card)}
                  >
                    {matched ? <CheckCircle2 className="topicGameMatchedIcon" size={18} /> : null}
                    <small>{card.kind === 'word' ? 'English' : 'Nghĩa'}</small>
                    <strong>{card.label}</strong>
                    <span>{card.helper}</span>
                  </button>
                </article>
              );
            })}
          </section>
        </section>
      ) : null}

      {completed ? (
        <section className="topicGameComplete">
          <Trophy size={28} />
          <div>
            <h2>Hoàn thành ván ôn tập</h2>
            <p>Bạn đạt {score} điểm. Có thể quay lại học thêm hoặc làm quiz chốt chủ đề.</p>
          </div>
          <div className="topbarActions">
            <Link className="secondaryButton" href={`/lessons/${lessonId}/learn`}>
              Ôn lại từ
            </Link>
            {firstQuizId ? (
              <Link className="primaryButton" href={`/quizzes/${firstQuizId}`}>
                Làm quiz
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
