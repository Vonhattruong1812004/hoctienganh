'use client';

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  LockKeyhole,
  PlayCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { ApiError, apiGet } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';

type LearningPathDetail = {
  id: string;
  name: string;
  description: string;
  level: string;
  stages: Array<{
    id: string;
    name: string;
    type: string;
    orderIndex: number;
    description: string;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      level: string;
      orderIndex: number;
      passingScore: number;
      status?: string;
    }>;
  }>;
};

type ProgressRow = {
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  status: string;
  percentComplete: number;
  bestScore: number;
};

const lessonStatusLabels: Record<string, string> = {
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
  CongBo: 'Đã công bố',
  Nhap: 'Bản nháp',
  An: 'Đang ẩn',
};

function getLessonStatusLabel(status?: string) {
  return lessonStatusLabels[status ?? 'BiKhoa'] ?? 'Bị khóa';
}

export default function LearningPathDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pathId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isStaff = session?.user.roles.some(
    (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
  );

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session || !pathId) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const [pathResponse, progressResponse] = await Promise.all([
          apiGet<LearningPathDetail>(`/learning-paths/${pathId}`, currentSession.accessToken),
          currentSession.user.roles.includes(USER_ROLES.STUDENT)
            ? apiGet<ProgressRow[]>(
                `/progress/students/${currentSession.user.id}`,
                currentSession.accessToken,
              )
            : Promise.resolve([]),
        ]);

        if (!active) return;
        setPath(pathResponse);
        setProgress(progressResponse);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được lộ trình.');
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
  }, [pathId, session]);

  const progressByLesson = useMemo(
    () =>
      new Map(
        progress.map((item) => [
          item.lessonId,
          {
            ...item,
            percentComplete: Number(item.percentComplete ?? 0),
            bestScore: Number(item.bestScore ?? 0),
          },
        ]),
      ),
    [progress],
  );
  const stageViews = useMemo(
    () =>
      path?.stages.map((stage) => {
        const lessons = stage.lessons.map((lesson) => {
          const lessonProgress = progressByLesson.get(lesson.id);
          const isFirstLesson = stage.orderIndex === 1 && lesson.orderIndex === 1;
          const status = isStaff
            ? (lesson.status ?? 'CongBo')
            : lessonProgress?.status ?? (isFirstLesson ? 'ChuaHoc' : 'BiKhoa');
          const percentComplete = lessonProgress?.percentComplete ?? 0;
          const bestScore = lessonProgress?.bestScore ?? 0;

          return {
            ...lesson,
            status,
            percentComplete,
            bestScore,
            canOpen: isStaff ? true : status !== 'BiKhoa',
          };
        });
        const completed = lessons.filter((lesson) => lesson.status === 'HoanThanh').length;

        return {
          ...stage,
          lessons,
          completed,
          locked: lessons.filter((lesson) => lesson.status === 'BiKhoa').length,
          completionRate: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
        };
      }) ?? [],
    [path?.stages, progressByLesson],
  );
  const allLessons = stageViews.flatMap((stage) =>
    stage.lessons.map((lesson) => ({
      ...lesson,
      stageName: stage.name,
      stageOrder: stage.orderIndex,
    })),
  );
  const completedLessons = allLessons.filter((lesson) => lesson.status === 'HoanThanh').length;
  const unlockedLessons = allLessons.filter((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh').length;
  const lockedLessons = allLessons.filter((lesson) => lesson.status === 'BiKhoa').length;
  const completionRate = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const activeLesson = isStaff
    ? allLessons[0] ?? null
    : allLessons.find((lesson) => lesson.status === 'DangHoc') ??
      allLessons.find((lesson) => lesson.status === 'ChuaHoc') ??
      allLessons.find((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh') ??
      null;
  const nextLockedLesson = isStaff
    ? allLessons.find((lesson) => lesson.status !== 'CongBo') ?? null
    : allLessons.find((lesson) => lesson.status === 'BiKhoa') ?? null;

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang chuyển hướng...</p>
      </main>
    );
  }

  return (
    <main className="detailPage">
      <header className="detailHero">
        <div>
          <Link className="backLink" href="/dashboard">
            <ArrowLeft size={16} />
            Về dashboard
          </Link>
          <p className="eyebrow">UC3 - Chi tiết lộ trình học</p>
          <h1>{path?.name ?? 'Đang tải lộ trình...'}</h1>
          <p>{path?.description}</p>
          <div className="pathHeroActions">
            {activeLesson ? (
              <Link className="primaryButton" href={`/lessons/${activeLesson.id}`}>
                {isStaff ? 'Xem bài đầu tiên' : 'Học bài đang mở'}
                <ArrowRight size={16} />
              </Link>
            ) : null}
            <Link className="secondaryButton" href="/learning-paths">
              Danh sách lộ trình
              <Compass size={16} />
            </Link>
          </div>
        </div>

        <div className="detailStats">
          <div>
            <span>Cấp độ</span>
            <strong>{path?.level ?? '--'}</strong>
          </div>
          <div>
            <span>Số giai đoạn</span>
            <strong>{path?.stages.length ?? 0}</strong>
          </div>
          <div>
            <span>Số bài</span>
            <strong>{allLessons.length}</strong>
          </div>
          <div>
            <span>Tiến độ</span>
            <strong>{completionRate}%</strong>
          </div>
        </div>
      </header>

      {error ? <div className="errorBox detailMessage">{error}</div> : null}
      {loading && !path ? <div className="subtleBox detailMessage">Đang tải lộ trình...</div> : null}

      <section className="detailSection pathOverviewSection">
        <div className="pathProgressPanel">
          <div>
            <p className="eyebrow">Tổng quan tiến độ</p>
            <h2>{completionRate}% hoàn thành lộ trình</h2>
            <p>
              Đã hoàn thành {completedLessons}/{allLessons.length} bài. Hiện có {unlockedLessons} bài
              đang mở và {lockedLessons} bài cần mở khóa bằng quiz.
            </p>
          </div>
          <div
            className="pathProgressDial"
            aria-label="Tiến độ lộ trình"
            style={{ '--path-progress': `${completionRate}%` } as CSSProperties}
          >
            <span>{completionRate}%</span>
            <small>path</small>
          </div>
        </div>

        <div className="pathNextStepGrid">
          <div className="pathNextStepCard">
            <PlayCircle size={18} />
            <div>
              <strong>Bài nên học tiếp</strong>
              <span>{activeLesson ? activeLesson.title : 'Chưa có bài đang mở'}</span>
            </div>
          </div>
          <div className="pathNextStepCard">
            <LockKeyhole size={18} />
            <div>
              <strong>Bài kế tiếp bị khóa</strong>
              <span>{nextLockedLesson ? nextLockedLesson.title : 'Không còn bài bị khóa'}</span>
            </div>
          </div>
          <div className="pathNextStepCard">
            <ClipboardCheck size={18} />
            <div>
              <strong>Quy tắc qua bài</strong>
              <span>Làm quiz đạt điểm yêu cầu để mở khóa bài sau.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Cấu trúc lộ trình</h2>
            <span>Mỗi chặng hiển thị tiến độ, bài mở và bài khóa theo dữ liệu học viên</span>
          </div>
        </div>

        <div className="stageGrid">
          {stageViews.map((stage) => (
            <article className="stageCard" key={stage.id}>
              <div className="stageHeader">
                <div className="stageBadge">
                  <BookOpen size={16} />
                  {stage.type}
                </div>
                <span>{stage.completionRate}%</span>
              </div>

              <h3>
                {stage.orderIndex}. {stage.name}
              </h3>
              <p>{stage.description}</p>
              <div className="progressRail" aria-label={`Tiến độ ${stage.name}`}>
                <div className="progressFill" style={{ width: `${stage.completionRate}%` }} />
              </div>
              <div className="stageSummaryMeta">
                <span>{stage.completed}/{stage.lessons.length} hoàn thành</span>
                <span>{stage.locked} khóa</span>
              </div>

              <div className="lessonList">
                {stage.lessons.map((lesson) => {
                  return (
                    <div className="lessonRow" key={lesson.id}>
                      <div>
                        <strong>{lesson.title}</strong>
                        <span>{lesson.description}</span>
                      </div>
                      <div className="lessonRowMeta">
                        <span className={`statusTag ${lesson.status}`}>
                          {getLessonStatusLabel(lesson.status)}
                        </span>
                        <small>{lesson.percentComplete}% • điểm {lesson.bestScore}</small>
                      </div>
                      {lesson.canOpen ? (
                        <Link className="secondaryButton" href={`/lessons/${lesson.id}`}>
                          Mở bài học
                          <ArrowRight size={16} />
                        </Link>
                      ) : (
                        <span className="secondaryButton disabledAction" aria-disabled="true">
                          Bị khóa
                          <LockKeyhole size={16} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Quy tắc vận hành</h2>
            <span>Học theo trình tự, làm quiz và mở khóa tự động</span>
          </div>
        </div>

        <div className="ruleGrid">
          <div className="ruleCard">
            <GraduationCap size={18} />
            <strong>Học từng bài</strong>
            <span>Làm nhiệm vụ, đọc từ vựng, xem ngữ pháp và tài nguyên.</span>
          </div>
          <div className="ruleCard">
            <CheckCircle2 size={18} />
            <strong>Đạt điểm yêu cầu</strong>
            <span>Mỗi bài dùng điểm đạt riêng, thường từ 80% trở lên.</span>
          </div>
          <div className="ruleCard">
            <LockKeyhole size={18} />
            <strong>Mở bài tiếp theo</strong>
            <span>Bài sau chỉ mở khi bài trước đạt yêu cầu.</span>
          </div>
          <div className="ruleCard">
            <Activity size={18} />
            <strong>Lưu tiến trình</strong>
            <span>Hệ thống lưu điểm cao nhất, % hoàn thành và trạng thái từng bài.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
