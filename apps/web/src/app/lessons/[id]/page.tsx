'use client';

import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  Clock3,
  BookOpen,
  FileText,
  Gamepad2,
  ImageIcon,
  Link2,
  LockKeyhole,
  LogOut,
  MicVocal,
  PlayCircle,
  ShieldCheck,
  Shuffle,
  Trophy,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { SpeechButton } from '../../../components/speech-button';
import { ThemeToggleButton } from '../../../components/theme-toggle';
import { ApiError, apiGet, apiPost, resolveApiAssetUrl } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';
import { getLibraryLessonDetail, isLibraryTopicId } from '../../../lib/topic-library';
import { resolveVocabularyTopic } from '../../../lib/topic-meta';

type LessonDetail = {
  id: string;
  title: string;
  description: string;
  content: string;
  level: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  passingScore: number;
  topicName: string;
  stageName?: string | null;
  pathName?: string | null;
  tasks: Array<{
    id: string;
    title: string;
    instruction: string;
    type: string;
    required: boolean;
    orderIndex: number;
  }>;
  vocabularies: Array<{
    id: string;
    word: string;
    meaning: string;
    phonetic: string | null;
    wordType: string | null;
    example: string | null;
    exampleMeaning: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
  }>;
  grammarPoints: Array<{
    id: string;
    title: string;
    structure: string | null;
    explanation: string | null;
    example: string | null;
    note: string | null;
  }>;
  resources: Array<{
    id: string;
    name: string;
    type: string;
    url: string | null;
    description: string | null;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    type: string;
    durationMinutes: number | null;
    passingScore: number;
    status?: string;
  }>;
  taskProgress: Array<{
    id: string;
    title: string;
    instruction: string;
    type: string;
    required: boolean;
    orderIndex: number;
    completed: boolean;
    completedAt: string | null;
  }>;
  progress: {
    status: string;
    percentComplete: number;
    bestScore: number;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  progressPercent: number;
  stage: {
    stageId: string | null;
    stageName: string | null;
    stageOrder: number | null;
  } | null;
};

type SmartImageSearchResponse = {
  analysisProvider?: string;
  images: Array<{
    title: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    source: string;
    creator: string | null;
    license: string | null;
    sourceUrl: string | null;
    relevanceScore?: number;
    aiScore?: number | null;
    metadataScore?: number;
    accepted?: boolean;
    reason?: string;
    analysisProvider?: string;
  }>;
  warnings: string[];
};

type TopicGameCard = {
  id: string;
  pairId: string;
  label: string;
  subLabel: string;
  kind: 'word' | 'meaning';
};

const statusLabels: Record<string, string> = {
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
  CongBo: 'Đã công bố',
  Nhap: 'Bản nháp',
  LuuTru: 'Lưu trữ',
  An: 'Đang ẩn',
};

function formatApiError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    try {
      const body = JSON.parse(err.body) as { message?: string; error?: string };
      return body.message ?? body.error ?? fallback;
    } catch {
      return err.body || fallback;
    }
  }

  return err instanceof Error ? err.message : fallback;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildFallbackImage(title: string, subtitle?: string | null) {
  const safeTitle = escapeSvgText(title || 'EnglishPro');
  const safeSubtitle = escapeSvgText(subtitle || 'Learning image');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="45%" stop-color="#dcfce7"/>
          <stop offset="100%" stop-color="#ffedd5"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#0f172a" flood-opacity=".18"/>
        </filter>
      </defs>
      <rect width="900" height="540" rx="34" fill="url(#bg)"/>
      <circle cx="760" cy="104" r="54" fill="#fde047"/>
      <path d="M0 392 L158 270 L270 360 L402 236 L560 382 L690 292 L900 406 L900 540 L0 540 Z" fill="#86efac" opacity=".72"/>
      <path d="M0 422 H900 V540 H0 Z" fill="#22c55e" opacity=".82"/>
      <g filter="url(#shadow)">
        <rect x="130" y="108" width="640" height="250" rx="28" fill="#ffffff" opacity=".9"/>
        <circle cx="224" cy="214" r="70" fill="#38bdf8" opacity=".82"/>
        <path d="M198 218 Q224 250 250 218" fill="none" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/>
        <circle cx="202" cy="196" r="10" fill="#0f172a"/>
        <circle cx="246" cy="196" r="10" fill="#0f172a"/>
        <text x="326" y="208" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="900" fill="#0f172a">${safeTitle}</text>
        <text x="326" y="266" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#475569">${safeSubtitle}</text>
      </g>
      <text x="130" y="466" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="#075985">EnglishPro visual learning</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const blockedVisualWords = new Set([
  'ability',
  'accept',
  'achieve',
  'advice',
  'agree',
  'answer',
  'available',
  'basic',
  'benefit',
  'change',
  'choose',
  'clear',
  'common',
  'complete',
  'correct',
  'create',
  'decide',
  'describe',
  'different',
  'difficult',
  'enough',
  'example',
  'explain',
  'important',
  'improve',
  'include',
  'information',
  'interest',
  'main',
  'manage',
  'need',
  'notice',
  'offer',
  'order',
  'plan',
  'practice',
  'problem',
  'reason',
  'remember',
  'repeat',
  'request',
  'review',
  'same',
  'search',
  'select',
  'simple',
  'solve',
  'support',
  'target',
  'think',
  'try',
  'understand',
  'useful',
  'work',
]);

function shouldFetchRemoteLearningImage(title: string) {
  const normalized = title.toLowerCase().trim();
  if (!normalized || blockedVisualWords.has(normalized)) return false;
  if (/expression \d+/i.test(normalized)) return false;
  return true;
}

function shuffleCards(cards: TopicGameCard[]) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function LearningImage({
  src,
  title,
  subtitle,
  query,
  className = 'vocabImage',
}: {
  src: string | null | undefined;
  title: string;
  subtitle?: string | null;
  query?: string;
  className?: string;
}) {
  const resolvedSrc = resolveApiAssetUrl(src) ?? src ?? '';
  const fallbackSrc = buildFallbackImage(title, subtitle);
  const [imageSrc, setImageSrc] = useState(resolvedSrc || fallbackSrc);
  const [remoteAttempted, setRemoteAttempted] = useState(false);
  const [credit, setCredit] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setImageSrc(resolvedSrc || fallbackSrc);
    setRemoteAttempted(false);
    setCredit(null);

    const queryText = (query ?? `${title} ${subtitle ?? ''} English vocabulary illustration`).trim();
    if (queryText.length < 2 || !shouldFetchRemoteLearningImage(title)) return () => {
      active = false;
    };

    const loadSmartImage = async () => {
      try {
        const params = new URLSearchParams({
          query: title,
          meaning: subtitle ?? '',
          context: queryText,
          limit: '6',
        });
        const response = await apiGet<SmartImageSearchResponse>(`/integrations/smart-images?${params.toString()}`);
        if (!active) return;

        const candidate = response.images.find(
          (item) => item.accepted !== false && (item.relevanceScore ?? 0) >= 70 && (item.thumbnailUrl || item.imageUrl),
        );
        const remoteSrc = candidate?.thumbnailUrl ?? candidate?.imageUrl ?? null;

        if (candidate && remoteSrc) {
          setImageSrc(remoteSrc);
          setCredit(
            [
              candidate.source,
              candidate.creator,
              candidate.license,
              candidate.analysisProvider === 'openai-vision'
                ? `AI ${candidate.aiScore ?? candidate.relevanceScore}/100`
                : `lọc ảnh ${candidate.relevanceScore ?? candidate.metadataScore}/100`,
            ]
              .filter(Boolean)
              .join(' • '),
          );
        }
      } catch {
        // Nếu nguồn ảnh/AI chậm, giữ ảnh local hoặc fallback để bài học vẫn mượt.
      }
    };

    void loadSmartImage();

    return () => {
      active = false;
    };
  }, [resolvedSrc, fallbackSrc, query, subtitle, title]);

  async function handleImageError() {
    if (!remoteAttempted) {
      setRemoteAttempted(true);

      const queryText = (query ?? `${title} ${subtitle ?? ''} English vocabulary illustration`).trim();
      if (queryText.length >= 2 && shouldFetchRemoteLearningImage(title)) {
        try {
          const params = new URLSearchParams({
            query: title,
            meaning: subtitle ?? '',
            context: queryText,
            limit: '4',
          });
          const response = await apiGet<SmartImageSearchResponse>(`/integrations/smart-images?${params.toString()}`);
          const candidate = response.images.find(
            (item) => item.accepted !== false && (item.relevanceScore ?? 0) >= 70 && (item.thumbnailUrl || item.imageUrl),
          );
          const remoteSrc = candidate?.thumbnailUrl ?? candidate?.imageUrl ?? null;

          if (remoteSrc) {
            setImageSrc(remoteSrc);
            setCredit(
              [
                candidate?.source,
                candidate?.creator,
                candidate?.license,
                candidate?.analysisProvider === 'openai-vision'
                  ? `AI ${candidate?.aiScore ?? candidate?.relevanceScore}/100`
                  : `lọc ảnh ${candidate?.relevanceScore ?? candidate?.metadataScore}/100`,
              ]
                .filter(Boolean)
                .join(' • '),
            );
            return;
          }
        } catch {
          // Nếu API ảnh ngoài chậm hoặc mất mạng, dùng SVG fallback để bài học vẫn đọc được.
        }
      }
    }

    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setCredit(null);
    }
  }

  return (
    <>
      <img
        className={className}
        src={imageSrc}
        alt={title}
        loading="lazy"
        onError={() => {
          void handleImageError();
        }}
      />
      {credit ? <small className="externalImageCredit">{credit}</small> : null}
    </>
  );
}

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const lessonId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lockedMessage, setLockedMessage] = useState('');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [topicGameRound, setTopicGameRound] = useState(0);
  const [selectedGameCards, setSelectedGameCards] = useState<TopicGameCard[]>([]);
  const [matchedGamePairIds, setMatchedGamePairIds] = useState<string[]>([]);
  const [topicGameMoves, setTopicGameMoves] = useState(0);
  const [topicGameMessage, setTopicGameMessage] = useState('Chọn một từ tiếng Anh và một nghĩa tiếng Việt.');
  const isStaff = session?.user.roles.some(
    (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
  );
  const isStudent = session?.user.roles.includes(USER_ROLES.STUDENT) ?? false;

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session || !lessonId) return;
    const isStaffUser = session.user.roles.some((role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN);
    if (isLibraryTopicId(lessonId) && !isStaffUser) {
      router.replace(`/lessons/${lessonId}/learn`);
    }
  }, [lessonId, router, session]);

  useEffect(() => {
    if (!session || !lessonId) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        setError('');
        setLockedMessage('');
        setLoading(true);
        if (isLibraryTopicId(lessonId)) {
          const libraryLesson = getLibraryLessonDetail(lessonId);
          if (active && libraryLesson) setLesson(libraryLesson);
          return;
        }
        const response = await apiGet<LessonDetail>(`/lessons/${lessonId}`, currentSession.accessToken);
        if (!active) return;
        setLesson(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setLesson(null);
          setLockedMessage(
            formatApiError(err, 'Bài học này đang bị khóa. Hãy hoàn thành bài trước để mở khóa.'),
          );
          return;
        }
        setError(formatApiError(err, 'Không tải được bài học.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [lessonId, session]);

  const firstQuizId = useMemo(
    () => lesson?.quizzes.find((quiz) => quiz.status !== 'An')?.id ?? lesson?.quizzes[0]?.id ?? null,
    [lesson],
  );
  const completedTaskCount = lesson?.taskProgress.filter((task) => task.completed).length ?? 0;
  const requiredTaskCount = lesson?.taskProgress.filter((task) => task.required).length ?? 0;
  const completedRequiredTaskCount =
    lesson?.taskProgress.filter((task) => task.required && task.completed).length ?? 0;
  const optionalTaskCount = lesson?.taskProgress.filter((task) => !task.required).length ?? 0;
  const requiredTaskRate = requiredTaskCount ? Math.round((completedRequiredTaskCount / requiredTaskCount) * 100) : 0;
  const nextTask = lesson?.taskProgress.find((task) => !task.completed && task.required) ??
    lesson?.taskProgress.find((task) => !task.completed) ??
    null;
  const featuredVocabularies = lesson?.vocabularies.slice(0, 4) ?? [];
  const audioResources = lesson?.resources.filter((resource) => resource.type === 'Audio').slice(0, 3) ?? [];
  const taskCount = lesson?.tasks.length ?? 0;
  const vocabularyCount = lesson?.vocabularies.length ?? 0;
  const grammarCount = lesson?.grammarPoints.length ?? 0;
  const resourceCount = lesson?.resources.length ?? 0;
  const quizCount = lesson?.quizzes.length ?? 0;
  const lessonProgressPercent = lesson?.progressPercent ?? lesson?.progress?.percentComplete ?? 0;
  const lessonStatus = lesson?.progress?.status ?? (isStaff ? lesson?.status ?? 'Nhap' : 'ChuaHoc');
  const isLibraryLesson = isLibraryTopicId(lessonId);
  const canStudy = isLibraryLesson || isStaff || (isStudent && lessonStatus !== 'BiKhoa');
  const topicMeta = lesson
    ? resolveVocabularyTopic({
        title: lesson.title,
        description: lesson.description,
        topicName: lesson.topicName,
        stageName: lesson.stageName,
        pathName: lesson.pathName,
        content: lesson.content,
      })
    : null;
  const studyReadiness = Math.round(
    ((taskCount ? 1 : 0) +
      (vocabularyCount ? 1 : 0) +
      (grammarCount ? 1 : 0) +
      (resourceCount ? 1 : 0) +
      (quizCount ? 1 : 0)) *
      20,
  );
  const topicGameWords = useMemo(() => lesson?.vocabularies.slice(0, 8) ?? [], [lesson?.vocabularies]);
  const topicGameCards = useMemo(
    () =>
      shuffleCards(
        topicGameWords.flatMap((item) => [
          {
            id: `${item.id}-word-${topicGameRound}`,
            pairId: item.id,
            label: item.word,
            subLabel: item.phonetic ?? 'English',
            kind: 'word' as const,
          },
          {
            id: `${item.id}-meaning-${topicGameRound}`,
            pairId: item.id,
            label: item.meaning,
            subLabel: 'Nghĩa tiếng Việt',
            kind: 'meaning' as const,
          },
        ]),
      ),
    [topicGameRound, topicGameWords],
  );
  const topicGameCompleted = topicGameWords.length > 0 && matchedGamePairIds.length === topicGameWords.length;
  const topicGameProgress = topicGameWords.length ? Math.round((matchedGamePairIds.length / topicGameWords.length) * 100) : 0;
  const topicGameScore = topicGameWords.length
    ? Math.max(0, 100 - Math.max(0, topicGameMoves - topicGameWords.length) * 8)
    : 0;

  useEffect(() => {
    setSelectedGameCards([]);
    setMatchedGamePairIds([]);
    setTopicGameMoves(0);
    setTopicGameMessage('Chọn một từ tiếng Anh và một nghĩa tiếng Việt.');
  }, [lesson?.id, topicGameRound]);

  useEffect(() => {
    if (!session || !lessonId || !lesson || started || !isStudent || isLibraryTopicId(lessonId)) return;

    if (lesson.progress?.status === 'HoanThanh') {
      setStarted(true);
      return;
    }

    const start = async () => {
      try {
        const response = await apiPost<{ success: boolean; progress: LessonDetail['progress'] }>(
          `/lessons/${lessonId}/start`,
          {},
          session.accessToken,
        );
        setLesson((current) =>
          current
            ? {
                ...current,
                progress: response.progress ?? current.progress,
                progressPercent: response.progress?.percentComplete ?? current.progressPercent,
              }
            : current,
        );
        setStarted(true);
      } catch {
        setStarted(true);
      }
    };

    void start();
  }, [isStudent, lesson, lessonId, session, started]);

  async function handleCompleteTask(taskId: string) {
    if (!session || !lessonId) return;

    if (isLibraryTopicId(lessonId)) {
      setLesson((current) => {
        if (!current) return current;
        const nextTasks = current.taskProgress.map((task) =>
          task.id === taskId ? { ...task, completed: true, completedAt: new Date().toISOString() } : task,
        );
        const completedRequired = nextTasks.filter((task) => task.required && task.completed).length;
        const requiredTotal = nextTasks.filter((task) => task.required).length || nextTasks.length || 1;
        const nextPercent = Math.round((completedRequired / requiredTotal) * 70);
        return {
          ...current,
          taskProgress: nextTasks,
          progressPercent: Math.max(current.progressPercent ?? 0, nextPercent),
          progress: {
            status: nextPercent >= 70 ? 'DangHoc' : 'ChuaHoc',
            percentComplete: Math.max(current.progress?.percentComplete ?? 0, nextPercent),
            bestScore: current.progress?.bestScore ?? 0,
            startedAt: current.progress?.startedAt ?? new Date().toISOString(),
            completedAt: current.progress?.completedAt ?? null,
          },
        };
      });
      return;
    }

    setBusyTaskId(taskId);
    try {
      const response = await apiPost<{ success: boolean; progress: LessonDetail['progress'] }>(
        `/lessons/${lessonId}/tasks/${taskId}/complete`,
        {},
        session.accessToken,
      );

      setLesson((current) =>
        current
          ? {
              ...current,
              progress: response.progress ?? current.progress,
              progressPercent: response.progress?.percentComplete ?? current.progressPercent,
              taskProgress: current.taskProgress.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      completed: true,
                      completedAt: new Date().toISOString(),
                    }
                  : task,
              ),
            }
          : current,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(formatApiError(err, 'Không cập nhật được nhiệm vụ.'));
    } finally {
      setBusyTaskId(null);
    }
  }

  function handleTopicGameCardClick(card: TopicGameCard) {
    if (matchedGamePairIds.includes(card.pairId)) return;
    if (selectedGameCards.some((item) => item.id === card.id)) return;

    const nextSelection = [...selectedGameCards, card];
    setSelectedGameCards(nextSelection);

    if (nextSelection.length < 2) {
      setTopicGameMessage(card.kind === 'word' ? 'Chọn nghĩa tiếng Việt phù hợp.' : 'Chọn từ tiếng Anh phù hợp.');
      return;
    }

    setTopicGameMoves((current) => current + 1);
    const [first, second] = nextSelection;
    const isCorrect = first.pairId === second.pairId && first.kind !== second.kind;

    if (isCorrect) {
      setMatchedGamePairIds((current) => [...current, first.pairId]);
      setTopicGameMessage('Chính xác. Cặp từ này đã được ghi nhớ.');
    } else {
      setTopicGameMessage('Chưa đúng. Hãy thử ghép lại theo nghĩa và ngữ cảnh.');
    }

    window.setTimeout(() => setSelectedGameCards([]), 650);
  }

  function handleLogout() {
    clearStoredSession();
    router.replace('/login');
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở bài học...</p>
      </main>
    );
  }

  if (lockedMessage) {
    return (
      <main className="studentUcStandalone lessonDetailStandalone">
        <header className="studentUcTopbar">
          <div>
            <p className="eyebrow">Học viên</p>
            <h1>Học từ vựng theo chủ đề</h1>
          </div>
          <div className="topbarActions">
            <ThemeToggleButton />
            <button className="secondaryButton" type="button" onClick={handleLogout}>
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </header>

        <section className="lockedLessonPanel">
          <div className="lockedLessonScene" aria-hidden="true">
            <div className="lockedLessonGate">
              <LockKeyhole size={46} />
            </div>
            <span className="lockedLessonCloud one" />
            <span className="lockedLessonCloud two" />
            <span className="lockedLessonPath" />
          </div>
          <div className="lockedLessonContent">
            <Link className="backLink" href="/lessons">
              <ArrowLeft size={16} />
              Về danh sách chủ đề
            </Link>
            <p className="eyebrow">Bài học đang bị khóa</p>
            <h1>Hoàn thành bài trước để mở bài này</h1>
            <p>{lockedMessage}</p>
            <div className="lockedLessonActions">
              <Link className="primaryButton" href="/lessons">
                Xem bài đang mở
                <ArrowRight size={16} />
              </Link>
            <Link className="secondaryButton" href="/progress">
                Xem tiến trình học
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone lessonDetailStandalone">
      <header className="studentUcTopbar">
        <div>
          <p className="eyebrow">Học viên</p>
          <h1>Học từ vựng theo chủ đề</h1>
        </div>
        <div className="topbarActions">
          <ThemeToggleButton />
          <button className="secondaryButton" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <header className="detailHero studentLessonDetailHero">
        <div>
          <Link className="backLink" href="/lessons">
            <ArrowLeft size={16} />
            Về danh sách chủ đề
          </Link>
          <p className="eyebrow">{topicMeta?.categoryLabel ?? 'Chủ đề từ vựng'}</p>
          <h1>{topicMeta ? `${topicMeta.englishLabel} - ${topicMeta.label}` : 'Đang tải chủ đề...'}</h1>
          <p>{topicMeta?.context ?? lesson?.description}</p>
          <div className="lessonHeroMeta">
            {isStaff ? (
              <>
                <span>
                  <PlayCircle size={14} />
                  {statusLabels[lesson?.status ?? 'Nhap'] ?? lesson?.status ?? 'Bản nháp'}
                </span>
                <span>
                  <Clock3 size={14} />
                  {lesson?.pathName ?? 'Chưa gắn lộ trình'}
                </span>
                <span>
                  <CircleCheckBig size={14} />
                  {taskCount} nhiệm vụ • {quizCount} quiz
                </span>
                <span>
                  <Workflow size={14} />
                  Chế độ quản lý
                </span>
              </>
            ) : (
              <>
              <span>
                <PlayCircle size={14} />
                {lesson?.progress?.status ?? 'Chưa bắt đầu'}
              </span>
              <span>
                <Clock3 size={14} />
                {lessonProgressPercent}% hoàn thành
              </span>
              <span>
                <CircleCheckBig size={14} />
                {completedRequiredTaskCount}/{requiredTaskCount || lesson?.taskProgress.length || 0} nhiệm vụ bắt buộc
              </span>
              <span>
                <Gamepad2 size={14} />
                Game chủ đề
              </span>
            </>
          )}
        </div>
        </div>

        {isStaff ? (
          <div className="detailStats">
            <div>
              <span>Cấp độ</span>
              <strong>{lesson?.level ?? '--'}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{statusLabels[lesson?.status ?? 'Nhap'] ?? lesson?.status ?? 'Bản nháp'}</strong>
            </div>
            <div>
              <span>Lộ trình</span>
              <strong>{lesson?.pathName ?? '--'}</strong>
            </div>
            <div>
              <span>Giai đoạn</span>
              <strong>{lesson?.stageName ?? '--'}</strong>
            </div>
          </div>
        ) : (
          <div className="detailStats">
            <div>
              <span>Cấp độ</span>
              <strong>{lesson?.level ?? '--'}</strong>
            </div>
            <div>
              <span>Yêu cầu đạt</span>
              <strong>{lesson?.passingScore ?? 80}%</strong>
            </div>
            <div>
              <span>Số quiz</span>
              <strong>{quizCount}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{statusLabels[lessonStatus] ?? lessonStatus}</strong>
            </div>
          </div>
        )}
      </header>

      {error ? <div className="errorBox detailMessage">{error}</div> : null}
      {loading && !lesson ? <div className="subtleBox detailMessage">Đang tải bài học...</div> : null}

      {lesson ? (
        <section className="lessonDetailCockpit">
          <div className="lessonDetailCommandBar">
            <Link className="secondaryButton" href="/lessons">
              <ArrowLeft size={16} />
              Danh sách chủ đề
            </Link>
            {firstQuizId ? (
              <Link className="primaryButton" href={`/quizzes/${firstQuizId}`}>
                Quiz chốt chủ đề
                <ArrowRight size={16} />
              </Link>
            ) : null}
            <SpeechButton className="secondaryButton" text={lesson.content ?? lesson.title} label="Nghe ngữ cảnh" />
          </div>

          <div className="lessonDetailStatsGrid">
            <article className="lessonDetailProgressCard">
              <div
                className="lessonProgressDial"
                style={{ '--lesson-progress': `${lessonProgressPercent}%` } as CSSProperties}
              >
                <span>{lessonProgressPercent}%</span>
                <small>tiến độ bài</small>
              </div>
              <div>
                <strong>{statusLabels[lessonStatus] ?? lessonStatus}</strong>
                <span>
                  {completedRequiredTaskCount}/{requiredTaskCount || lesson.taskProgress.length} nhiệm vụ bắt buộc đã xong
                </span>
              </div>
            </article>

            <article className="lessonNextTaskCard">
            <p className="eyebrow">Việc cần làm tiếp theo</p>
              <h2>{nextTask ? nextTask.title : firstQuizId ? 'Làm quiz để chốt chủ đề' : 'Chủ đề đã sẵn sàng ôn tập'}</h2>
              <p>
                {nextTask
                  ? nextTask.instruction
                  : firstQuizId
                    ? 'Bạn đã xử lý các nhiệm vụ chính. Hãy làm quiz để kiểm tra và mở khóa chủ đề tiếp theo.'
                    : 'Không còn nhiệm vụ bắt buộc. Bạn có thể nghe lại, ôn từ vựng hoặc quay về danh sách chủ đề.'}
              </p>
              <div className="featureMeta">
                <em>
                  <ShieldCheck size={14} />
                  Sẵn sàng nội dung {studyReadiness}%
                </em>
                <em>
                  <BookOpen size={14} />
                  {vocabularyCount} từ vựng
                </em>
                <em>
                  <FileText size={14} />
                  {grammarCount} ngữ pháp
                </em>
                <em>
                  <Workflow size={14} />
                  {optionalTaskCount} nhiệm vụ tự chọn
                </em>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {lesson ? (
        <section className="topicIntegratedFlow" aria-label="Luồng học chủ đề">
          {[
            ['01', 'Học từ', `${vocabularyCount} từ có nghĩa, phiên âm, ảnh và audio.`],
            ['02', 'Ngữ cảnh', `${lesson.vocabularies.filter((item) => item.example).length} ví dụ đặt câu.`],
            ['03', 'Luyện nhanh', 'Nghe, đọc và tự kiểm tra từng từ ngay trong trang.'],
            ['04', 'Game chủ đề', `${topicGameWords.length} cặp từ dùng đúng bộ từ vừa học.`],
            ['05', 'Quiz cuối', firstQuizId ? 'Có bài kiểm tra để chốt tiến trình.' : 'Chưa có quiz liên kết.' ],
          ].map(([index, title, description]) => (
            <article className="topicIntegratedStep" key={index}>
              <strong>{index}</strong>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
      ) : null}

      {lesson && !isStaff ? (
        <section className="topicRouteGrid" aria-label="Các màn trong chủ đề từ vựng">
          <article className="topicRouteCard primary">
            <p className="eyebrow">Màn 1</p>
            <h2>Học từ vựng và ngữ cảnh</h2>
            <p>
              Học từng từ trong chủ đề bằng ảnh, phiên âm, phát âm, câu ví dụ và nhiệm vụ ghi nhớ.
            </p>
            <Link className="primaryButton" href={`/lessons/${lesson.id}/learn`}>
              Vào màn học
              <ArrowRight size={16} />
            </Link>
          </article>

          <article className="topicRouteCard">
            <p className="eyebrow">Màn 2</p>
            <h2>Chơi game theo chủ đề</h2>
            <p>
              Flash Match lấy chính bộ từ của chủ đề hiện tại để ôn như một bài test nhẹ trước quiz.
            </p>
            <Link className="secondaryButton" href={`/lessons/${lesson.id}/game`}>
              Chơi Flash Match
              <Gamepad2 size={16} />
            </Link>
          </article>

          <article className="topicRouteCard">
            <p className="eyebrow">Màn 3</p>
            <h2>Quiz chốt chủ đề</h2>
            <p>
              Làm bài kiểm tra để lưu điểm, mở chủ đề tiếp theo và gom dữ liệu sang tiến trình học.
            </p>
            {firstQuizId ? (
              <Link className="secondaryButton" href={`/quizzes/${firstQuizId}`}>
                Làm quiz
                <ArrowRight size={16} />
              </Link>
            ) : (
              <span className="inlineBadge">Chưa có quiz liên kết</span>
            )}
          </article>
        </section>
      ) : null}

      {isStaff && lesson ? (
        <section className="lessonInsightGrid" aria-label="Tổng quan quản lý bài học">
          <div className="lessonInsightCard">
            <BookOpen size={18} />
            <span>Nhiệm vụ</span>
            <strong>{taskCount}</strong>
          </div>
          <div className="lessonInsightCard">
            <ImageIcon size={18} />
            <span>Từ vựng</span>
            <strong>{vocabularyCount}</strong>
          </div>
          <div className="lessonInsightCard">
            <FileText size={18} />
            <span>Ngữ pháp</span>
            <strong>{grammarCount}</strong>
          </div>
          <div className="lessonInsightCard">
            <Workflow size={18} />
            <span>Tài nguyên / quiz</span>
            <strong>
              {resourceCount}/{quizCount}
            </strong>
          </div>
        </section>
      ) : null}

      {isStaff ? (
        <>
      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Nội dung bài học</h2>
            <span>Ngữ cảnh chính để hiểu bộ từ vựng đang học</span>
          </div>
          {firstQuizId ? (
            <Link className="primaryButton" href={`/quizzes/${firstQuizId}`}>
              {isStaff ? 'Mở quiz đầu tiên' : 'Quiz chốt chủ đề'}
              <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>

        <div className="lessonStudyGrid">
          <article className="contentCard lessonStoryCard">
            <p className="eyebrow">Mô tả nội dung</p>
            <p>{lesson?.content}</p>
            {lesson?.stage ? (
              <div className="lessonStageBadge">
                Chặng {lesson.stage.stageOrder ?? '--'} - {lesson.stage.stageName ?? 'Đang cập nhật'}
              </div>
            ) : null}
          </article>

          <article className="lessonStudyCard">
            <div className="sectionTitle">
              <div>
                <h2>Thanh tiến độ</h2>
                <span>Cập nhật theo nhiệm vụ đã hoàn thành</span>
              </div>
            </div>
            <div className="lessonProgressDial" style={{ '--lesson-progress': `${lessonProgressPercent}%` } as CSSProperties}>
              <span>{lessonProgressPercent}%</span>
              <small>tiến độ bài</small>
            </div>
            <div className="lessonStudyNote">
              <strong>Tiếp theo:</strong>
              <span>
                {nextTask
                  ? `Hoàn thành nhiệm vụ "${nextTask.title}" để tăng tiến độ.`
                  : firstQuizId
                    ? 'Làm quiz để chốt chủ đề và mở chủ đề sau.'
                    : 'Ôn lại nội dung và từ vựng để ghi nhớ tốt hơn.'}
              </span>
            </div>
          </article>
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Phát âm và nghe trong chủ đề</h2>
            <span>Nghe từ, nghe câu ví dụ và đoạn ngữ cảnh để học đúng âm</span>
          </div>
        </div>

        <div className="audioPracticeGrid">
          <article className="audioPracticeCard audioPracticeLead">
            <div className="audioPracticeHead">
              <MicVocal size={18} />
              <strong>{lesson?.title ?? 'Bài mẫu'}</strong>
            </div>
            <p>{lesson?.content}</p>
            <SpeechButton className="primaryButton fullWidth" text={lesson?.content ?? lesson?.title ?? ''} label="Nghe bài mẫu" />
          </article>

          <div className="audioPracticeStack">
            {featuredVocabularies.map((item) => (
              <article className="audioPracticeCard" key={item.id}>
                <div className="audioPracticeHead">
                  <span>
                    <strong>{item.word}</strong>
                    <small>{item.phonetic ?? '--'}</small>
                  </span>
                  <SpeechButton text={item.word} audioUrl={item.audioUrl} label="Phát âm" />
                </div>
                <p>{item.meaning}</p>
              </article>
            ))}

            {audioResources.map((resource) => (
              <article className="audioPracticeCard" key={resource.id}>
                <div className="audioPracticeHead">
                  <MicVocal size={18} />
                  <strong>{resource.name}</strong>
                </div>
                <p>{resource.description}</p>
                <SpeechButton
                  text={resource.description ?? lesson?.content ?? resource.name}
                  audioUrl={resource.url}
                  label="Nghe tài nguyên"
                />
              </article>
            ))}

            {!featuredVocabularies.length && !audioResources.length ? (
              <div className="subtleBox">Chưa có nội dung audio cho bài này.</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Nhiệm vụ học chủ đề</h2>
            <span>Hoàn thành nhiệm vụ để lưu tiến trình học từ vựng</span>
          </div>
        </div>

        <div className="taskGrid">
          {lesson?.taskProgress.map((task) => (
            <article className={`taskCard ${task.completed ? 'done' : ''}`} key={task.id}>
              <div className="taskHead">
                <span className="taskIndex">{task.orderIndex}</span>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.type}</span>
                </div>
                {task.completed ? (
                  <span className="statusTag HoanThanh">Đã xong</span>
                ) : task.required ? (
                  <span className="statusTag DangHoc">Bắt buộc</span>
                ) : (
                  <span className="statusTag ChuaHoc">Tự chọn</span>
                )}
              </div>
              <p>{task.instruction}</p>
              <div className="taskFooter">
                {isStaff ? (
                  <span className="inlineBadge">Chế độ quản lý - không thao tác tiến độ</span>
                ) : task.completed ? (
                  <span className="inlineBadge">
                    Hoàn thành lúc {task.completedAt ? new Date(task.completedAt).toLocaleString('vi-VN') : '--'}
                  </span>
                ) : (
                  <button
                    className="secondaryButton"
                    type="button"
                    disabled={busyTaskId === task.id || !canStudy}
                    onClick={() => void handleCompleteTask(task.id)}
                  >
                    {!canStudy ? 'Chưa mở khóa' : busyTaskId === task.id ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
                  </button>
                )}
              </div>
            </article>
          ))}
          {!lesson?.taskProgress.length ? <div className="subtleBox">Chưa có nhiệm vụ học tập cho bài này.</div> : null}
        </div>
      </section>

      <section className="detailSection twoColumn">
        <div className="panelStack">
          <div className="sectionTitle">
            <div>
              <h2>Bộ từ vựng của chủ đề</h2>
              <span>Từ, nghĩa, phiên âm, hình ảnh và ví dụ theo ngữ cảnh</span>
            </div>
          </div>

          <div className="vocabGrid">
            {lesson?.vocabularies.map((item) => (
              <article className="vocabCard" key={item.id}>
                <div className="vocabHead">
                  <div>
                    <strong>{item.word}</strong>
                    <span>
                      {item.phonetic ?? '--'} {item.wordType ? `• ${item.wordType}` : ''}
                    </span>
                  </div>
                  <SpeechButton text={item.word} audioUrl={item.audioUrl} label="Phát âm" />
                </div>
                <p>{item.meaning}</p>
                <LearningImage
                  src={item.imageUrl}
                  title={item.word}
                  subtitle={item.meaning}
                  query={`${item.word} ${item.meaning} ${item.example ?? ''} ${lesson?.title ?? ''} English vocabulary educational photo`}
                />
              {item.example ? (
                <div className="vocabExample">
                  <span>{item.example}</span>
                  {item.exampleMeaning ? <small>{item.exampleMeaning}</small> : null}
                  <SpeechButton text={item.example} label="Nghe ví dụ" />
                </div>
              ) : null}
            </article>
          ))}
          </div>
        </div>

        <div className="panelStack">
          <div className="sectionTitle">
            <div>
              <h2>Ngữ pháp</h2>
              <span>Mô tả, cấu trúc và ví dụ ứng dụng</span>
            </div>
          </div>

          <div className="grammarStack">
            {lesson?.grammarPoints.map((grammar) => (
              <article className="grammarCard" key={grammar.id}>
                <div className="grammarHead">
                  <FileText size={18} />
                  <strong>{grammar.title}</strong>
                </div>
                <p>{grammar.explanation}</p>
                {grammar.structure ? <code>{grammar.structure}</code> : null}
                {grammar.example ? <span>{grammar.example}</span> : null}
                {grammar.note ? <small>{grammar.note}</small> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="detailSection topicPracticeArena">
        <div className="sectionTitle">
          <div>
            <h2>Luyện nhanh và game chủ đề</h2>
            <span>Không tách game thành UC riêng: game dùng chính bộ từ vừa học để ôn và kiểm tra nhớ nghĩa.</span>
          </div>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => setTopicGameRound((current) => current + 1)}
          >
            <Shuffle size={16} />
            Đổi ván
          </button>
        </div>

        <div className="topicPracticeGrid">
          <article className="topicFlashCardPanel">
            <p className="eyebrow">Flash card ngữ cảnh</p>
            <h3>{topicGameWords[0]?.word ?? lesson?.title ?? 'Chủ đề'}</h3>
            <p>
              {topicGameWords[0]?.example ??
                lesson?.content ??
                'Đọc từ, nghe phát âm, nhìn ảnh và đặt câu trước khi chuyển sang game.'}
            </p>
            <div className="topicMiniVocabList">
              {topicGameWords.slice(0, 5).map((item) => (
                <button
                  className="topicMiniVocab"
                  type="button"
                  key={item.id}
                  onClick={() => {
                    const text = `${item.word}. ${item.example ?? item.meaning}`;
                    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
                      const utterance = new SpeechSynthesisUtterance(text);
                      utterance.lang = 'en-US';
                      utterance.rate = 0.9;
                      window.speechSynthesis.cancel();
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                >
                  <strong>{item.word}</strong>
                  <span>{item.meaning}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="topicGamePanel">
            <div className="topicGameHeader">
              <div>
                <p className="eyebrow">Flash Match</p>
                <h3>Ghép từ với nghĩa</h3>
              </div>
              <span className="inlineBadge">
                <Gamepad2 size={14} />
                {matchedGamePairIds.length}/{topicGameWords.length}
              </span>
            </div>

            <div className="progressRail" aria-label="Tiến độ game chủ đề">
              <div className="progressFill" style={{ width: `${topicGameProgress}%` }} />
            </div>

            <div className="topicGameBoard">
              {topicGameCards.map((card) => {
                const matched = matchedGamePairIds.includes(card.pairId);
                const selected = selectedGameCards.some((item) => item.id === card.id);

                return (
                  <button
                    className={`topicGameCard ${card.kind} ${matched ? 'matched' : ''} ${selected ? 'selected' : ''}`}
                    type="button"
                    key={card.id}
                    disabled={matched}
                    onClick={() => handleTopicGameCardClick(card)}
                  >
                    <small>{card.kind === 'word' ? 'English' : 'Nghĩa'}</small>
                    <strong>{card.label}</strong>
                    <span>{card.subLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="topicGameFooter">
              <span>{topicGameMessage}</span>
              <strong>{topicGameCompleted ? `Hoàn thành: ${topicGameScore} điểm` : `${topicGameMoves} lượt chọn`}</strong>
            </div>

            {topicGameCompleted ? (
              <div className="topicGameWin">
                <Trophy size={18} />
                <span>Bạn đã ôn xong bộ từ của chủ đề. Bây giờ có thể làm quiz chốt bài.</span>
                {firstQuizId ? (
                  <Link className="primaryButton" href={`/quizzes/${firstQuizId}`}>
                    Làm quiz
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Tài nguyên học tập</h2>
            <span>Audio, hình ảnh, video và link hỗ trợ riêng cho chủ đề</span>
          </div>
        </div>

        <div className="resourceGrid">
          {lesson?.resources.map((resource) => (
            <article className="resourceCard" key={resource.id}>
              <div className="resourceHead">
                {resource.type === 'Audio' ? <MicVocal size={18} /> : resource.type === 'HinhAnh' ? <ImageIcon size={18} /> : <Workflow size={18} />}
                <strong>{resource.name}</strong>
              </div>
              <p>{resource.description}</p>
              {resource.type === 'Audio' ? (
                <SpeechButton text={resource.description ?? lesson?.content ?? resource.name} audioUrl={resource.url} label="Nghe tài nguyên" />
              ) : null}
              {resource.type === 'HinhAnh' ? (
                <LearningImage
                  className="resourceImage"
                  src={resource.url}
                  title={resource.name}
                  subtitle={resource.description}
                  query={`${lesson?.title ?? resource.name} ${resource.description ?? ''} English vocabulary educational image`}
                />
              ) : null}
              {resource.url ? (
                <a className="secondaryButton" href={resolveApiAssetUrl(resource.url) ?? resource.url} target="_blank" rel="noreferrer">
                  Mở tài nguyên
                  <Link2 size={16} />
                </a>
              ) : null}
            </article>
          ))}
          {!lesson?.resources.length ? <div className="subtleBox">Chưa có tài nguyên cho bài này.</div> : null}
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Bài kiểm tra liên kết</h2>
            <span>Làm quiz để chốt chủ đề, lưu điểm và mở chủ đề tiếp theo</span>
          </div>
        </div>

        <div className="quizList">
          {lesson?.quizzes.map((quiz) => (
            <article className="quizCard" key={quiz.id}>
              <div>
                <strong>{quiz.title}</strong>
                <span>
                  {quiz.type} • {quiz.durationMinutes ?? 0} phút • Đạt {quiz.passingScore}%
                </span>
                {isStaff && quiz.status ? (
                  <div className="featureMeta" style={{ marginTop: 8 }}>
                    <em>{statusLabels[quiz.status] ?? quiz.status}</em>
                  </div>
                ) : null}
              </div>
              <Link className="primaryButton" href={`/quizzes/${quiz.id}`}>
                Làm bài
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
          {!lesson?.quizzes.length ? <div className="subtleBox">Chưa có quiz liên kết.</div> : null}
        </div>
      </section>
        </>
      ) : null}
    </main>
  );
}
