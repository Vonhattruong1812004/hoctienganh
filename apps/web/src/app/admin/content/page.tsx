'use client';

import {
  AlertTriangle,
  Archive,
  BookOpen,
  CheckCircle2,
  EyeOff,
  FileText,
  LibraryBig,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { ApiError, apiGet, apiPatch } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';

type PathStatus = 'Nhap' | 'CongBo' | 'LuuTru';
type ContentStatus = 'Nhap' | 'CongBo' | 'An';
type ContentKind = 'path' | 'lesson' | 'quiz';
type ReviewFilter = 'all' | 'needs-review' | 'published' | 'draft' | ContentKind;

type LearningPathItem = {
  id: string;
  name: string;
  description: string;
  level: string;
  targetAudience: string;
  status: PathStatus;
  createdAt: string;
  stagesCount: number;
  lessonsCount: number;
  publishedLessonsCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

type LessonItem = {
  id: string;
  title: string;
  description: string;
  level: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  pathName: string | null;
  stageName: string | null;
  topicName: string | null;
  tasksCount: number;
  requiredTasksCount: number;
  vocabCount: number;
  grammarCount: number;
  resourcesCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

type QuizItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: ContentStatus;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  lessonTitle: string | null;
  lessonStatus: string | null;
  topicName: string | null;
  pathName: string | null;
  questionsCount: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  averageScore: number;
};

type ReviewItem = {
  id: string;
  kind: ContentKind;
  title: string;
  description: string;
  context: string;
  status: PathStatus | ContentStatus;
  readiness: number;
  issues: string[];
  facts: Array<{ label: string; value: string | number }>;
  createdAt: string;
};

const filterLabels: Record<ReviewFilter, string> = {
  all: 'Tất cả',
  'needs-review': 'Cần duyệt',
  published: 'Đã công bố',
  draft: 'Nháp/ẩn',
  path: 'Lộ trình',
  lesson: 'Bài học',
  quiz: 'Quiz',
};

const statusLabels: Record<string, string> = {
  Nhap: 'Nháp',
  CongBo: 'Công bố',
  LuuTru: 'Lưu trữ',
  An: 'Ẩn',
};

const kindMeta: Record<ContentKind, { label: string; icon: ComponentType<{ size?: number }>; accent: string }> = {
  path: { label: 'Lộ trình', icon: BookOpen, accent: 'Path' },
  lesson: { label: 'Bài học', icon: LibraryBig, accent: 'Lesson' },
  quiz: { label: 'Quiz', icon: CheckCircle2, accent: 'Quiz' },
};

export default function AdminContentPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ReviewFilter>('needs-review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busyKey, setBusyKey] = useState('');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (!storedSession.user.roles.includes(USER_ROLES.ADMIN)) {
      clearStoredSession();
      router.replace('/login');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const currentSession = session;
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [pathResponse, lessonResponse, quizResponse] = await Promise.all([
          apiGet<LearningPathItem[]>('/learning-paths/manage', currentSession.accessToken),
          apiGet<LessonItem[]>('/lessons/manage', currentSession.accessToken),
          apiGet<QuizItem[]>('/quizzes/manage', currentSession.accessToken),
        ]);
        if (!active) return;
        setPaths(pathResponse);
        setLessons(lessonResponse);
        setQuizzes(quizResponse);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được kho nội dung TOEIC.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const reviewItems = useMemo(() => {
    const pathItems = paths.map(buildPathReviewItem);
    const lessonItems = lessons.map(buildLessonReviewItem);
    const quizItems = quizzes.map(buildQuizReviewItem);
    return [...pathItems, ...lessonItems, ...quizItems].sort((left, right) => {
      if (left.issues.length !== right.issues.length) return right.issues.length - left.issues.length;
      if (left.readiness !== right.readiness) return left.readiness - right.readiness;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [lessons, paths, quizzes]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return reviewItems
      .filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'needs-review') return item.issues.length > 0 || item.status !== 'CongBo';
        if (filter === 'published') return item.status === 'CongBo';
        if (filter === 'draft') return item.status !== 'CongBo';
        return item.kind === filter;
      })
      .filter((item) => {
        if (!normalizedQuery) return true;
        return normalizeText([item.title, item.description, item.context, item.status, item.kind].join(' ')).includes(
          normalizedQuery,
        );
      });
  }, [filter, query, reviewItems]);

  const stats = useMemo(() => {
    const total = reviewItems.length;
    const published = reviewItems.filter((item) => item.status === 'CongBo').length;
    const needsReview = reviewItems.filter((item) => item.issues.length > 0 || item.status !== 'CongBo').length;
    const critical = reviewItems.filter((item) => item.readiness < 70 || item.issues.length >= 2).length;
    const readiness = total
      ? Math.round(reviewItems.reduce((sum, item) => sum + item.readiness, 0) / total)
      : 0;

    return { total, published, needsReview, critical, readiness };
  }, [reviewItems]);

  async function refreshContent() {
    if (!session) return;
    const [pathResponse, lessonResponse, quizResponse] = await Promise.all([
      apiGet<LearningPathItem[]>('/learning-paths/manage', session.accessToken),
      apiGet<LessonItem[]>('/lessons/manage', session.accessToken),
      apiGet<QuizItem[]>('/quizzes/manage', session.accessToken),
    ]);
    setPaths(pathResponse);
    setLessons(lessonResponse);
    setQuizzes(quizResponse);
  }

  async function updateItemStatus(item: ReviewItem, status: PathStatus | ContentStatus) {
    if (!session || item.status === status) return;
    setError('');
    setSuccessMessage('');
    setBusyKey(`${item.kind}:${item.id}:${status}`);

    try {
      if (item.kind === 'path') {
        const updated = await apiPatch<LearningPathItem>(
          `/learning-paths/${item.id}/status`,
          { status },
          session.accessToken,
        );
        setPaths((current) => current.map((path) => (path.id === updated.id ? updated : path)));
      }

      if (item.kind === 'lesson') {
        const updated = await apiPatch<LessonItem>(`/lessons/${item.id}/status`, { status }, session.accessToken);
        setLessons((current) => current.map((lesson) => (lesson.id === updated.id ? updated : lesson)));
      }

      if (item.kind === 'quiz') {
        const updated = await apiPatch<QuizItem>(`/quizzes/${item.id}/status`, { status }, session.accessToken);
        setQuizzes((current) => current.map((quiz) => (quiz.id === updated.id ? updated : quiz)));
      }

      setSuccessMessage(`Đã chuyển "${item.title}" sang trạng thái ${statusLabels[status] ?? status}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái nội dung.');
    } finally {
      setBusyKey('');
    }
  }

  if (!session) {
    return <main className="authLoading">Đang tải trang kiểm duyệt nội dung...</main>;
  }

  return (
    <AppShell
      session={session}
      active="paths"
      roleContext={USER_ROLES.ADMIN}
      showSidebar={false}
      eyebrow="Quản trị viên"
      title="Kiểm duyệt kho nội dung TOEIC"
    >
      <section className="adminContentHero">
        <div className="adminUserHeroCopy">
          <p className="eyebrow">UC2 • Content Moderation</p>
          <h2>Duyệt lộ trình, bài học và quiz TOEIC trước khi mở cho học viên.</h2>
          <p>
            Admin kiểm tra độ sẵn sàng, trạng thái công bố và các rủi ro nội dung trong một hàng đợi duyệt
            thống nhất. Giáo viên có thể soạn nội dung, còn admin quyết định nội dung nào đủ điều kiện phát hành.
          </p>
          <div className="adminHeroMeta">
            <span>
              <ShieldCheck size={14} />
              {stats.published}/{stats.total} đã công bố
            </span>
            <span>
              <AlertTriangle size={14} />
              {stats.needsReview} cần duyệt
            </span>
            <span>
              <Sparkles size={14} />
              {stats.readiness}% sẵn sàng
            </span>
          </div>
        </div>

        <div className="adminContentScore">
          <span>Readiness</span>
          <strong>{stats.readiness}%</strong>
          <small>{stats.critical} mục cần ưu tiên kiểm tra</small>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {successMessage ? <div className="subtleBox dashboardMessage">{successMessage}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ kho nội dung TOEIC...</div> : null}

      <section className="metricGrid adminUserMetricGrid" aria-label="Chỉ số kiểm duyệt">
        <MetricCard icon={FileText} label="Tổng nội dung" value={stats.total} note="Lộ trình, bài học, quiz" />
        <MetricCard icon={CheckCircle2} label="Đã công bố" value={stats.published} note="Đang mở cho học viên" />
        <MetricCard icon={AlertTriangle} label="Cần duyệt" value={stats.needsReview} note="Nháp, ẩn hoặc thiếu dữ liệu" />
        <MetricCard icon={Archive} label="Lộ trình" value={paths.length} note={`${paths.filter((item) => item.status === 'CongBo').length} công bố`} />
        <MetricCard icon={LibraryBig} label="Bài học" value={lessons.length} note={`${lessons.filter((item) => item.status === 'CongBo').length} công bố`} />
        <MetricCard icon={CheckCircle2} label="Quiz" value={quizzes.length} note={`${quizzes.filter((item) => item.status === 'CongBo').length} công bố`} />
      </section>

      <section className="panel adminContentToolbar" aria-label="Bộ lọc kiểm duyệt">
        <div className="sectionTitle">
          <div>
            <h2>Hàng đợi kiểm duyệt</h2>
            <span>Lọc nội dung cần duyệt, xem lý do rủi ro và đổi trạng thái công bố ngay tại đây.</span>
          </div>
          <button className="secondaryButton" type="button" onClick={() => void refreshContent()}>
            Làm mới
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="adminContentFilterRow">
          <label className="field">
            <span>Tìm kiếm</span>
            <div className="parentSearchInput">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tên, mô tả, trạng thái hoặc ngữ cảnh"
              />
            </div>
          </label>

          <div className="lessonFilterRow adminContentFilters">
            {(Object.keys(filterLabels) as ReviewFilter[]).map((key) => (
              <button
                className={`lessonFilterButton ${filter === key ? 'active' : ''}`}
                type="button"
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
              >
                {filterLabels[key]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="adminContentWorkspace" aria-label="Danh sách nội dung cần kiểm duyệt">
        {visibleItems.map((item) => {
          const meta = kindMeta[item.kind];
          const Icon = meta.icon;
          const publishBusy = busyKey === `${item.kind}:${item.id}:CongBo`;
          const draftStatus = item.kind === 'path' ? 'Nhap' : 'Nhap';
          const hideStatus = item.kind === 'path' ? 'LuuTru' : 'An';

          return (
            <article className="adminContentReviewCard" key={`${item.kind}:${item.id}`}>
              <div className="adminContentReviewHead">
                <span className="adminMenuCardIcon">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="eyebrow">{meta.accent}</p>
                  <h3>{item.title}</h3>
                  <span>{item.context}</span>
                </div>
                <strong className={`statusTag ${item.status}`}>{statusLabels[item.status] ?? item.status}</strong>
              </div>

              <p className="adminContentDescription">{item.description}</p>

              <div className="adminContentReadiness">
                <div>
                  <span>Độ sẵn sàng</span>
                  <strong>{item.readiness}%</strong>
                </div>
                <div className="progressTrack">
                  <div className="progressFill" style={{ width: `${item.readiness}%` }} />
                </div>
              </div>

              <div className="adminContentFacts">
                {item.facts.map((fact) => (
                  <span key={`${item.id}:${fact.label}`}>
                    {fact.label}: <strong>{fact.value}</strong>
                  </span>
                ))}
              </div>

              <div className="adminContentIssues">
                {item.issues.length ? (
                  item.issues.map((issue) => (
                    <span key={`${item.id}:${issue}`}>
                      <AlertTriangle size={14} />
                      {issue}
                    </span>
                  ))
                ) : (
                  <span className="ready">
                    <ShieldCheck size={14} />
                    Đủ điều kiện công bố.
                  </span>
                )}
              </div>

              <div className="adminContentActions">
                <button
                  className="primaryButton"
                  type="button"
                  disabled={publishBusy || item.status === 'CongBo'}
                  onClick={() => void updateItemStatus(item, 'CongBo')}
                >
                  Công bố
                  <CheckCircle2 size={16} />
                </button>
                <button
                  className="secondaryButton"
                  type="button"
                  disabled={busyKey === `${item.kind}:${item.id}:${draftStatus}` || item.status === draftStatus}
                  onClick={() => void updateItemStatus(item, draftStatus)}
                >
                  Về nháp
                  <FileText size={16} />
                </button>
                <button
                  className="secondaryButton"
                  type="button"
                  disabled={busyKey === `${item.kind}:${item.id}:${hideStatus}` || item.status === hideStatus}
                  onClick={() => void updateItemStatus(item, hideStatus)}
                >
                  {item.kind === 'path' ? 'Lưu trữ' : 'Ẩn'}
                  <EyeOff size={16} />
                </button>
              </div>
            </article>
          );
        })}

        {!visibleItems.length && !loading ? (
          <div className="emptyState">
            <ShieldCheck size={30} />
            <h2>Không có nội dung phù hợp bộ lọc.</h2>
            <p>Đổi bộ lọc hoặc từ khóa để kiểm tra các nhóm nội dung TOEIC khác.</p>
          </div>
        ) : null}
      </section>

      <section className="panel adminContentGuide" aria-label="Luật duyệt nội dung">
        <div className="sectionTitle">
          <div>
            <h2>Luật duyệt UC2</h2>
            <span>Admin chỉ công bố khi nội dung đủ dữ liệu học tập và không làm gãy luồng TOEIC.</span>
          </div>
          <Link className="secondaryButton" href="/admin">
            Nhật ký hệ thống
          </Link>
        </div>

        <div className="roleOverviewStack">
          <div className="roleOverviewItem">
            <BookOpen size={16} />
            <span>Lộ trình cần có giai đoạn, bài học và quiz đã sẵn sàng trước khi mở rộng cho học viên.</span>
          </div>
          <div className="roleOverviewItem">
            <LibraryBig size={16} />
            <span>Bài học cần có từ vựng, nhiệm vụ bắt buộc, ngữ cảnh và ít nhất một hình thức kiểm tra liên kết.</span>
          </div>
          <div className="roleOverviewItem">
            <CheckCircle2 size={16} />
            <span>Quiz cần có câu hỏi, thời lượng, điểm đạt và bài học liên kết đang ở trạng thái phù hợp.</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function buildPathReviewItem(path: LearningPathItem): ReviewItem {
  const readinessParts = [
    path.stagesCount > 0 ? 25 : 0,
    path.lessonsCount > 0 ? 25 : 0,
    path.publishedLessonsCount > 0 ? 25 : 0,
    path.publishedQuizzesCount > 0 ? 25 : 0,
  ];
  const issues = [
    path.stagesCount <= 0 ? 'Chưa có giai đoạn học.' : null,
    path.lessonsCount <= 0 ? 'Chưa có bài học.' : null,
    path.publishedLessonsCount < path.lessonsCount ? 'Còn bài học chưa công bố.' : null,
    path.quizzesCount > 0 && path.publishedQuizzesCount <= 0 ? 'Quiz chưa sẵn sàng.' : null,
  ].filter(Boolean) as string[];

  return {
    id: path.id,
    kind: 'path',
    title: path.name,
    description: path.description,
    context: `${path.level || 'TOEIC'} • ${path.targetAudience || 'Người học TOEIC'}`,
    status: path.status,
    readiness: readinessParts.reduce((sum, value) => sum + value, 0),
    issues,
    facts: [
      { label: 'Giai đoạn', value: path.stagesCount },
      { label: 'Bài học', value: `${path.publishedLessonsCount}/${path.lessonsCount}` },
      { label: 'Quiz', value: `${path.publishedQuizzesCount}/${path.quizzesCount}` },
    ],
    createdAt: path.createdAt,
  };
}

function buildLessonReviewItem(lesson: LessonItem): ReviewItem {
  const readinessParts = [
    lesson.vocabCount >= 10 ? 20 : lesson.vocabCount > 0 ? 10 : 0,
    lesson.requiredTasksCount > 0 ? 20 : 0,
    lesson.grammarCount > 0 ? 15 : 0,
    lesson.resourcesCount > 0 ? 15 : 0,
    lesson.quizzesCount > 0 ? 15 : 0,
    lesson.publishedQuizzesCount > 0 ? 15 : 0,
  ];
  const issues = [
    lesson.vocabCount < 10 ? 'Từ vựng còn ít cho một bài TOEIC.' : null,
    lesson.requiredTasksCount <= 0 ? 'Chưa có nhiệm vụ bắt buộc.' : null,
    lesson.resourcesCount <= 0 ? 'Thiếu tài nguyên hình/audio/video.' : null,
    lesson.quizzesCount <= 0 ? 'Chưa có quiz liên kết.' : null,
    lesson.quizzesCount > 0 && lesson.publishedQuizzesCount <= 0 ? 'Quiz liên kết chưa công bố.' : null,
  ].filter(Boolean) as string[];

  return {
    id: lesson.id,
    kind: 'lesson',
    title: lesson.title,
    description: lesson.description,
    context: [lesson.pathName, lesson.stageName, lesson.topicName, lesson.level].filter(Boolean).join(' • '),
    status: lesson.status,
    readiness: Math.min(100, readinessParts.reduce((sum, value) => sum + value, 0)),
    issues,
    facts: [
      { label: 'Từ vựng', value: lesson.vocabCount },
      { label: 'Nhiệm vụ', value: `${lesson.requiredTasksCount}/${lesson.tasksCount}` },
      { label: 'Ngữ pháp', value: lesson.grammarCount },
      { label: 'Tài nguyên', value: lesson.resourcesCount },
      { label: 'Quiz', value: `${lesson.publishedQuizzesCount}/${lesson.quizzesCount}` },
    ],
    createdAt: lesson.createdAt,
  };
}

function buildQuizReviewItem(quiz: QuizItem): ReviewItem {
  const readinessParts = [
    quiz.questionsCount >= 4 ? 30 : quiz.questionsCount > 0 ? 15 : 0,
    quiz.durationMinutes > 0 ? 20 : 0,
    quiz.passingScore > 0 ? 20 : 0,
    quiz.lessonTitle ? 15 : 0,
    quiz.lessonStatus === 'CongBo' ? 15 : 0,
  ];
  const issues = [
    quiz.questionsCount <= 0 ? 'Chưa có câu hỏi.' : null,
    quiz.questionsCount > 0 && quiz.questionsCount < 4 ? 'Số câu hỏi còn ít.' : null,
    quiz.durationMinutes <= 0 ? 'Chưa cấu hình thời gian làm bài.' : null,
    quiz.passingScore <= 0 ? 'Chưa cấu hình điểm đạt.' : null,
    quiz.lessonStatus && quiz.lessonStatus !== 'CongBo' ? 'Bài học liên kết chưa công bố.' : null,
  ].filter(Boolean) as string[];

  return {
    id: quiz.id,
    kind: 'quiz',
    title: quiz.title,
    description: quiz.description,
    context: [quiz.pathName, quiz.lessonTitle, quiz.topicName, quiz.type].filter(Boolean).join(' • '),
    status: quiz.status,
    readiness: Math.min(100, readinessParts.reduce((sum, value) => sum + value, 0)),
    issues,
    facts: [
      { label: 'Câu hỏi', value: quiz.questionsCount },
      { label: 'Thời gian', value: `${quiz.durationMinutes} phút` },
      { label: 'Đạt', value: `${quiz.passingScore}%` },
      { label: 'Lượt làm', value: quiz.attemptsCount },
      { label: 'Điểm TB', value: `${Math.round(Number(quiz.averageScore ?? 0))}%` },
    ],
    createdAt: quiz.createdAt,
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <article className="metricCard">
      <Icon size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
