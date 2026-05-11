'use client';

import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';

type ProgressRow = {
  id: string;
  status: string;
  percentComplete: number;
  bestScore: number;
  startedAt: string | null;
  completedAt: string | null;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  passingScore: number;
  stageId: string | null;
  stageName: string | null;
  stageType: string | null;
  stageOrder: number | null;
  pathName: string | null;
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
};

const statusLabels: Record<string, string> = {
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
};

function formatDate(value: string | null) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function ProgressPage() {
  const router = useRouter();
  const [requestedStudentId, setRequestedStudentId] = useState('');
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loadingLinkedStudents, setLoadingLinkedStudents] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setRequestedStudentId(new URLSearchParams(window.location.search).get('studentId') ?? '');
  }, []);

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    const isManagementMode = currentSession.user.roles.some(
      (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
    );
    const canSelectStudent = currentSession.user.roles.includes(USER_ROLES.PARENT) || isManagementMode;

    async function load() {
      try {
        if (canSelectStudent) {
          const endpoint = currentSession.user.roles.includes(USER_ROLES.PARENT)
            ? '/parents/me/students'
            : '/users/students';
          const response = await apiGet<LinkedStudent[]>(endpoint, currentSession.accessToken);
          if (!active) return;
          setLinkedStudents(response);
          setSelectedStudentId((currentSelected) =>
            response.some((student) => student.id === requestedStudentId)
              ? requestedStudentId
              : response.some((student) => student.id === currentSelected)
              ? currentSelected
              : response[0]?.id ?? '',
          );
          return;
        }

        if (!currentSession.user.roles.includes(USER_ROLES.STUDENT)) {
          setProgress([]);
          setLoadingProgress(false);
          return;
        }

        const response = await apiGet<ProgressRow[]>(
          `/progress/students/${currentSession.user.id}`,
          currentSession.accessToken,
        );
        if (!active) return;
        setProgress(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setError('Vai trò hiện tại chưa có quyền xem tiến trình cá nhân tại trang này.');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được tiến trình.');
      } finally {
        if (active) setLoadingLinkedStudents(false);
      }
    }

    if (canSelectStudent) {
      setLoadingLinkedStudents(true);
      setLoadingProgress(true);
    }

    void load();
    return () => {
      active = false;
    };
  }, [requestedStudentId, router, session]);

  useEffect(() => {
    if (!session) return;
    const isManagementMode = session.user.roles.some(
      (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
    );
    const canSelectStudent = session.user.roles.includes(USER_ROLES.PARENT) || isManagementMode;
    if (!canSelectStudent) return;
    if (!selectedStudentId) {
      setProgress([]);
      setLoadingProgress(false);
      return;
    }

    const currentSession = session;
    let active = true;

    async function loadSelectedProgress() {
      setLoadingProgress(true);
      try {
        const response = await apiGet<ProgressRow[]>(
          `/progress/students/${selectedStudentId}`,
          currentSession.accessToken,
        );
        if (!active) return;
        setProgress(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setError(
            currentSession.user.roles.includes(USER_ROLES.PARENT)
              ? 'Bạn chỉ có thể xem tiến trình của học viên đã liên kết.'
              : 'Vai trò hiện tại không có quyền xem tiến trình học viên này.',
          );
          setProgress([]);
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được tiến trình.');
      } finally {
        if (active) setLoadingProgress(false);
      }
    }

    void loadSelectedProgress();
    return () => {
      active = false;
    };
  }, [router, selectedStudentId, session]);

  const completed = progress.filter((item) => item.status === 'HoanThanh').length;
  const studying = progress.filter((item) => item.status === 'DangHoc').length;
  const locked = progress.filter((item) => item.status === 'BiKhoa').length;
  const notStarted = progress.filter((item) => item.status === 'ChuaHoc').length;
  const bestScore = progress.reduce((max, item) => Math.max(max, item.bestScore ?? 0), 0);
  const isParent = session?.user.roles.includes(USER_ROLES.PARENT) ?? false;
  const isManagementMode =
    session?.user.roles.some((role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN) ?? false;
  const isStudentSelectorMode = isParent || isManagementMode;
  const selectedStudent = useMemo(
    () => linkedStudents.find((student) => student.id === selectedStudentId) ?? linkedStudents[0] ?? null,
    [linkedStudents, selectedStudentId],
  );
  const average = useMemo(
    () =>
      progress.length
        ? Math.round(progress.reduce((total, item) => total + item.percentComplete, 0) / progress.length)
        : 0,
    [progress],
  );
  const stageGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        pathName: string;
        stageName: string;
        stageType: string | null;
        stageOrder: number;
        items: ProgressRow[];
        completed: number;
        studying: number;
        averageProgress: number;
        bestScore: number;
      }
    >();

    [...progress]
      .sort((left, right) => {
        const leftStage = left.stageOrder ?? 0;
        const rightStage = right.stageOrder ?? 0;
        return leftStage === rightStage ? left.lessonOrder - right.lessonOrder : leftStage - rightStage;
      })
      .forEach((item) => {
        const key = `${item.pathName ?? 'Lộ trình'}:${item.stageName ?? 'Bài tự do'}:${item.stageOrder ?? 0}`;
        const current = grouped.get(key);
        const nextItems = current ? [...current.items, item] : [item];
        const totalProgress = nextItems.reduce((sum, row) => sum + row.percentComplete, 0);
        grouped.set(key, {
          pathName: item.pathName ?? 'Lộ trình hiện tại',
          stageName: item.stageName ?? 'Bài học tự do',
          stageType: item.stageType ?? null,
          stageOrder: item.stageOrder ?? 0,
          items: nextItems,
          completed: nextItems.filter((row) => row.status === 'HoanThanh').length,
          studying: nextItems.filter((row) => row.status === 'DangHoc').length,
          averageProgress: nextItems.length ? Math.round(totalProgress / nextItems.length) : 0,
          bestScore: nextItems.reduce((max, row) => Math.max(max, row.bestScore ?? 0), 0),
        });
      });

    return [...grouped.values()];
  }, [progress]);
  const nextFocus =
    progress.find((item) => item.status === 'DangHoc') ??
    progress.find((item) => item.status === 'ChuaHoc') ??
    progress.find((item) => item.status === 'BiKhoa') ??
    progress[0] ??
    null;
  const loading = loadingLinkedStudents || loadingProgress;

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang chuyển hướng...</p>
      </main>
    );
  }

  return (
    <AppShell session={session} active="progress" eyebrow="Learning Analytics" title="Tiến trình">
      <section className="pageHeroCompact">
        <div>
          <p className="eyebrow">Theo dõi học tập</p>
          <h2>
            {isParent
              ? 'Phụ huynh theo dõi tiến trình học tập chi tiết của từng học viên đã liên kết.'
              : isManagementMode
                ? 'Giáo viên theo dõi tiến trình chi tiết của từng học viên trong lớp.'
              : 'Tiến trình được tách thành trang riêng để xem trạng thái từng bài rõ hơn.'}
          </h2>
          <p>
            Hệ thống lưu phần trăm hoàn thành, trạng thái học và điểm cao nhất để phục vụ mở khóa bài
            mới và báo cáo học tập.
          </p>
        </div>
        <span className="inlineBadge">
          <TrendingUp size={16} />
          {isStudentSelectorMode ? `${linkedStudents.length} học viên` : `${average}% trung bình`}
        </span>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loadingLinkedStudents ? <div className="subtleBox dashboardMessage">Đang tải danh sách học viên...</div> : null}
      {!loadingLinkedStudents && loadingProgress ? (
        <div className="subtleBox dashboardMessage">Đang tải tiến trình học tập chi tiết...</div>
      ) : null}

      {isStudentSelectorMode ? (
        <>
          <section className="progressHeroPanel parentProgressHero">
            <div className="progressHeroCopy parentProgressCopy">
              <p className="eyebrow">
                {isParent ? 'UC2 • Xem tiến trình học tập' : 'UC theo dõi lớp • Tiến trình học viên'}
              </p>
              <h3>
                {selectedStudent
                  ? `Theo dõi tiến trình của ${selectedStudent.fullName} theo từng bài học và từng chặng.`
                  : isParent
                    ? 'Chọn một học viên đã liên kết để xem tiến trình chi tiết.'
                    : 'Chọn một học viên trong lớp để xem tiến trình chi tiết.'}
              </h3>
              <p>
                {isParent
                  ? 'Phụ huynh có thể chuyển nhanh giữa các học viên đã liên kết, xem bài đang học, bài đã hoàn thành, chặng còn khóa và điểm cao nhất để hỗ trợ đúng lúc.'
                  : 'Giáo viên có thể chuyển nhanh giữa học viên, xem bài đang học, bài đã hoàn thành, điểm cao nhất và các chặng đang khóa để hỗ trợ đúng lúc.'}
              </p>

              {selectedStudent ? (
                <div className="progressJourneyBadges parentProgressMeta">
                  <span>
                    <Users size={14} />
                    {selectedStudent.fullName}
                  </span>
                  <span>
                    <BookOpen size={14} />
                    {selectedStudent.currentLevel ?? 'Chưa rõ cấp độ'}
                  </span>
                  <span>
                    <Target size={14} />
                    {selectedStudent.learningGoal ?? 'Chưa cập nhật mục tiêu'}
                  </span>
                  <span>
                    <TrendingUp size={14} />
                    {progress.length ? `${average}% trung bình` : 'Chưa có dữ liệu'}
                  </span>
                  <span>
                    <ShieldAlert size={14} />
                    {locked} bài bị khóa
                  </span>
                </div>
              ) : null}

              <div className="parentProgressHint">
                <Sparkles size={14} />
                {isParent
                  ? 'Chọn học viên ở dải bên dưới để cập nhật toàn bộ thẻ tiến trình và danh sách bài học.'
                  : 'Chọn học viên ở dải bên dưới để cập nhật báo cáo tiến trình, chặng học và danh sách bài cần hỗ trợ.'}
              </div>
            </div>

            <div
              className="progressDial"
              style={{ '--student-progress': `${selectedStudent ? average : 0}%` } as CSSProperties}
            >
              <span>{selectedStudent ? average : 0}%</span>
              <small>tiến độ</small>
            </div>
          </section>

          <section className="parentStudentStrip" aria-label="Chọn học viên đã liên kết">
            {linkedStudents.map((student) => {
              const active = selectedStudentId === student.id;
              const initials = student.fullName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('');

              return (
                <button
                  key={student.id}
                  type="button"
                  className={`parentStudentChip ${active ? 'active' : ''}`}
                  onClick={() => setSelectedStudentId(student.id)}
                  aria-pressed={active}
                >
                  <div className="parentStudentChipHead">
                    <div className="parentChipAvatar">{initials || 'HV'}</div>
                    <div>
                      <strong>{student.fullName}</strong>
                      <span>{student.currentLevel ?? 'Chưa rõ cấp độ'}</span>
                    </div>
                  </div>
                  <div className="progressRail">
                    <div
                      className="progressFill"
                      style={{ width: `${Math.min(100, Math.max(0, student.averageProgress))}%` }}
                    />
                  </div>
                  <small>
                    {student.averageProgress}% • {student.completedLessons} bài hoàn thành •{' '}
                    {student.learningStreak} ngày liên tiếp
                  </small>
                </button>
              );
            })}

            {!linkedStudents.length && !loadingLinkedStudents ? (
              <div className="emptyState">
                <ShieldAlert size={28} />
                <h2>{isParent ? 'Chưa có học viên nào được liên kết.' : 'Chưa có học viên nào trong hệ thống.'}</h2>
                <p>
                  {isParent
                    ? 'Hệ thống sẽ hiển thị tiến trình ngay khi có liên kết phụ huynh - học viên hợp lệ.'
                    : 'Hệ thống sẽ hiển thị tiến trình ngay khi có học viên và dữ liệu học tập hợp lệ.'}
                </p>
              </div>
            ) : null}
          </section>

          {selectedStudent ? (
            <>
              <section className="metricGrid">
                <div className="metric">
                  <CheckCircle2 size={20} />
                  <span>Hoàn thành</span>
                  <strong>{completed}</strong>
                </div>
                <div className="metric">
                  <Activity size={20} />
                  <span>Đang học</span>
                  <strong>{studying}</strong>
                </div>
                <div className="metric">
                  <Award size={20} />
                  <span>Điểm cao nhất</span>
                  <strong>{bestScore}</strong>
                </div>
                <div className="metric">
                  <TrendingUp size={20} />
                  <span>Chưa học / Khóa</span>
                  <strong>{notStarted + locked}</strong>
                </div>
              </section>

              <section className="progressStageList">
                <div className="sectionTitle">
                  <div>
                    <h2>Tiến trình theo chặng</h2>
                    <span>
                      {isParent
                        ? `${selectedStudent.fullName} đang được gom theo từng chặng học để phụ huynh theo dõi nhanh từng giai đoạn`
                        : `${selectedStudent.fullName} đang được gom theo từng chặng học để giáo viên đánh giá tiến độ và hỗ trợ đúng lúc`}
                    </span>
                  </div>
                </div>

                <div className="progressStageGrid">
                  {stageGroups.map((stage) => (
                    <article
                      className="progressStageCard"
                      key={`${stage.pathName}-${stage.stageName}-${stage.stageOrder}`}
                    >
                      <div className="progressStageHead">
                        <div>
                          <p className="eyebrow">{stage.pathName}</p>
                          <h3>
                            {stage.stageOrder}. {stage.stageName}
                          </h3>
                          <span>{stage.stageType ?? 'Chặng học'}</span>
                        </div>
                        <div className="progressStageScore">
                          <strong>{stage.averageProgress}%</strong>
                          <small>trung bình</small>
                        </div>
                      </div>

                      <div className="progressRail">
                        <div className="progressFill" style={{ width: `${stage.averageProgress}%` }} />
                      </div>

                      <div className="progressStageMeta">
                        <span>
                          <ShieldAlert size={14} />
                          {stage.completed}/{stage.items.length} hoàn thành
                        </span>
                        <span>
                          <Activity size={14} />
                          Đang học {stage.studying}
                        </span>
                        <span>
                          <Award size={14} />
                          Điểm cao nhất {stage.bestScore}
                        </span>
                      </div>

                      <div className="progressLessonStack">
                        {stage.items.map((item) => (
                          <article className="progressLessonCard" key={item.id}>
                            <div>
                              <strong>
                                {item.lessonOrder}. {item.lessonTitle}
                              </strong>
                              <span>{statusLabels[item.status] ?? item.status}</span>
                            </div>
                            <div className="progressLessonMeta">
                              <span>{item.percentComplete}%</span>
                              <span>{item.bestScore} điểm</span>
                              <span>Đạt {item.passingScore}%</span>
                            </div>
                            <div className="progressRail">
                              <div className="progressFill" style={{ width: `${item.percentComplete}%` }} />
                            </div>
                            <small>
                              Bắt đầu {formatDate(item.startedAt)} • Hoàn thành {formatDate(item.completedAt)}
                            </small>
                            <Link className="secondaryButton progressLessonLink" href={`/lessons/${item.lessonId}`}>
                              Mở bài học
                              <ArrowRight size={14} />
                            </Link>
                          </article>
                        ))}
                      </div>
                    </article>
                  ))}

                  {!stageGroups.length && !loading ? (
                    <div className="subtleBox">
                      Chưa có dữ liệu tiến trình của học viên này. Khi học viên làm bài hoặc mở bài, hệ
                      thống sẽ ghi lại từng mốc tiến độ ở đây.
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : (
        <>
          <section className="progressHeroPanel">
            <div className="progressHeroCopy">
              <p className="eyebrow">Tổng quan tiến trình</p>
              <h3>
                {nextFocus
                  ? `${nextFocus.lessonOrder}. ${nextFocus.lessonTitle}`
                  : 'Chưa có bài học được ghi nhận'}
              </h3>
              <p>
                Tiến trình được lưu tự động theo từng bài, điểm cao nhất và trạng thái mở khóa để học
                viên biết rõ mình đang ở đâu và bước tiếp theo là gì.
              </p>
              {nextFocus ? (
                <div className="progressJourneyBadges">
                  <span>{statusLabels[nextFocus.status] ?? nextFocus.status}</span>
                  <span>{nextFocus.pathName ?? 'Lộ trình hiện tại'}</span>
                  <span>{nextFocus.stageName ?? 'Bài học cá nhân'}</span>
                  <span>Đạt {nextFocus.passingScore}%</span>
                </div>
              ) : null}
            </div>

            <div
              className="progressDial"
              style={{ '--student-progress': `${average}%` } as CSSProperties}
            >
              <span>{average}%</span>
              <small>trung bình</small>
            </div>
          </section>

          <section className="metricGrid">
            <div className="metric">
              <CheckCircle2 size={20} />
              <span>Hoàn thành</span>
              <strong>{completed}</strong>
            </div>
            <div className="metric">
              <Activity size={20} />
              <span>Đang học</span>
              <strong>{studying}</strong>
            </div>
            <div className="metric">
              <Award size={20} />
              <span>Điểm cao nhất</span>
              <strong>{bestScore}</strong>
            </div>
            <div className="metric">
              <TrendingUp size={20} />
              <span>Chưa học / Khóa</span>
              <strong>{notStarted + locked}</strong>
            </div>
          </section>

          <section className="progressStageList">
            <div className="sectionTitle">
              <div>
                <h2>Tiến trình theo chặng</h2>
                <span>Mỗi chặng gom theo lộ trình, hiển thị trạng thái và tiến độ trung bình</span>
              </div>
            </div>

            <div className="progressStageGrid">
              {stageGroups.map((stage) => (
                <article className="progressStageCard" key={`${stage.pathName}-${stage.stageName}-${stage.stageOrder}`}>
                  <div className="progressStageHead">
                    <div>
                      <p className="eyebrow">{stage.pathName}</p>
                      <h3>
                        {stage.stageOrder}. {stage.stageName}
                      </h3>
                      <span>{stage.stageType ?? 'Chặng học'}</span>
                    </div>
                    <div className="progressStageScore">
                      <strong>{stage.averageProgress}%</strong>
                      <small>trung bình</small>
                    </div>
                  </div>

                  <div className="progressRail">
                    <div className="progressFill" style={{ width: `${stage.averageProgress}%` }} />
                  </div>

                  <div className="progressStageMeta">
                    <span>{stage.completed}/{stage.items.length} hoàn thành</span>
                    <span>Đang học {stage.studying}</span>
                    <span>Điểm cao nhất {stage.bestScore}</span>
                  </div>

                  <div className="progressLessonStack">
                    {stage.items.map((item) => (
                      <article className="progressLessonCard" key={item.id}>
                        <div>
                          <strong>
                            {item.lessonOrder}. {item.lessonTitle}
                          </strong>
                          <span>{statusLabels[item.status] ?? item.status}</span>
                        </div>
                        <div className="progressLessonMeta">
                          <span>{item.percentComplete}%</span>
                          <span>{item.bestScore} điểm</span>
                          <span>Đạt {item.passingScore}%</span>
                        </div>
                        <div className="progressRail">
                          <div className="progressFill" style={{ width: `${item.percentComplete}%` }} />
                        </div>
                        <small>
                          Bắt đầu {formatDate(item.startedAt)} • Hoàn thành {formatDate(item.completedAt)}
                        </small>
                        <a className="secondaryButton progressLessonLink" href={`/lessons/${item.lessonId}`}>
                          Mở bài học
                          <ArrowRight size={14} />
                        </a>
                      </article>
                    ))}
                  </div>
                </article>
              ))}

              {!stageGroups.length && !loading ? (
                <div className="subtleBox">
                  Chưa có dữ liệu tiến trình. Khi học viên làm bài hoặc mở bài, hệ thống sẽ ghi lại từng
                  mốc tiến độ ở đây.
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
