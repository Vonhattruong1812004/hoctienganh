'use client';

import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  Clock3,
  BookOpen,
  FileText,
  ImageIcon,
  Link2,
  MicVocal,
  PlayCircle,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { SpeechButton } from '../../../components/speech-button';
import { apiGet, apiPost, resolveApiAssetUrl } from '../../../lib/api';
import { getStoredSession, type WebAuthSession } from '../../../lib/session';

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

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const lessonId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
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

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const response = await apiGet<LessonDetail>(`/lessons/${lessonId}`, currentSession.accessToken);
        if (!active) return;
        setLesson(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không tải được bài học.');
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

  const firstQuizId = useMemo(() => lesson?.quizzes[0]?.id ?? null, [lesson]);
  const completedTaskCount = lesson?.taskProgress.filter((task) => task.completed).length ?? 0;
  const requiredTaskCount = lesson?.taskProgress.filter((task) => task.required).length ?? 0;
  const featuredVocabularies = lesson?.vocabularies.slice(0, 4) ?? [];
  const audioResources = lesson?.resources.filter((resource) => resource.type === 'Audio').slice(0, 3) ?? [];
  const taskCount = lesson?.tasks.length ?? 0;
  const vocabularyCount = lesson?.vocabularies.length ?? 0;
  const grammarCount = lesson?.grammarPoints.length ?? 0;
  const resourceCount = lesson?.resources.length ?? 0;
  const quizCount = lesson?.quizzes.length ?? 0;

  useEffect(() => {
    if (!session || !lessonId || !lesson || started || !isStudent) return;

    if (lesson.progress?.status === 'HoanThanh') {
      setStarted(true);
      return;
    }

    const start = async () => {
      try {
        await apiPost(`/lessons/${lessonId}/start`, {}, session.accessToken);
        setStarted(true);
      } catch {
        setStarted(true);
      }
    };

    void start();
  }, [isStudent, lesson, lessonId, session, started]);

  async function handleCompleteTask(taskId: string) {
    if (!session || !lessonId) return;

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
      setError(err instanceof Error ? err.message : 'Không cập nhật được nhiệm vụ.');
    } finally {
      setBusyTaskId(null);
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở bài học...</p>
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
          <p className="eyebrow">{lesson?.topicName ?? 'Bài học'}</p>
          <h1>{lesson?.title ?? 'Đang tải bài học...'}</h1>
          <p>{lesson?.description}</p>
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
                  {lesson?.progressPercent ?? 0}% hoàn thành
                </span>
                <span>
                  <CircleCheckBig size={14} />
                  {completedTaskCount}/{requiredTaskCount || lesson?.taskProgress.length || 0} nhiệm vụ
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
              <strong>{lesson?.progress?.status ?? 'Chưa học'}</strong>
            </div>
          </div>
        )}
      </header>

      {error ? <div className="errorBox detailMessage">{error}</div> : null}
      {loading && !lesson ? <div className="subtleBox detailMessage">Đang tải bài học...</div> : null}

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

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Nội dung bài học</h2>
            <span>Đọc tóm tắt, nghe phần mẫu và hoàn thành nhiệm vụ để mở tiến độ</span>
          </div>
          {firstQuizId ? (
            <Link className="primaryButton" href={`/quizzes/${firstQuizId}`}>
              {isStaff ? 'Mở quiz đầu tiên' : 'Bắt đầu quiz'}
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
            <div
              className="lessonProgressDial"
              style={{ '--lesson-progress': `${lesson?.progressPercent ?? 0}%` } as CSSProperties}
            >
              <span>{lesson?.progressPercent ?? 0}%</span>
              <small>tiến độ bài</small>
            </div>
            <div className="lessonStudyNote">
              <strong>Tiếp theo:</strong>
              <span>{firstQuizId ? 'Làm quiz để chốt bài và mở khóa bài sau.' : 'Hoàn thành nhiệm vụ để tăng tiến độ bài.'}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Nghe audio / phát âm</h2>
            <span>Giọng đọc mẫu, phát âm từ vựng và đoạn nghe liên quan</span>
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
            <h2>Nhiệm vụ học tập</h2>
            <span>Mỗi task được sắp xếp theo thứ tự để học từ từ</span>
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
                    disabled={busyTaskId === task.id}
                    onClick={() => void handleCompleteTask(task.id)}
                  >
                    {busyTaskId === task.id ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
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
              <h2>Từ vựng</h2>
              <span>Từ, nghĩa, phiên âm và ví dụ</span>
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
              {item.imageUrl ? <img className="vocabImage" src={resolveApiAssetUrl(item.imageUrl) ?? item.imageUrl} alt={item.word} /> : null}
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

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>Tài nguyên học tập</h2>
            <span>Audio, hình ảnh, file và link tham khảo</span>
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
            <span>Làm quiz để chốt bài và mở khóa bài tiếp theo</span>
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
    </main>
  );
}
