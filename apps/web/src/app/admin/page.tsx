'use client';

import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  DatabaseZap,
  FileQuestion,
  HeartPulse,
  Layers3,
  LibraryBig,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';

type Summary = {
  totalUsers: number;
  totalStudents: number;
  totalParents: number;
  totalTeachers: number;
  totalPaths: number;
  totalPublishedPaths: number;
  totalLessons: number;
  totalPublishedLessons: number;
  totalQuizzes: number;
  totalPublishedQuizzes: number;
};

type LearningPathManagementSummary = {
  id: string;
  name: string;
  description: string;
  level: string;
  targetAudience: string;
  status: string;
  createdAt: string | Date;
  stagesCount: number;
  lessonsCount: number;
  publishedLessonsCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

type QuizManagementSummary = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  durationMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
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

type LinkedStudent = {
  id: string;
  fullName: string;
  email: string;
  currentLevel: string | null;
  learningGoal: string | null;
  totalPoints: number;
  learningStreak: number;
  completedLessons: number;
  activeLessons: number;
  lockedLessons: number;
  averageProgress: number;
  bestQuizScore?: number;
  attemptsCount?: number;
  passedAttemptsCount?: number;
  linkedParentsCount?: number;
};

type HealthStatus = {
  status: string;
  service: string;
  timestamp: string;
};

type AdminFallbackData = {
  summary: Summary;
  learningPaths: LearningPathManagementSummary[];
  quizzes: QuizManagementSummary[];
  students: LinkedStudent[];
  health: HealthStatus;
};

type MetricCard = {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  note: string;
};

const roleChip = {
  [USER_ROLES.ADMIN]: 'Quản trị viên',
  [USER_ROLES.TEACHER]: 'Giáo viên',
  [USER_ROLES.PARENT]: 'Phụ huynh',
  [USER_ROLES.STUDENT]: 'Học viên',
} as const;

function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isStudentNeedingSupport(student: LinkedStudent) {
  return Number(student.averageProgress ?? 0) < 55 || Number(student.lockedLessons ?? 0) > Math.max(1, Number(student.activeLessons ?? 0));
}

function getSupportBand(student: LinkedStudent) {
  if (isStudentNeedingSupport(student)) return 'needs-support';
  if (Number(student.averageProgress ?? 0) >= 80 || Number(student.learningStreak ?? 0) >= 7) return 'steady';
  return 'watch';
}

function buildFallbackAdminData(): AdminFallbackData {
  return {
    summary: {
      totalUsers: 142,
      totalStudents: 88,
      totalParents: 32,
      totalTeachers: 22,
      totalPaths: 18,
      totalPublishedPaths: 14,
      totalLessons: 126,
      totalPublishedLessons: 102,
      totalQuizzes: 42,
      totalPublishedQuizzes: 31,
    },
    learningPaths: [
      {
        id: 'path-a1',
        name: 'A1 Foundation Path',
        description: 'Lộ trình nền tảng cho học viên mới bắt đầu.',
        level: 'A1',
        targetAudience: 'Học viên mới bắt đầu',
        status: 'CongBo',
        createdAt: new Date().toISOString(),
        stagesCount: 3,
        lessonsCount: 6,
        publishedLessonsCount: 6,
        quizzesCount: 3,
        publishedQuizzesCount: 3,
      },
      {
        id: 'path-a2',
        name: 'A2 Everyday English',
        description: 'Lộ trình luyện giao tiếp và phản xạ hàng ngày.',
        level: 'A2',
        targetAudience: 'Học viên đã có nền tảng',
        status: 'CongBo',
        createdAt: new Date().toISOString(),
        stagesCount: 4,
        lessonsCount: 8,
        publishedLessonsCount: 7,
        quizzesCount: 4,
        publishedQuizzesCount: 3,
      },
      {
        id: 'path-draft',
        name: 'Pronunciation Sprint',
        description: 'Bản nháp cho nâng cao phát âm và nhấn âm.',
        level: 'A1',
        targetAudience: 'Cần ôn phát âm',
        status: 'Nhap',
        createdAt: new Date().toISOString(),
        stagesCount: 2,
        lessonsCount: 4,
        publishedLessonsCount: 0,
        quizzesCount: 1,
        publishedQuizzesCount: 0,
      },
    ],
    quizzes: [
      {
        id: 'quiz-1',
        title: 'Greeting Check 01',
        description: 'Kiểm tra lời chào và tự giới thiệu.',
        type: 'TracNghiem',
        status: 'CongBo',
        durationMinutes: 10,
        passingScore: 80,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lessonId: 'lesson-1',
        lessonTitle: 'Chào hỏi cơ bản',
        lessonStatus: 'CongBo',
        lessonLevel: 'A1',
        lessonOrder: 1,
        topicName: 'Giao tiếp',
        stageName: 'Làm quen từ vựng',
        stageOrder: 1,
        pathName: 'A1 Foundation Path',
        questionsCount: 10,
        attemptsCount: 48,
        passedAttemptsCount: 31,
        averageScore: 83.2,
        latestAttemptAt: new Date().toISOString(),
      },
      {
        id: 'quiz-2',
        title: 'Listening Mini Test',
        description: 'Bài nghe ngắn cho kỹ năng nhận diện từ vựng.',
        type: 'Nghe',
        status: 'CongBo',
        durationMinutes: 12,
        passingScore: 80,
        maxAttempts: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lessonId: 'lesson-4',
        lessonTitle: 'Nghe hội thoại ngắn',
        lessonStatus: 'CongBo',
        lessonLevel: 'A1',
        lessonOrder: 2,
        topicName: 'Nghe hiểu',
        stageName: 'Nghe và phát âm',
        stageOrder: 2,
        pathName: 'A1 Foundation Path',
        questionsCount: 8,
        attemptsCount: 31,
        passedAttemptsCount: 19,
        averageScore: 79.4,
        latestAttemptAt: new Date().toISOString(),
      },
    ],
    students: [
      {
        id: 'student-1',
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@englishpro.local',
        currentLevel: 'A1',
        learningGoal: 'Nói câu ngắn tự nhiên',
        totalPoints: 1280,
        learningStreak: 6,
        completedLessons: 5,
        activeLessons: 2,
        lockedLessons: 1,
        averageProgress: 67,
        bestQuizScore: 88,
        attemptsCount: 7,
        passedAttemptsCount: 5,
        linkedParentsCount: 1,
      },
      {
        id: 'student-2',
        fullName: 'Trần Gia Bảo',
        email: 'gialbao@englishpro.local',
        currentLevel: 'A1',
        learningGoal: 'Học từ vựng giao tiếp cơ bản',
        totalPoints: 860,
        learningStreak: 3,
        completedLessons: 3,
        activeLessons: 1,
        lockedLessons: 3,
        averageProgress: 42,
        bestQuizScore: 71,
        attemptsCount: 4,
        passedAttemptsCount: 2,
        linkedParentsCount: 1,
      },
      {
        id: 'student-3',
        fullName: 'Lê Hoàng Phúc',
        email: 'hoangphuc@englishpro.local',
        currentLevel: 'A1',
        learningGoal: 'Củng cố nghe và phát âm',
        totalPoints: 1560,
        learningStreak: 8,
        completedLessons: 6,
        activeLessons: 2,
        lockedLessons: 0,
        averageProgress: 84,
        bestQuizScore: 94,
        attemptsCount: 8,
        passedAttemptsCount: 7,
        linkedParentsCount: 1,
      },
    ],
    health: {
      status: 'demo',
      service: 'english-learning-api',
      timestamp: new Date().toISOString(),
    },
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [paths, setPaths] = useState<LearningPathManagementSummary[]>([]);
  const [quizzes, setQuizzes] = useState<QuizManagementSummary[]>([]);
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('live');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (!storedSession.user.roles.includes(USER_ROLES.ADMIN)) {
      router.replace('/dashboard');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const [summaryResponse, pathsResponse, quizzesResponse, studentsResponse, healthResponse] =
          await Promise.all([
            apiGet<Summary>('/users/summary', currentSession.accessToken),
            apiGet<LearningPathManagementSummary[]>('/learning-paths/manage', currentSession.accessToken),
            apiGet<QuizManagementSummary[]>('/quizzes/manage', currentSession.accessToken),
            apiGet<LinkedStudent[]>('/users/students', currentSession.accessToken),
            apiGet<HealthStatus>('/health'),
          ]);

        if (!active) return;
        setSummary(summaryResponse);
        setPaths(pathsResponse);
        setQuizzes(quizzesResponse);
        setStudents(studentsResponse);
        setHealth(healthResponse);
        setDataMode('live');
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }

        if (err instanceof ApiError && err.status === 0) {
          const fallback = buildFallbackAdminData();
          setSummary(fallback.summary);
          setPaths(fallback.learningPaths);
          setQuizzes(fallback.quizzes);
          setStudents(fallback.students);
          setHealth(fallback.health);
          setError('');
          setDataMode('demo');
          return;
        }

        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu quản trị.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const metrics = useMemo<MetricCard[]>(
    () => [
      { icon: Users, label: 'Người dùng', value: summary?.totalUsers ?? 0, note: 'Tổng tài khoản trong hệ thống' },
      { icon: LibraryBig, label: 'Lộ trình công bố', value: summary?.totalPublishedPaths ?? 0, note: 'Nội dung đã sẵn sàng' },
      { icon: CheckCircle2, label: 'Quiz công bố', value: summary?.totalPublishedQuizzes ?? 0, note: 'Bài kiểm tra đang hoạt động' },
      { icon: HeartPulse, label: 'Trạng thái hệ thống', value: health?.status ?? 'unknown', note: health?.timestamp ? formatDate(health.timestamp) : 'Chưa kiểm tra' },
    ],
    [health?.status, health?.timestamp, summary],
  );

  const supportCount = students.filter((student) => isStudentNeedingSupport(student)).length;
  const steadyCount = students.filter((student) => getSupportBand(student) === 'steady').length;
  const averageProgress = students.length
    ? Math.round(students.reduce((total, student) => total + Number(student.averageProgress ?? 0), 0) / students.length)
    : 0;
  const bestQuizScore = students.length ? Math.max(...students.map((student) => Number(student.bestQuizScore ?? 0))) : 0;
  const livePaths = [...paths].sort((left, right) => right.stagesCount - left.stagesCount).slice(0, 3);
  const liveQuizzes = [...quizzes]
    .sort((left, right) => right.averageScore - left.averageScore)
    .slice(0, 4);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang chuyển hướng...</p>
      </main>
    );
  }

  return (
    <AppShell session={session} active="admin" eyebrow="UC cuối của actor quản trị" title="Quản trị hệ thống">
      <section className="heroPanel">
        <div>
          <p className="eyebrow">Xin chào, {session.user.fullName}</p>
          <h2>Trung tâm điều phối hệ thống EnglishPro</h2>
          <p>
            Đây là không gian dành riêng cho quản trị viên: theo dõi tài khoản, duyệt nội dung,
            kiểm tra sức khỏe hệ thống và mở rộng dữ liệu vận hành.
          </p>
          <div className="studentHeroMeta">
            <span>
              <ShieldCheck size={14} />
              {roleChip[USER_ROLES.ADMIN]}
            </span>
            <span>
              <TrendingUp size={14} />
              {summary ? `${summary.totalStudents} học viên • ${summary.totalTeachers} giáo viên` : 'Đang tải số liệu'}
            </span>
            <span>
              <Sparkles size={14} />
              {dataMode === 'demo' ? 'Dữ liệu mẫu' : 'Dữ liệu thật'}
            </span>
          </div>
        </div>

        <div className="scoreDial" aria-label="Trạng thái điều phối">
          <span>{dataMode === 'demo' ? 'DEMO' : 'LIVE'}</span>
          <small>{health?.status ?? 'đang kiểm tra'}</small>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {dataMode === 'demo' ? (
        <div className="subtleBox dashboardMessage">
          Đang hiển thị dữ liệu mẫu vì backend chưa phản hồi. Trải nghiệm quản trị vẫn chạy được để
          kiểm tra giao diện và luồng nghiệp vụ.
        </div>
      ) : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ dữ liệu quản trị...</div> : null}

      <section className="metricGrid adminMetricGrid">
        {metrics.map((metric) => (
          <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </section>

      <section className="adminOverviewPanel panel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Quản lý nội dung</p>
            <h2>Trạng thái lộ trình và quiz</h2>
            <span>Quản trị viên kiểm tra nhanh nội dung đang công bố, nội dung nháp và mức độ hoạt động.</span>
          </div>
          <span className="inlineBadge">
            <Layers3 size={14} />
            {paths.length} lộ trình
          </span>
        </div>

        <div className="commandGrid">
          {livePaths.map((path) => (
            <article className="commandCard" key={path.id}>
              <BookOpen size={20} />
              <div>
                <strong>{path.name}</strong>
                <span>
                  {path.level} • {path.status === 'CongBo' ? 'Đã công bố' : 'Bản nháp'} • {path.lessonsCount} bài
                </span>
              </div>
              <ArrowRight size={16} />
            </article>
          ))}
          {!livePaths.length && !loading ? <div className="subtleBox">Chưa có lộ trình quản trị.</div> : null}
        </div>
      </section>

      <section className="studentDashboardGrid">
        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>Quản trị quiz</h2>
              <span>Bài kiểm tra có nhiều lượt làm và mức điểm trung bình đáng chú ý</span>
            </div>
            <span className="inlineBadge">
              <FileQuestion size={14} />
              {quizzes.length} quiz
            </span>
          </div>

          <div className="studentQuestList">
            {liveQuizzes.map((quiz) => (
              <div className="studentQuestItem" key={quiz.id}>
                <div>
                  <strong>{quiz.title}</strong>
                  <span>
                    {quiz.pathName ?? 'Chưa gắn lộ trình'} • {quiz.lessonTitle}
                  </span>
                </div>
                <em>
                  {Math.round(quiz.averageScore)}% • {quiz.attemptsCount} lượt làm
                </em>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>Sức khỏe vận hành</h2>
              <span>Kiểm tra số liệu người dùng, tiến độ và trạng thái dịch vụ</span>
            </div>
            <span className="inlineBadge">
              <DatabaseZap size={14} />
              {health?.service ?? 'API'}
            </span>
          </div>

          <div className="studentHealthList">
            <div className="studentHealthItem Tot">
              <CheckCircle2 size={16} />
              <div>
                <strong>Tài khoản</strong>
                <small>
                  {summary?.totalStudents ?? 0} học viên, {summary?.totalParents ?? 0} phụ huynh, {summary?.totalTeachers ?? 0} giáo viên
                </small>
              </div>
            </div>
            <div className="studentHealthItem Tot">
              <TrendingUp size={16} />
              <div>
                <strong>Tiến độ trung bình</strong>
                <small>{averageProgress}% trên tập học viên đang quản lý</small>
              </div>
            </div>
            <div className="studentHealthItem CanXuLy">
              <ShieldCheck size={16} />
              <div>
                <strong>Cần hỗ trợ</strong>
                <small>{supportCount} học viên cần ưu tiên theo dõi</small>
              </div>
            </div>
            <div className="studentHealthItem Tot">
              <Activity size={16} />
              <div>
                <strong>Ổn định</strong>
                <small>{steadyCount} học viên đang đi đều tiến độ</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel adminOverviewPanel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Vận hành dữ liệu</p>
            <h2>Góc nhìn nhanh cho actor cuối</h2>
            <span>Admin theo dõi khối lượng dữ liệu, chứ không đi vào luồng học của từng học viên.</span>
          </div>
          <span className="inlineBadge">
            <BarChart3 size={14} />
            {bestQuizScore}% quiz tốt nhất
          </span>
        </div>

        <div className="adminOverviewNotes">
          <div>
            <strong>Phân quyền</strong>
            <span>Quản trị có thể mở rộng quyền, kiểm soát truy cập và quản trị actor.</span>
          </div>
          <div>
            <strong>Nội dung</strong>
            <span>Giám sát lộ trình, bài học và quiz trước khi đẩy ra người học.</span>
          </div>
          <div>
            <strong>Sức khỏe hệ thống</strong>
            <span>{health ? `${health.status.toUpperCase()} • cập nhật ${formatDate(health.timestamp)}` : 'Chưa có dữ liệu sức khỏe.'}</span>
          </div>
        </div>
      </section>

      <section className="panel commandCenter">
        <div className="sectionTitle">
          <div>
            <h2>Đi nhanh đến khu vực quản trị</h2>
            <span>Các lối tắt chính để quản lý hệ thống nhanh và rõ</span>
          </div>
        </div>

        <div className="commandGrid">
          <Link className="commandCard" href="/students">
            <Users size={20} />
            <div>
              <strong>Quản lý tài khoản</strong>
              <span>Học viên, phụ huynh, giáo viên và hỗ trợ liên kết.</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link className="commandCard" href="/learning-paths">
            <Layers3 size={20} />
            <div>
              <strong>Duyệt lộ trình</strong>
              <span>Xem nội dung công bố, bản nháp và cấu trúc học tập.</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link className="commandCard" href="/quizzes">
            <FileQuestion size={20} />
            <div>
              <strong>Quản lý quiz</strong>
              <span>Rà soát câu hỏi, trạng thái và chất lượng kiểm tra.</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div className="metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
