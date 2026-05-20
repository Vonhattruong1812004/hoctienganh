'use client';

import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Edit3,
  Filter,
  Layers3,
  LibraryBig,
  LogOut,
  LockKeyhole,
  PlayCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wand2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { ApiError, apiGet, apiPatch, apiPost } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import { topicLibrary, topicLibraryStages, type LibraryTopic } from '../../lib/topic-library';
import { resolveVocabularyTopic, topicCategoryFilters, type TopicVocabularyWord } from '../../lib/topic-meta';

type LearningPathSummary = {
  id: string;
  name: string;
  description: string;
  level: string;
  targetAudience: string;
  status: string;
};

type LearningPathDetail = LearningPathSummary & {
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
    }>;
  }>;
};

type LessonManagementSummary = {
  id: string;
  stageId: string | null;
  topicId: string | null;
  pathId: string | null;
  title: string;
  description: string | null;
  content: string | null;
  level: string | null;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  pathName: string | null;
  stageName: string | null;
  topicName: string | null;
  stageOrder: number | null;
  lessonOrder: number;
  passingScore: number;
  tasksCount: number;
  requiredTasksCount: number;
  vocabCount: number;
  grammarCount: number;
  resourcesCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

type ProgressRow = {
  lessonId: string;
  status: string;
  percentComplete: number;
  bestScore: number;
};

type LessonManagementState = 'Nhap' | 'CongBo' | 'An';

type TeacherTopicDraft = {
  title: string;
  englishTitle: string;
  description: string;
  category: LibraryTopic['category'];
  level: LibraryTopic['level'];
};

type TeacherTopicStore = {
  overrides: Record<string, LibraryTopic>;
  customTopics: LibraryTopic[];
  deletedIds: string[];
};

type ExploreContentResponse = {
  query: string;
  vocabulary: Array<{
    word: string;
    meaning: string;
    pronunciation: string | null;
    example: string | null;
    audioUrl: string | null;
    tags?: string[];
  }>;
  examples: Array<{
    sentence: string;
    translation: string | null;
    audioUrl: string | null;
  }>;
  images: Array<{
    imageUrl: string;
    thumbnailUrl: string | null;
  }>;
  warnings: string[];
};

const TEACHER_TOPIC_STORAGE_KEY = 'englishpro:teacher-topic-manager:v1';

const defaultTopicDraft: TeacherTopicDraft = {
  title: '',
  englishTitle: '',
  description: '',
  category: 'ToeicVanPhong',
  level: 'A2',
};

const statusLabels: Record<string, string> = {
  TatCa: 'Tất cả',
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
  CongBo: 'Đã công bố',
  Nhap: 'Bản nháp',
  LuuTru: 'Lưu trữ',
  An: 'Đang ẩn',
};

const managementFilters = ['all', 'published', 'draft'] as const;
const lessonManagementStatusLabels: Record<LessonManagementState, string> = {
  Nhap: 'Bản nháp',
  CongBo: 'Công bố',
  An: 'Đang ẩn',
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slugifyLocal(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeTeacherText(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim();
  const typoMap: Record<string, string> = {
    recieve: 'receive',
    recive: 'receive',
    bussiness: 'business',
    buisness: 'business',
    enviroment: 'environment',
    accomodation: 'accommodation',
    resturant: 'restaurant',
    tranportation: 'transportation',
    managment: 'management',
    comunication: 'communication',
    invocie: 'invoice',
    shedule: 'schedule',
    trái: 'trái',
  };

  return compact
    .split(/\s+/)
    .map((word) => typoMap[word.toLowerCase()] ?? word)
    .join(' ');
}

function guessTopicCategory(title: string, description: string): LibraryTopic['category'] {
  const resolved = resolveVocabularyTopic({
    title,
    description,
    topicName: title,
    content: description,
  });

  return resolved?.category ?? 'ToeicVanPhong';
}

function getTopicCategoryLabel(category: LibraryTopic['category']) {
  return topicCategoryFilters.find((item) => item.key === category)?.label ?? 'TOEIC';
}

function readTeacherTopicStore(): TeacherTopicStore {
  if (typeof window === 'undefined') {
    return { overrides: {}, customTopics: [], deletedIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(TEACHER_TOPIC_STORAGE_KEY);
    if (!raw) return { overrides: {}, customTopics: [], deletedIds: [] };
    const parsed = JSON.parse(raw) as Partial<TeacherTopicStore>;
    return {
      overrides: parsed.overrides ?? {},
      customTopics: Array.isArray(parsed.customTopics) ? parsed.customTopics : [],
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
    };
  } catch {
    return { overrides: {}, customTopics: [], deletedIds: [] };
  }
}

function writeTeacherTopicStore(store: TeacherTopicStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TEACHER_TOPIC_STORAGE_KEY, JSON.stringify(store));
}

function withTeacherTopicOverride(topic: LibraryTopic, vocabulary?: TopicVocabularyWord[]) {
  return {
    ...topic,
    vocabulary: vocabulary ?? topic.vocabulary,
  };
}

function buildWordExample(word: string, title: string) {
  const cleanWord = normalizeTeacherText(word).toLowerCase();
  if (!cleanWord) return '';
  if (cleanWord.includes(' ')) {
    return `The ${cleanWord} is important in ${title.toLowerCase()}.`;
  }
  return `The team uses ${cleanWord} in ${title.toLowerCase()}.`;
}

function buildWordExampleMeaning(word: string, title: string) {
  return `Câu ví dụ dùng "${word}" trong chủ đề ${title}.`;
}

function normalizeTeacherVocabularyWord(
  item: Partial<TopicVocabularyWord>,
  index: number,
  topicTitle: string,
): TopicVocabularyWord {
  const word = normalizeTeacherText(item.word ?? '');
  const meaning = normalizeTeacherText(item.meaning ?? '') || `từ vựng trong chủ đề ${topicTitle}`;
  const example = normalizeTeacherText(item.example ?? '') || buildWordExample(word, topicTitle);

  return {
    id: item.id || `teacher-word-${index + 1}-${slugifyLocal(word || String(index + 1))}`,
    word,
    meaning,
    phonetic: item.phonetic ?? null,
    wordType: item.wordType ?? 'noun',
    example,
    exampleMeaning: normalizeTeacherText(item.exampleMeaning ?? '') || buildWordExampleMeaning(word, topicTitle),
    audioUrl: item.audioUrl ?? null,
    imageUrl: item.imageUrl ?? null,
  };
}

function buildGeneratedVocabulary(
  draft: TeacherTopicDraft,
  external?: ExploreContentResponse | null,
): TopicVocabularyWord[] {
  const query = draft.englishTitle || draft.title;
  const categoryPool = topicLibrary
    .filter((topic) => topic.category === draft.category)
    .flatMap((topic) => topic.vocabulary);
  const searchPool = topicLibrary
    .filter((topic) =>
      normalizeText(`${topic.title} ${topic.englishTitle} ${topic.description}`).includes(normalizeText(query)),
    )
    .flatMap((topic) => topic.vocabulary);
  const externalWords =
    external?.vocabulary.map<Partial<TopicVocabularyWord>>((item, index) => ({
      id: `external-${index + 1}-${slugifyLocal(item.word)}`,
      word: item.word,
      meaning: item.meaning,
      phonetic: item.pronunciation,
      wordType: item.tags?.[0] ?? 'noun',
      example: item.example ?? external.examples[index % Math.max(external.examples.length, 1)]?.sentence ?? null,
      exampleMeaning: external.examples[index % Math.max(external.examples.length, 1)]?.translation ?? null,
      audioUrl: item.audioUrl,
      imageUrl: external.images[index % Math.max(external.images.length, 1)]?.imageUrl ?? null,
    })) ?? [];
  const titleWords = query
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z-]/g, '').toLowerCase())
    .filter((word) => word.length > 2)
    .map<Partial<TopicVocabularyWord>>((word) => ({
      word,
      meaning: `từ khóa ${word} trong chủ đề`,
      wordType: 'keyword',
    }));
  const merged = [...externalWords, ...searchPool, ...categoryPool, ...titleWords];
  const unique = new Map<string, Partial<TopicVocabularyWord>>();

  merged.forEach((item) => {
    const key = normalizeText(item.word ?? '');
    if (key && !unique.has(key)) unique.set(key, item);
  });

  let index = 1;
  while (unique.size < 100) {
    unique.set(`generated-${index}`, {
      word: `${slugifyLocal(query) || 'toeic'} expression ${index}`,
      meaning: `cụm diễn đạt ${index} trong chủ đề ${draft.title || query}`,
      wordType: 'phrase',
    });
    index += 1;
  }

  return Array.from(unique.values())
    .slice(0, 100)
    .map((item, wordIndex) => normalizeTeacherVocabularyWord(item, wordIndex, draft.title || draft.englishTitle));
}

function buildTeacherTopic(draft: TeacherTopicDraft, vocabulary: TopicVocabularyWord[], id?: string): LibraryTopic {
  const title = normalizeTeacherText(draft.title);
  const englishTitle = normalizeTeacherText(draft.englishTitle || draft.title);
  const category = draft.category;
  const categoryLabel = getTopicCategoryLabel(category);
  const topicId = id ?? `teacher-topic-${slugifyLocal(englishTitle || title)}-${Date.now()}`;

  return {
    id: topicId,
    title,
    englishTitle,
    category,
    categoryLabel,
    level: draft.level,
    stageId: `teacher-stage-${slugifyLocal(category)}`,
    stageName: `Chủ đề giáo viên - ${categoryLabel}`,
    stageOrder: 1,
    stageType: 'TuVungToeic',
    description: normalizeTeacherText(draft.description) || `Chủ đề ${englishTitle} cho lớp TOEIC.`,
    context: normalizeTeacherText(draft.description) || `Từ vựng TOEIC theo chủ đề ${englishTitle}.`,
    vocabulary,
  };
}

function formatDateLabel(value: string | Date | null | undefined) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

function getTopicAssetStatus(topic: LibraryTopic) {
  const wordCount = topic.vocabulary.length;
  const exampleCount = topic.vocabulary.filter((word) => Boolean(word.example)).length;
  const imageCount = topic.vocabulary.filter((word) => Boolean(word.imageUrl)).length;
  const audioCount = topic.vocabulary.filter((word) => Boolean(word.audioUrl)).length;
  const gamePairs = Math.min(8, wordCount);
  const readiness = Math.min(
    100,
    Math.round(
      (wordCount >= 100 ? 40 : (wordCount / 100) * 40) +
        (exampleCount >= 100 ? 25 : (exampleCount / 100) * 25) +
        (gamePairs >= 8 ? 15 : (gamePairs / 8) * 15) +
        (imageCount ? 10 : 0) +
        (audioCount ? 10 : 0),
    ),
  );
  const warnings = [
    wordCount < 100 ? 'Chủ đề chưa đủ tối thiểu 100 từ.' : null,
    exampleCount < wordCount ? 'Một số từ chưa có ví dụ ngữ cảnh.' : null,
    imageCount === 0 ? 'Chưa gắn ảnh thật/ảnh minh họa cho từ vựng.' : null,
    audioCount === 0 ? 'Chưa gắn file audio nguồn ngoài cho từ vựng.' : null,
    gamePairs < 8 ? 'Game ôn tập chưa đủ 8 cặp từ.' : null,
  ].filter((warning): warning is string => Boolean(warning));

  return { wordCount, exampleCount, imageCount, audioCount, gamePairs, readiness, warnings };
}

export default function LessonsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [studentPaths, setStudentPaths] = useState<LearningPathDetail[]>([]);
  const [selectedPathId, setSelectedPathId] = useState('');
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [managementLessons, setManagementLessons] = useState<LessonManagementSummary[]>([]);
  const [managementFilter, setManagementFilter] = useState<(typeof managementFilters)[number]>('all');
  const [managementQuery, setManagementQuery] = useState('');
  const [selectedManagementLessonId, setSelectedManagementLessonId] = useState('');
  const [teacherTopicQuery, setTeacherTopicQuery] = useState('');
  const [teacherTopicCategory, setTeacherTopicCategory] = useState('TatCa');
  const [selectedTeacherTopicId, setSelectedTeacherTopicId] = useState('');
  const [teacherTopicStore, setTeacherTopicStore] = useState<TeacherTopicStore>({
    overrides: {},
    customTopics: [],
    deletedIds: [],
  });
  const [topicDraft, setTopicDraft] = useState<TeacherTopicDraft>(defaultTopicDraft);
  const [topicAiBusy, setTopicAiBusy] = useState(false);
  const [topicAiMessage, setTopicAiMessage] = useState('');
  const [topicEditMode, setTopicEditMode] = useState(false);
  const [selectedTeacherWordId, setSelectedTeacherWordId] = useState('');
  const [wordDraft, setWordDraft] = useState<Partial<TopicVocabularyWord>>({});
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonLevel, setNewLessonLevel] = useState('A1');
  const [newLessonOrderIndex, setNewLessonOrderIndex] = useState(1);
  const [newLessonPassingScore, setNewLessonPassingScore] = useState(80);
  const [newLessonStatus, setNewLessonStatus] = useState<LessonManagementState>('Nhap');
  const [newLessonStageId, setNewLessonStageId] = useState('');
  const [newLessonTopicId, setNewLessonTopicId] = useState('');
  const [createLessonBusy, setCreateLessonBusy] = useState(false);
  const [lessonActionBusyId, setLessonActionBusyId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = session?.user.roles.includes(USER_ROLES.ADMIN) ?? false;
  const isManagementMode = session?.user.roles.some(
    (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
  );

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (storedSession.user.roles.includes(USER_ROLES.ADMIN) && pathname === '/lessons') {
      router.replace('/admin/lessons');
      return;
    }

    setSession(storedSession);
  }, [pathname, router]);

  useEffect(() => {
    if (!session) return;
    setTeacherTopicStore(readTeacherTopicStore());
  }, [session]);

  useEffect(() => {
    writeTeacherTopicStore(teacherTopicStore);
  }, [teacherTopicStore]);

  useEffect(() => {
    if (!selectedTeacherTopicId) return;
    setSelectedTeacherWordId('');
    setWordDraft({});
  }, [selectedTeacherTopicId]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    async function load() {
      try {
        if (isManagementMode) {
          const lessonsResponse = await apiGet<LessonManagementSummary[]>('/lessons/manage', currentSession.accessToken);

          if (!active) return;
          setManagementLessons(lessonsResponse);
          setPath(null);
          setStudentPaths([]);
          setProgress([]);
        } else {
          const progressRows = currentSession.user.roles.includes(USER_ROLES.STUDENT)
            ? await apiGet<ProgressRow[]>(
                `/progress/students/${currentSession.user.id}`,
                currentSession.accessToken,
              )
            : [];

          if (!active) return;
          setStudentPaths([]);
          setSelectedPathId('');
          setProgress(progressRows);
          setManagementLessons([]);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được bài học.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [isManagementMode, router, session]);

  useEffect(() => {
    if (isManagementMode) return;
    const nextPath = studentPaths.find((item) => item.id === selectedPathId) ?? studentPaths[0] ?? null;
    setPath(nextPath);
    if (!selectedPathId && nextPath) {
      setSelectedPathId(nextPath.id);
    }
  }, [isManagementMode, selectedPathId, studentPaths]);

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
  const lessonStates = useMemo(
    () => {
      if (!isManagementMode) {
        return topicLibrary.map((topic, index) => {
          const lessonProgress = progressByLesson.get(topic.id);
          const status = lessonProgress?.status ?? 'ChuaHoc';

          return {
            id: topic.id,
            title: topic.englishTitle,
            description: topic.description,
            level: topic.level,
            orderIndex: index + 1,
            passingScore: 80,
            stageName: topic.stageName,
            stageOrder: topic.stageOrder,
            stageType: topic.stageType,
            topicCategory: topic.category,
            topicLabel: topic.title,
            topicEnglishLabel: topic.englishTitle,
            topicContext: topic.context,
            status,
            percentComplete: lessonProgress?.percentComplete ?? 0,
            bestScore: lessonProgress?.bestScore ?? 0,
            canOpen: true,
            vocabularyCount: topic.vocabulary.length,
          };
        });
      }

      return path?.stages.flatMap((stage) =>
        stage.lessons.map((lesson) => {
          const lessonProgress = progressByLesson.get(lesson.id);
          const isFirstLesson = stage.orderIndex === 1 && lesson.orderIndex === 1;
          const status = lessonProgress?.status ?? (isFirstLesson ? 'ChuaHoc' : 'BiKhoa');

          const topicMeta = resolveVocabularyTopic({
            title: lesson.title,
            description: lesson.description,
            stageName: stage.name,
            stageType: stage.type,
            pathName: path.name,
          });

          return {
            ...lesson,
            stageName: stage.name,
            stageOrder: stage.orderIndex,
            stageType: stage.type,
            topicCategory: topicMeta.category,
            topicLabel: topicMeta.label,
            topicEnglishLabel: topicMeta.englishLabel,
            topicContext: topicMeta.context,
            status,
            percentComplete: lessonProgress?.percentComplete ?? 0,
            bestScore: lessonProgress?.bestScore ?? 0,
            canOpen: status !== 'BiKhoa',
            vocabularyCount: 0,
          };
        }),
      ) ?? [];
    },
    [isManagementMode, path?.stages, progressByLesson],
  );
  const filteredLessons = lessonStates;
  const stageSource = isManagementMode ? (path?.stages ?? []) : topicLibraryStages;
  const stageGroups = stageSource.map((stage) => ({
    ...stage,
    lessons: filteredLessons.filter((lesson) => lesson.stageOrder === stage.orderIndex),
    totalLessons: lessonStates.filter((lesson) => lesson.stageOrder === stage.orderIndex).length,
    completedLessons: lessonStates.filter(
      (lesson) => lesson.stageOrder === stage.orderIndex && lesson.status === 'HoanThanh',
    ).length,
  }));
  const visibleManagementLessons = useMemo(() => {
    const normalizedQuery = normalizeText(managementQuery.trim());

    return managementLessons
      .filter((lesson) => {
        if (managementFilter === 'published') return lesson.status === 'CongBo';
        if (managementFilter === 'draft') return lesson.status !== 'CongBo';
        return true;
      })
      .filter((lesson) => {
        if (!normalizedQuery) return true;
        return normalizeText(
          [
            lesson.title,
            lesson.description ?? '',
            lesson.content ?? '',
            lesson.level ?? '',
            lesson.pathName ?? '',
            lesson.stageName ?? '',
            lesson.topicName ?? '',
            lesson.status,
          ].join(' '),
        ).includes(normalizedQuery);
      });
  }, [managementFilter, managementLessons, managementQuery]);
  const stageOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
      }
    >();

    managementLessons.forEach((lesson) => {
      if (!lesson.stageId) return;
      if (map.has(lesson.stageId)) return;
      map.set(lesson.stageId, {
        id: lesson.stageId,
        label: `${lesson.pathName ?? 'Lộ trình'} / ${lesson.stageName ?? 'Giai đoạn'}`,
      });
    });

    return [...map.values()];
  }, [managementLessons]);
  const topicOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
      }
    >();

    managementLessons.forEach((lesson) => {
      if (!lesson.topicId) return;
      if (map.has(lesson.topicId)) return;
      map.set(lesson.topicId, {
        id: lesson.topicId,
        label: `${lesson.topicName ?? 'Chủ đề'}${lesson.pathName ? ` • ${lesson.pathName}` : ''}`,
      });
    });

    return [...map.values()];
  }, [managementLessons]);
  const managementStats = useMemo(() => {
    const totalLessons = managementLessons.length;
    const publishedLessons = managementLessons.filter((lesson) => lesson.status === 'CongBo').length;
    const draftLessons = totalLessons - publishedLessons;
    const totalTasks = managementLessons.reduce((sum, lesson) => sum + Number(lesson.tasksCount ?? 0), 0);
    const requiredTasks = managementLessons.reduce((sum, lesson) => sum + Number(lesson.requiredTasksCount ?? 0), 0);
    const totalVocab = managementLessons.reduce((sum, lesson) => sum + Number(lesson.vocabCount ?? 0), 0);
    const totalGrammar = managementLessons.reduce((sum, lesson) => sum + Number(lesson.grammarCount ?? 0), 0);
    const totalResources = managementLessons.reduce((sum, lesson) => sum + Number(lesson.resourcesCount ?? 0), 0);
    const totalQuizzes = managementLessons.reduce((sum, lesson) => sum + Number(lesson.quizzesCount ?? 0), 0);
    const publishedQuizzes = managementLessons.reduce(
      (sum, lesson) => sum + Number(lesson.publishedQuizzesCount ?? 0),
      0,
    );

    return {
      totalLessons,
      publishedLessons,
      draftLessons,
      totalTasks,
      requiredTasks,
      totalVocab,
      totalGrammar,
      totalResources,
      totalQuizzes,
      publishedQuizzes,
      lessonCoverage: totalLessons ? Math.round((publishedLessons / totalLessons) * 100) : 0,
      quizCoverage: totalQuizzes ? Math.round((publishedQuizzes / totalQuizzes) * 100) : 0,
    };
  }, [managementLessons]);
  const focusManagementLesson = useMemo(
    () =>
      visibleManagementLessons.find((lesson) => lesson.id === selectedManagementLessonId) ??
      visibleManagementLessons[0] ??
      null,
    [selectedManagementLessonId, visibleManagementLessons],
  );
  const focusContentLoad = focusManagementLesson
    ? Math.min(
        100,
        Math.round(
          (((Number(focusManagementLesson.tasksCount ?? 0) +
            Number(focusManagementLesson.requiredTasksCount ?? 0) +
            Number(focusManagementLesson.vocabCount ?? 0) +
            Number(focusManagementLesson.grammarCount ?? 0) +
            Number(focusManagementLesson.resourcesCount ?? 0) +
            Number(focusManagementLesson.quizzesCount ?? 0)) /
            18) *
            100),
        ),
      )
    : 0;
  const focusQuizReadiness = focusManagementLesson
    ? focusManagementLesson.quizzesCount
      ? Math.round((Number(focusManagementLesson.publishedQuizzesCount ?? 0) / focusManagementLesson.quizzesCount) * 100)
      : 0
    : 0;
  const focusLessonWarnings = focusManagementLesson
    ? [
        focusManagementLesson.status !== 'CongBo' ? 'Bài chưa công bố ra người học.' : null,
        !focusManagementLesson.stageId ? 'Chưa gắn giai đoạn học.' : null,
        !focusManagementLesson.topicId ? 'Chưa gắn chủ đề học.' : null,
        Number(focusManagementLesson.tasksCount ?? 0) === 0 ? 'Chưa có nhiệm vụ học tập.' : null,
        Number(focusManagementLesson.quizzesCount ?? 0) === 0 ? 'Chưa có quiz liên kết.' : null,
      ].filter((warning): warning is string => Boolean(warning))
    : [];
  const editableTeacherTopics = useMemo(() => {
    const deleted = new Set(teacherTopicStore.deletedIds);
    const base = topicLibrary
      .filter((topic) => !deleted.has(topic.id))
      .map((topic) => teacherTopicStore.overrides[topic.id] ?? topic);
    const custom = teacherTopicStore.customTopics.filter((topic) => !deleted.has(topic.id));
    return [...custom, ...base];
  }, [teacherTopicStore]);
  const teacherTopicCategories = useMemo(() => {
    const map = new Map<string, string>();
    editableTeacherTopics.forEach((topic) => {
      map.set(topic.category, topic.categoryLabel);
    });
    return [{ key: 'TatCa', label: 'Tất cả chủ đề' }, ...Array.from(map, ([key, label]) => ({ key, label }))];
  }, [editableTeacherTopics]);
  const visibleTeacherTopics = useMemo(() => {
    const query = normalizeText(teacherTopicQuery.trim());

    return editableTeacherTopics
      .filter((topic) => teacherTopicCategory === 'TatCa' || topic.category === teacherTopicCategory)
      .filter((topic) => {
        if (!query) return true;
        return normalizeText(
          [
            topic.title,
            topic.englishTitle,
            topic.categoryLabel,
            topic.stageName,
            topic.description,
            topic.context,
            topic.vocabulary.slice(0, 24).map((word) => word.word).join(' '),
          ].join(' '),
        ).includes(query);
      });
  }, [editableTeacherTopics, teacherTopicCategory, teacherTopicQuery]);
  const selectedTeacherTopic = useMemo(
    () =>
      visibleTeacherTopics.find((topic) => topic.id === selectedTeacherTopicId) ??
      visibleTeacherTopics[0] ??
      null,
    [selectedTeacherTopicId, visibleTeacherTopics],
  );
  const teacherTopicStats = useMemo(() => {
    const totalWords = editableTeacherTopics.reduce((sum, topic) => sum + topic.vocabulary.length, 0);
    const fullTopics = editableTeacherTopics.filter((topic) => topic.vocabulary.length >= 100).length;
    const totalExamples = editableTeacherTopics.reduce(
      (sum, topic) => sum + topic.vocabulary.filter((word) => Boolean(word.example)).length,
      0,
    );
    const assetWarnings = editableTeacherTopics.filter((topic) => getTopicAssetStatus(topic).warnings.length > 0).length;

    return {
      totalTopics: editableTeacherTopics.length,
      totalWords,
      fullTopics,
      totalExamples,
      assetWarnings,
    };
  }, [editableTeacherTopics]);
  const selectedTopicStatus = selectedTeacherTopic ? getTopicAssetStatus(selectedTeacherTopic) : null;

  useEffect(() => {
    if (!selectedTeacherWordId || !selectedTeacherTopic) return;
    const word = selectedTeacherTopic.vocabulary.find((item) => item.id === selectedTeacherWordId);
    setWordDraft(word ? { ...word } : {});
  }, [selectedTeacherTopic, selectedTeacherWordId]);

  useEffect(() => {
    if (!visibleTeacherTopics.length) {
      if (selectedTeacherTopicId) setSelectedTeacherTopicId('');
      return;
    }

    if (!selectedTeacherTopicId || !visibleTeacherTopics.some((topic) => topic.id === selectedTeacherTopicId)) {
      setSelectedTeacherTopicId(visibleTeacherTopics[0].id);
    }
  }, [selectedTeacherTopicId, visibleTeacherTopics]);

  useEffect(() => {
    if (!visibleManagementLessons.length) {
      if (selectedManagementLessonId) {
        setSelectedManagementLessonId('');
      }
      return;
    }

    if (!selectedManagementLessonId || !visibleManagementLessons.some((lesson) => lesson.id === selectedManagementLessonId)) {
      setSelectedManagementLessonId(visibleManagementLessons[0].id);
    }
  }, [selectedManagementLessonId, visibleManagementLessons]);

  useEffect(() => {
    if (!newLessonStageId && stageOptions[0]) {
      setNewLessonStageId(stageOptions[0].id);
    }
    if (!newLessonTopicId && !stageOptions.length && topicOptions[0]) {
      setNewLessonTopicId(topicOptions[0].id);
    }
  }, [newLessonStageId, newLessonTopicId, stageOptions, topicOptions]);

  function persistTeacherTopic(topic: LibraryTopic) {
    setTeacherTopicStore((current) => {
      const isBaseTopic = topicLibrary.some((item) => item.id === topic.id);
      if (isBaseTopic) {
        return {
          ...current,
          deletedIds: current.deletedIds.filter((id) => id !== topic.id),
          overrides: {
            ...current.overrides,
            [topic.id]: topic,
          },
        };
      }

      const existing = current.customTopics.some((item) => item.id === topic.id);
      return {
        ...current,
        deletedIds: current.deletedIds.filter((id) => id !== topic.id),
        customTopics: existing
          ? current.customTopics.map((item) => (item.id === topic.id ? topic : item))
          : [topic, ...current.customTopics],
      };
    });
  }

  async function handleGenerateTeacherTopic() {
    if (!session) return;
    setError('');
    setSuccessMessage('');
    setTopicAiMessage('');
    setTopicAiBusy(true);

    try {
      const correctedTitle = normalizeTeacherText(topicDraft.englishTitle || topicDraft.title);
      const correctedVietnameseTitle = normalizeTeacherText(topicDraft.title || correctedTitle);
      const correctedDescription = normalizeTeacherText(topicDraft.description);
      const category = topicDraft.category || guessTopicCategory(correctedTitle, correctedDescription);
      const normalizedDraft: TeacherTopicDraft = {
        ...topicDraft,
        title: correctedVietnameseTitle,
        englishTitle: correctedTitle,
        description: correctedDescription,
        category,
      };

      let external: ExploreContentResponse | null = null;
      try {
        const params = new URLSearchParams({
          q: normalizedDraft.englishTitle,
          text: normalizedDraft.description || normalizedDraft.englishTitle,
          limit: '20',
        });
        external = await apiGet<ExploreContentResponse>(`/integrations/explore?${params.toString()}`, session.accessToken);
      } catch (err) {
        const message =
          err instanceof ApiError && err.status === 0
            ? 'API ngoài chưa phản hồi, hệ thống dùng kho TOEIC nội bộ để sinh bản nháp.'
            : 'Nguồn ngoài chưa đủ ổn định, hệ thống dùng kho TOEIC nội bộ để sinh bản nháp.';
        setTopicAiMessage(message);
      }

      const vocabulary = buildGeneratedVocabulary(normalizedDraft, external);
      const topic = buildTeacherTopic(normalizedDraft, vocabulary);
      persistTeacherTopic(topic);
      setSelectedTeacherTopicId(topic.id);
      setTopicDraft(defaultTopicDraft);
      setTopicAiMessage(
        external
          ? `AI đã chuẩn hóa tên chủ đề, lấy ${external.vocabulary.length} từ từ nguồn ngoài và sinh đủ ${vocabulary.length} từ.`
          : `AI đã chuẩn hóa tên chủ đề và sinh đủ ${vocabulary.length} từ từ kho TOEIC nội bộ.`,
      );
      setSuccessMessage(`Đã thêm chủ đề "${topic.englishTitle}" vào danh sách quản lý.`);
    } finally {
      setTopicAiBusy(false);
    }
  }

  function handleLoadTopicForEdit(topic: LibraryTopic) {
    setTopicEditMode(true);
    setTopicDraft({
      title: topic.title,
      englishTitle: topic.englishTitle,
      description: topic.description,
      category: topic.category,
      level: topic.level,
    });
    setSelectedTeacherTopicId(topic.id);
  }

  function handleSaveTopicDetails() {
    if (!selectedTeacherTopic) return;
    const normalizedDraft: TeacherTopicDraft = {
      title: normalizeTeacherText(topicDraft.title || selectedTeacherTopic.title),
      englishTitle: normalizeTeacherText(topicDraft.englishTitle || selectedTeacherTopic.englishTitle),
      description: normalizeTeacherText(topicDraft.description || selectedTeacherTopic.description),
      category: topicDraft.category || selectedTeacherTopic.category,
      level: topicDraft.level || selectedTeacherTopic.level,
    };
    const nextTopic = buildTeacherTopic(normalizedDraft, selectedTeacherTopic.vocabulary, selectedTeacherTopic.id);
    persistTeacherTopic(nextTopic);
    setTopicEditMode(false);
    setSelectedTeacherTopicId(nextTopic.id);
    setSuccessMessage(`Đã cập nhật chủ đề "${nextTopic.englishTitle}".`);
  }

  function handleDeleteTeacherTopic(topicId: string) {
    const topic = editableTeacherTopics.find((item) => item.id === topicId);
    setTeacherTopicStore((current) => ({
      overrides: Object.fromEntries(Object.entries(current.overrides).filter(([id]) => id !== topicId)),
      customTopics: current.customTopics.filter((item) => item.id !== topicId),
      deletedIds: Array.from(new Set([...current.deletedIds, topicId])),
    }));
    setSelectedTeacherTopicId('');
    setSuccessMessage(topic ? `Đã xóa chủ đề "${topic.englishTitle}" khỏi danh sách.` : 'Đã xóa chủ đề.');
  }

  function handleSelectTeacherWord(word: TopicVocabularyWord) {
    setSelectedTeacherWordId(word.id);
    setWordDraft({ ...word });
  }

  function handleNewTeacherWord() {
    setSelectedTeacherWordId('');
    setWordDraft({
      word: '',
      meaning: '',
      wordType: 'noun',
      example: '',
      exampleMeaning: '',
      phonetic: '',
      imageUrl: '',
      audioUrl: '',
    });
  }

  function handleSaveTeacherWord() {
    if (!selectedTeacherTopic) return;
    const normalized = normalizeTeacherVocabularyWord(
      {
        ...wordDraft,
        id: wordDraft.id || `teacher-word-${Date.now()}`,
      },
      selectedTeacherTopic.vocabulary.length,
      selectedTeacherTopic.title,
    );
    if (!normalized.word) {
      setError('Cần nhập từ vựng trước khi lưu.');
      return;
    }

    const exists = selectedTeacherTopic.vocabulary.some((word) => word.id === normalized.id);
    const vocabulary = exists
      ? selectedTeacherTopic.vocabulary.map((word) => (word.id === normalized.id ? normalized : word))
      : [normalized, ...selectedTeacherTopic.vocabulary];
    persistTeacherTopic(withTeacherTopicOverride(selectedTeacherTopic, vocabulary));
    setSelectedTeacherWordId(normalized.id);
    setWordDraft(normalized);
    setError('');
    setSuccessMessage(`Đã lưu từ "${normalized.word}" trong chủ đề ${selectedTeacherTopic.englishTitle}.`);
  }

  function handleDeleteTeacherWord(wordId: string) {
    if (!selectedTeacherTopic) return;
    const vocabulary = selectedTeacherTopic.vocabulary.filter((word) => word.id !== wordId);
    persistTeacherTopic(withTeacherTopicOverride(selectedTeacherTopic, vocabulary));
    setSelectedTeacherWordId('');
    setWordDraft({});
    setSuccessMessage('Đã xóa từ khỏi chủ đề.');
  }

  async function handleCreateLesson() {
    if (!session) return;
    setError('');
    setSuccessMessage('');

    if (newLessonTitle.trim().length < 5 || newLessonDescription.trim().length < 10) {
      setError('Tên bài học cần ít nhất 5 ký tự và mô tả cần ít nhất 10 ký tự.');
      return;
    }

    if (!newLessonStageId && !newLessonTopicId) {
      setError('Cần chọn ít nhất một giai đoạn hoặc chủ đề cho bài học mới.');
      return;
    }

    setCreateLessonBusy(true);
    try {
      const created = await apiPost<LessonManagementSummary>(
        '/lessons',
        {
          stageId: newLessonStageId || undefined,
          topicId: newLessonTopicId || undefined,
          title: newLessonTitle,
          description: newLessonDescription,
          content: newLessonContent,
          level: newLessonLevel,
          orderIndex: newLessonOrderIndex,
          passingScore: newLessonPassingScore,
          status: newLessonStatus,
        },
        session.accessToken,
      );
      setManagementLessons((current) => [created, ...current.filter((lesson) => lesson.id !== created.id)]);
      setNewLessonTitle('');
      setNewLessonDescription('');
      setNewLessonContent('');
      setNewLessonLevel('A1');
      setNewLessonOrderIndex(1);
      setNewLessonPassingScore(80);
      setNewLessonStatus('Nhap');
      setSuccessMessage(`Đã tạo bài học "${created.title}".`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không tạo được bài học.');
    } finally {
      setCreateLessonBusy(false);
    }
  }

  async function handleUpdateLessonStatus(lesson: LessonManagementSummary, status: LessonManagementState) {
    if (!session || lesson.status === status) return;
    setError('');
    setSuccessMessage('');
    setLessonActionBusyId(lesson.id);

    try {
      const updated = await apiPatch<LessonManagementSummary>(`/lessons/${lesson.id}/status`, { status }, session.accessToken);
      setManagementLessons((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMessage(
        `Đã chuyển "${updated.title}" sang trạng thái ${
          lessonManagementStatusLabels[updated.status as LessonManagementState] ?? updated.status
        }.`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái bài học.');
    } finally {
      setLessonActionBusyId('');
    }
  }

  function handleLogout() {
    clearStoredSession();
    router.replace('/login');
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang tải bài học...</p>
      </main>
    );
  }

  if (isManagementMode && !isAdmin) {
    return (
      <AppShell
        session={session}
        active="lessons"
        roleContext={USER_ROLES.TEACHER}
        showSidebar={false}
        eyebrow="Giáo viên"
        title="Quản lý chủ đề từ vựng TOEIC"
      >
        <section className="teacherTopicHero panel">
          <div>
            <p className="eyebrow">CRUD chủ đề từ vựng</p>
            <h2>Thêm, sửa, xóa chủ đề và bộ từ vựng TOEIC bằng AI hỗ trợ.</h2>
            <p>
              Giáo viên nhập tên chủ đề và mô tả, hệ thống chuẩn hóa chính tả, khai thác nguồn ngoài nếu có,
              sinh bộ từ gợi ý rồi đưa vào danh sách để tiếp tục chỉnh từng từ.
            </p>
          </div>
          <div className="teacherTopicHeroStats">
            <span>
              <BookOpen size={16} />
              {teacherTopicStats.totalTopics} chủ đề
            </span>
            <span>
              <Layers3 size={16} />
              {teacherTopicStats.totalWords} từ
            </span>
            <span>
              <CheckCircle2 size={16} />
              {teacherTopicStats.fullTopics} đủ 100 từ
            </span>
            <span>
              <ShieldAlert size={16} />
              {teacherTopicStats.assetWarnings} cần rà soát
            </span>
          </div>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {successMessage ? <div className="successBox dashboardMessage">{successMessage}</div> : null}
        {topicAiMessage ? <div className="subtleBox dashboardMessage">{topicAiMessage}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ kho chủ đề TOEIC...</div> : null}

        <section className="teacherTopicBuilder panel">
          <div className="sectionTitle">
            <div>
              <h2>{topicEditMode ? 'Sửa chủ đề đang chọn' : 'Thêm chủ đề bằng AI'}</h2>
              <span>AI hỗ trợ sửa chính tả, phân nhóm TOEIC và sinh đủ bộ từ vựng ban đầu.</span>
            </div>
            <button className="secondaryButton" type="button" onClick={() => {
              setTopicEditMode(false);
              setTopicDraft(defaultTopicDraft);
            }}>
              <X size={15} />
              Làm mới
            </button>
          </div>

          <div className="teacherTopicFormGrid">
            <label className="field">
              <span>Tên tiếng Việt</span>
              <input
                value={topicDraft.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setTopicDraft((current) => ({
                    ...current,
                    title,
                    category: guessTopicCategory(current.englishTitle || title, current.description),
                  }));
                }}
                placeholder="Ví dụ: Trái cây, Văn phòng, Sân bay..."
              />
            </label>
            <label className="field">
              <span>Tên / keyword tiếng Anh</span>
              <input
                value={topicDraft.englishTitle}
                onChange={(event) => {
                  const englishTitle = event.target.value;
                  setTopicDraft((current) => ({
                    ...current,
                    englishTitle,
                    category: guessTopicCategory(englishTitle, current.description),
                  }));
                }}
                placeholder="Ví dụ: Fruits, Office routines, Airport travel..."
              />
            </label>
            <label className="field">
              <span>Nhóm TOEIC</span>
              <select
                value={topicDraft.category}
                onChange={(event) =>
                  setTopicDraft((current) => ({
                    ...current,
                    category: event.target.value as LibraryTopic['category'],
                  }))
                }
              >
                {topicCategoryFilters
                  .filter((category) => category.key !== 'TatCa')
                  .map((category) => (
                    <option value={category.key} key={category.key}>
                      {category.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>Cấp độ</span>
              <select
                value={topicDraft.level}
                onChange={(event) =>
                  setTopicDraft((current) => ({
                    ...current,
                    level: event.target.value as LibraryTopic['level'],
                  }))
                }
              >
                {['A1', 'A2', 'B1', 'B2'].map((level) => (
                  <option value={level} key={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="field teacherTopicDescriptionField">
              <span>Mô tả chủ đề</span>
              <textarea
                value={topicDraft.description}
                onChange={(event) => {
                  const description = event.target.value;
                  setTopicDraft((current) => ({
                    ...current,
                    description,
                    category: guessTopicCategory(current.englishTitle || current.title, description),
                  }));
                }}
                placeholder="Mô tả ngữ cảnh học, ví dụ: từ vựng TOEIC về cuộc họp, báo cáo, email và lịch làm việc..."
              />
            </label>
          </div>

          <div className="teacherTopicBuilderActions">
            {topicEditMode ? (
              <button className="primaryButton" type="button" onClick={handleSaveTopicDetails}>
                <Save size={15} />
                Lưu thay đổi chủ đề
              </button>
            ) : (
              <button
                className="primaryButton"
                type="button"
                onClick={handleGenerateTeacherTopic}
                disabled={topicAiBusy || !(topicDraft.title || topicDraft.englishTitle)}
              >
                {topicAiBusy ? <RefreshCw size={15} /> : <Wand2 size={15} />}
                {topicAiBusy ? 'Đang sinh chủ đề...' : 'Phân tích và thêm chủ đề'}
              </button>
            )}
          </div>
        </section>

        <section className="teacherTopicToolbar panel">
          <label className="field">
            <span>Tìm chủ đề / từ khóa</span>
            <div className="parentSearchInput">
              <Search size={16} />
              <input
                value={teacherTopicQuery}
                onChange={(event) => setTeacherTopicQuery(event.target.value)}
                placeholder="office, invoice, airport, meeting..."
              />
            </div>
          </label>
          <label className="field">
            <span>Nhóm TOEIC</span>
            <select value={teacherTopicCategory} onChange={(event) => setTeacherTopicCategory(event.target.value)}>
              {teacherTopicCategories.map((category) => (
                <option value={category.key} key={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <span className="inlineBadge">
            <Filter size={14} />
            {visibleTeacherTopics.length}/{editableTeacherTopics.length}
          </span>
        </section>

        <section className="teacherTopicWorkspace">
          <div className="teacherTopicListPanel panel">
            <div className="sectionTitle">
              <div>
                <h2>Danh sách chủ đề</h2>
                <span>Chọn một chủ đề để xem độ sẵn sàng và mở màn rà soát.</span>
              </div>
            </div>

            <div className="teacherTopicGrid">
              {visibleTeacherTopics.map((topic) => {
                const status = getTopicAssetStatus(topic);
                const active = selectedTeacherTopic?.id === topic.id;

                return (
                  <article className={`teacherTopicCard ${active ? 'active' : ''}`} key={topic.id}>
                    <div className="teacherTopicCardHead">
                      <div>
                        <p className="eyebrow">{topic.categoryLabel}</p>
                        <strong>{topic.englishTitle}</strong>
                        <span>{topic.title}</span>
                      </div>
                      <em>{topic.level}</em>
                    </div>

                    <p>{topic.description}</p>

                    <div className="teacherTopicMeta">
                      <span>{topic.vocabulary.length} từ</span>
                      <span>{status.exampleCount} ví dụ</span>
                      <span>{status.gamePairs} cặp game</span>
                      <span>{status.readiness}% sẵn sàng</span>
                    </div>

                    <div className="progressRail" aria-label={`Độ sẵn sàng ${topic.englishTitle}`}>
                      <div className="progressFill" style={{ width: `${status.readiness}%` }} />
                    </div>

                    <div className="teacherTopicActions">
                      <button className="secondaryButton" type="button" onClick={() => setSelectedTeacherTopicId(topic.id)}>
                        Xem nhanh
                      </button>
                      <button className="secondaryButton" type="button" onClick={() => handleLoadTopicForEdit(topic)}>
                        <Edit3 size={14} />
                        Sửa
                      </button>
                      <button className="dangerButton" type="button" onClick={() => handleDeleteTeacherTopic(topic.id)}>
                        <Trash2 size={14} />
                        Xóa
                      </button>
                      <Link className="primaryButton" href={`/lessons/${topic.id}/game`}>
                        Game
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}

              {!visibleTeacherTopics.length && !loading ? (
                <div className="subtleBox">Không có chủ đề TOEIC nào khớp bộ lọc hiện tại.</div>
              ) : null}
            </div>
          </div>

          <aside className="teacherTopicDetail panel">
            {selectedTeacherTopic && selectedTopicStatus ? (
              <>
                <div className="teacherTopicDetailHead">
                  <p className="eyebrow">{selectedTeacherTopic.stageName}</p>
                  <h2>{selectedTeacherTopic.englishTitle}</h2>
                  <span>{selectedTeacherTopic.context}</span>
                </div>

                <div className="teacherTopicScore" style={{ '--score-fill': `${selectedTopicStatus.readiness}%` } as CSSProperties}>
                  <strong>{selectedTopicStatus.readiness}%</strong>
                  <small>sẵn sàng</small>
                </div>

                <div className="teacherTopicChecklist">
                  <div>
                    <CheckCircle2 size={16} />
                    <span>100 từ vựng TOEIC theo chủ đề</span>
                    <strong>{selectedTeacherTopic.vocabulary.length}/100</strong>
                  </div>
                  <div>
                    <CheckCircle2 size={16} />
                    <span>Ví dụ ngữ cảnh cho từng từ</span>
                    <strong>{selectedTopicStatus.exampleCount}</strong>
                  </div>
                  <div>
                    <PlayCircle size={16} />
                    <span>Game Flash Match dùng bộ từ này</span>
                    <strong>{selectedTopicStatus.gamePairs} cặp</strong>
                  </div>
                  <div className={selectedTopicStatus.imageCount ? '' : 'warning'}>
                    <ShieldAlert size={16} />
                    <span>Ảnh minh họa cần rà soát</span>
                    <strong>{selectedTopicStatus.imageCount}</strong>
                  </div>
                  <div className={selectedTopicStatus.audioCount ? '' : 'warning'}>
                    <ShieldAlert size={16} />
                    <span>Audio nguồn ngoài cần rà soát</span>
                    <strong>{selectedTopicStatus.audioCount}</strong>
                  </div>
                </div>

                <div className="teacherTopicWordPreview">
                  {selectedTeacherTopic.vocabulary.slice(0, 18).map((word) => (
                    <span key={word.id}>
                      <strong>{word.word}</strong>
                      <small>{word.meaning}</small>
                    </span>
                  ))}
                </div>

                <div className="teacherTopicWarnings">
                  {selectedTopicStatus.warnings.map((warning) => (
                    <div key={warning}>
                      <ShieldAlert size={14} />
                      <span>{warning}</span>
                    </div>
                  ))}
                  {!selectedTopicStatus.warnings.length ? (
                    <div>
                      <CheckCircle2 size={14} />
                      <span>Chủ đề đã đủ dữ liệu nền để học viên học và chơi.</span>
                    </div>
                  ) : null}
                </div>

                <div className="teacherWordManager">
                  <div className="sectionTitle compact">
                    <div>
                      <h3>Quản lý từ vựng trong chủ đề</h3>
                      <span>Thêm, sửa, xóa từ; AI chuẩn hóa chính tả và câu ví dụ trước khi lưu.</span>
                    </div>
                    <button className="secondaryButton" type="button" onClick={handleNewTeacherWord}>
                      <Plus size={14} />
                      Thêm từ
                    </button>
                  </div>

                  <div className="teacherWordEditor">
                    <div className="teacherWordList">
                      {selectedTeacherTopic.vocabulary.slice(0, 100).map((word) => (
                        <button
                          className={word.id === selectedTeacherWordId ? 'active' : ''}
                          type="button"
                          key={word.id}
                          onClick={() => handleSelectTeacherWord(word)}
                        >
                          <strong>{word.word}</strong>
                          <span>{word.meaning}</span>
                        </button>
                      ))}
                    </div>

                    <div className="teacherWordForm">
                      <label className="field">
                        <span>Từ tiếng Anh</span>
                        <input
                          value={wordDraft.word ?? ''}
                          onChange={(event) => setWordDraft((current) => ({ ...current, word: event.target.value }))}
                          placeholder="invoice, agenda, apple..."
                        />
                      </label>
                      <label className="field">
                        <span>Nghĩa tiếng Việt</span>
                        <input
                          value={wordDraft.meaning ?? ''}
                          onChange={(event) => setWordDraft((current) => ({ ...current, meaning: event.target.value }))}
                          placeholder="hóa đơn, chương trình họp..."
                        />
                      </label>
                      <label className="field">
                        <span>Loại từ</span>
                        <input
                          value={wordDraft.wordType ?? ''}
                          onChange={(event) => setWordDraft((current) => ({ ...current, wordType: event.target.value }))}
                          placeholder="noun, verb, adjective..."
                        />
                      </label>
                      <label className="field">
                        <span>Phiên âm</span>
                        <input
                          value={wordDraft.phonetic ?? ''}
                          onChange={(event) => setWordDraft((current) => ({ ...current, phonetic: event.target.value }))}
                          placeholder="/ˈɪn.vɔɪs/"
                        />
                      </label>
                      <label className="field teacherTopicDescriptionField">
                        <span>Câu ví dụ</span>
                        <textarea
                          value={wordDraft.example ?? ''}
                          onChange={(event) => setWordDraft((current) => ({ ...current, example: event.target.value }))}
                          placeholder="The team reviewed the invoice before payment."
                        />
                      </label>
                      <label className="field teacherTopicDescriptionField">
                        <span>Dịch câu ví dụ</span>
                        <textarea
                          value={wordDraft.exampleMeaning ?? ''}
                          onChange={(event) => setWordDraft((current) => ({ ...current, exampleMeaning: event.target.value }))}
                          placeholder="Nhóm đã xem lại hóa đơn trước khi thanh toán."
                        />
                      </label>

                      <div className="teacherTopicActions detail">
                        <button className="primaryButton" type="button" onClick={handleSaveTeacherWord}>
                          <Save size={14} />
                          Lưu từ
                        </button>
                        {wordDraft.id ? (
                          <button className="dangerButton" type="button" onClick={() => handleDeleteTeacherWord(String(wordDraft.id))}>
                            <Trash2 size={14} />
                            Xóa từ
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="teacherTopicActions detail">
                  <Link className="secondaryButton" href="/dashboard">
                    Về dashboard
                  </Link>
                  <Link className="secondaryButton" href={`/lessons/${selectedTeacherTopic.id}/learn`}>
                    Mở màn học
                  </Link>
                  <Link className="primaryButton" href={`/lessons/${selectedTeacherTopic.id}/game`}>
                    Kiểm game chủ đề
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="subtleBox">Chọn một chủ đề TOEIC để xem chi tiết quản lý.</div>
            )}
          </aside>
        </section>
      </AppShell>
    );
  }

  if (isManagementMode) {
    return (
      <AppShell
        session={session}
        active="lessons"
        roleContext={USER_ROLES.ADMIN}
        showSidebar={false}
        eyebrow="Quản lý bài học"
        title="Điều phối bài học"
      >
        <section className="pageHeroCompact">
          <div>
            <p className="eyebrow">{isAdmin ? 'Điều phối nội dung học tập' : 'Quản lý nội dung học tập'}</p>
            <h2>
              {isAdmin
                ? 'Quản trị viên kiểm soát toàn bộ bài học, độ đầy đủ nội dung và trạng thái công bố.'
                : 'Giáo viên quản lý toàn bộ bài học, theo dõi trạng thái công bố và rà soát nội dung đi kèm.'}
            </h2>
            <p>
              Màn hình này hiển thị bài học theo lộ trình, giai đoạn, chủ đề, trạng thái và số lượng
              nhiệm vụ, từ vựng, ngữ pháp, tài nguyên và quiz liên kết.
            </p>
          </div>
          <span className="inlineBadge">
            <LibraryBig size={16} />
            {visibleManagementLessons.length}/{managementStats.totalLessons} bài
          </span>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {successMessage ? <div className="subtleBox dashboardMessage">{successMessage}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang tải dữ liệu bài học...</div> : null}

        <section className="lessonManagementFocus">
          <div className="lessonManagementFocusCopy">
            <p className="eyebrow">Bài học ưu tiên</p>
            <h3>{focusManagementLesson ? focusManagementLesson.title : 'Chưa có bài học phù hợp bộ lọc'}</h3>
            <p>
              {focusManagementLesson
                ? focusManagementLesson.description ?? 'Bài học này chưa có mô tả chi tiết.'
                : 'Hãy đổi bộ lọc hoặc từ khóa tìm kiếm để xem bài học đang được ưu tiên xử lý.'}
            </p>

            {focusManagementLesson ? (
              <>
                <div className="progressJourneyBadges lessonManagementMeta">
                  <span>
                    <CheckCircle2 size={14} />
                    {statusLabels[focusManagementLesson.status] ?? focusManagementLesson.status}
                  </span>
                  <span>
                    <LibraryBig size={14} />
                    {focusManagementLesson.pathName ?? 'Chưa gắn lộ trình'}
                  </span>
                  <span>
                    <Layers3 size={14} />
                    {focusManagementLesson.stageName ?? 'Chưa gắn giai đoạn'}
                  </span>
                  <span>
                    <BookOpen size={14} />
                    {focusManagementLesson.topicName ?? 'Chưa gắn chủ đề'}
                  </span>
                </div>

                <div className="lessonManagementReadiness">
                  <div>
                    <div className="lessonManagementReadinessHead">
                      <span>Khối lượng nội dung</span>
                      <strong>{focusContentLoad}%</strong>
                    </div>
                    <div className="progressRail">
                      <div className="progressFill" style={{ width: `${focusContentLoad}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="lessonManagementReadinessHead">
                      <span>Quiz công bố</span>
                      <strong>{focusQuizReadiness}%</strong>
                    </div>
                    <div className="progressRail">
                      <div className="progressFill" style={{ width: `${focusQuizReadiness}%` }} />
                    </div>
                  </div>
                </div>

                {focusLessonWarnings.length ? (
                  <div className="lessonManagementWarnings">
                    {focusLessonWarnings.map((warning) => (
                      <div key={warning}>
                        <ShieldAlert size={14} />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="subtleBox lessonManagementReady">
                    Bài học đang ở trạng thái khá ổn: đủ cấu trúc và đã sẵn sàng tiếp tục chỉnh sửa nhỏ.
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="lessonManagementSnapshot">
            <article className="accent">
              <span>Tổng bài</span>
              <strong>{managementStats.totalLessons}</strong>
              <small>Tổng lượng bài đang quản lý</small>
            </article>
            <article>
              <span>Đã công bố</span>
              <strong>{managementStats.publishedLessons}</strong>
              <small>Bài sẵn sàng cho học viên</small>
            </article>
            <article>
              <span>Bản nháp / ẩn</span>
              <strong>{managementStats.draftLessons}</strong>
              <small>Bài còn đang biên soạn</small>
            </article>
            <article>
              <span>Nội dung công bố</span>
              <strong>
                {managementStats.lessonCoverage}% / {managementStats.quizCoverage}%
              </strong>
              <small>Tỉ lệ công bố bài học và quiz</small>
            </article>
          </div>
        </section>

        <section className="lessonInsightGrid" aria-label="Tổng quan quản lý bài học">
          <div className="lessonInsightCard">
            <LibraryBig size={18} />
            <span>Tổng bài</span>
            <strong>{managementStats.totalLessons}</strong>
          </div>
          <div className="lessonInsightCard">
            <CheckCircle2 size={18} />
            <span>Đã công bố</span>
            <strong>{managementStats.publishedLessons}</strong>
          </div>
          <div className="lessonInsightCard">
            <ShieldAlert size={18} />
            <span>Bản nháp / ẩn</span>
            <strong>{managementStats.draftLessons}</strong>
          </div>
          <div className="lessonInsightCard">
            <BarChart3 size={18} />
            <span>Nội dung công bố</span>
            <strong>
              {managementStats.lessonCoverage}% / {managementStats.quizCoverage}%
            </strong>
          </div>
        </section>

        <section className="lessonManagementToolbar panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Bộ lọc quản lý</h2>
              <span>Tìm theo tên, lộ trình, giai đoạn, chủ đề hoặc trạng thái nội dung.</span>
            </div>
            <span className="inlineBadge">
              <Sparkles size={14} />
              {visibleManagementLessons.length}/{managementLessons.length}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <label className="field" style={{ minWidth: 0 }}>
              <span>Tìm bài học</span>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  value={managementQuery}
                  onChange={(event) => setManagementQuery(event.target.value)}
                  placeholder="Nhập tên bài, lộ trình, giai đoạn hoặc chủ đề"
                />
              </div>
            </label>

            <div className="parentFilterGroup" role="tablist" aria-label="Lọc trạng thái bài học">
              {managementFilters.map((filter) => (
                <button
                  className={`lessonFilterButton ${managementFilter === filter ? 'active' : ''}`}
                  key={filter}
                  type="button"
                  onClick={() => setManagementFilter(filter)}
                  aria-pressed={managementFilter === filter}
                >
                  <Filter size={15} />
                  {filter === 'all' ? 'Tất cả' : filter === 'published' ? 'Đã công bố' : 'Bản nháp / ẩn'}
                </button>
              ))}
            </div>
          </div>

          <div className="featureMeta" style={{ marginTop: 14 }}>
            <em>
              <BookOpen size={14} />
              {managementStats.totalTasks} nhiệm vụ
            </em>
            <em>
              <Target size={14} />
              {managementStats.requiredTasks} nhiệm vụ bắt buộc
            </em>
            <em>
              <Layers3 size={14} />
              {managementStats.totalVocab} từ vựng
            </em>
            <em>
              <Compass size={14} />
              {managementStats.totalGrammar} ngữ pháp
            </em>
            <em>
              <PlayCircle size={14} />
              {managementStats.totalResources} tài nguyên
            </em>
            <em>
              <CheckCircle2 size={14} />
              {managementStats.totalQuizzes} quiz
            </em>
          </div>
        </section>

        <section className="lessonManagementToolbar panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Tạo bài học mới</h2>
              <span>Khởi tạo bài học theo đúng lộ trình, giai đoạn và chủ đề cần biên soạn.</span>
            </div>
            <span className="inlineBadge">
              <LibraryBig size={14} />
              CRUD
            </span>
          </div>

          <div className="teacherSupportGrid">
            <label className="field">
              <span>Tiêu đề bài học</span>
              <input value={newLessonTitle} onChange={(event) => setNewLessonTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Cấp độ</span>
              <input value={newLessonLevel} onChange={(event) => setNewLessonLevel(event.target.value)} />
            </label>
            <label className="field teacherSupportTextarea">
              <span>Mô tả</span>
              <textarea
                rows={3}
                value={newLessonDescription}
                onChange={(event) => setNewLessonDescription(event.target.value)}
              />
            </label>
            <label className="field teacherSupportTextarea">
              <span>Nội dung bài học</span>
              <textarea
                rows={4}
                value={newLessonContent}
                onChange={(event) => setNewLessonContent(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Giai đoạn</span>
              <select value={newLessonStageId} onChange={(event) => setNewLessonStageId(event.target.value)}>
                <option value="">Chọn giai đoạn</option>
                {stageOptions.map((stage) => (
                  <option value={stage.id} key={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Chủ đề</span>
              <select value={newLessonTopicId} onChange={(event) => setNewLessonTopicId(event.target.value)}>
                <option value="">Chọn chủ đề</option>
                {topicOptions.map((topic) => (
                  <option value={topic.id} key={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Thứ tự</span>
              <input
                type="number"
                min={1}
                value={newLessonOrderIndex}
                onChange={(event) => setNewLessonOrderIndex(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Điểm đạt yêu cầu (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={newLessonPassingScore}
                onChange={(event) => setNewLessonPassingScore(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Trạng thái</span>
              <select
                value={newLessonStatus}
                onChange={(event) => setNewLessonStatus(event.target.value as LessonManagementState)}
              >
                <option value="Nhap">Bản nháp</option>
                <option value="CongBo">Công bố</option>
                <option value="An">Đang ẩn</option>
              </select>
            </label>
          </div>

          <div className="parentStudentActions" style={{ marginTop: 12 }}>
            <button
              className="primaryButton"
              type="button"
              disabled={createLessonBusy}
              onClick={() => void handleCreateLesson()}
            >
              {createLessonBusy ? 'Đang tạo...' : 'Tạo bài học'}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="lessonManagementWorkspace">
          <aside className="lessonManagementRoster">
            <div className="sectionTitle">
              <div>
                <h2>Danh sách bài học</h2>
                <span>
                  {visibleManagementLessons.length} / {managementLessons.length} bài học phù hợp bộ lọc
                </span>
              </div>
              <span className="inlineBadge">
                <Sparkles size={14} />
                {managementFilter === 'all'
                  ? 'Tất cả'
                  : managementFilter === 'published'
                    ? 'Đã công bố'
                    : 'Bản nháp / ẩn'}
              </span>
            </div>

            <div className="lessonManagementGrid">
              {visibleManagementLessons.map((lesson) => {
                const contentLoad = Math.min(
                  100,
                  Math.max(
                    8,
                    Math.round(
                      ((Number(lesson.tasksCount ?? 0) +
                        Number(lesson.requiredTasksCount ?? 0) +
                        Number(lesson.vocabCount ?? 0) +
                        Number(lesson.grammarCount ?? 0) +
                        Number(lesson.resourcesCount ?? 0) +
                        Number(lesson.quizzesCount ?? 0)) /
                        18) *
                        100,
                    ),
                  ),
                );
                const activeLessonCard = focusManagementLesson?.id === lesson.id;

                return (
                  <article
                    className={`lessonListCard lessonManagementCard ${activeLessonCard ? 'active' : ''}`}
                    key={lesson.id}
                  >
                    <div className="pathCardTop">
                      <div className="featureIcon">
                        <LibraryBig size={20} />
                      </div>
                      <span className="inlineBadge">
                        <CheckCircle2 size={14} />
                        {statusLabels[lesson.status] ?? lesson.status}
                      </span>
                    </div>

                    <div>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.description}</p>
                    </div>

                    <div className="featureMeta">
                      <em>{lesson.pathName ?? 'Chưa gắn lộ trình'}</em>
                      <em>{lesson.stageName ?? 'Chưa gắn giai đoạn'}</em>
                      <em>{lesson.topicName ?? 'Chưa gắn chủ đề'}</em>
                      <em>{lesson.level ?? '--'}</em>
                    </div>

                    <div className="progressRail" aria-label={`Mức độ nội dung của ${lesson.title}`}>
                      <div className="progressFill" style={{ width: `${contentLoad}%` }} />
                    </div>

                    <div className="pathCardStats">
                      <span>{lesson.tasksCount} nhiệm vụ</span>
                      <span>{lesson.vocabCount} từ</span>
                      <span>{lesson.quizzesCount} quiz</span>
                    </div>

                    <div className="featureMeta">
                      <em>
                        <Target size={14} />
                        Đạt {lesson.passingScore}%
                      </em>
                      <em>{formatDateLabel(lesson.createdAt)}</em>
                      <em>{formatDateLabel(lesson.updatedAt)}</em>
                    </div>

                    <div className="parentStudentActions">
                      <button
                        type="button"
                        className="secondaryButton"
                        onClick={() => setSelectedManagementLessonId(lesson.id)}
                      >
                        Xem nhanh
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={lessonActionBusyId === lesson.id || lesson.status === 'CongBo'}
                        onClick={() => void handleUpdateLessonStatus(lesson, 'CongBo')}
                      >
                        Công bố
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={lessonActionBusyId === lesson.id || lesson.status === 'Nhap'}
                        onClick={() => void handleUpdateLessonStatus(lesson, 'Nhap')}
                      >
                        Đưa về nháp
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={lessonActionBusyId === lesson.id || lesson.status === 'An'}
                        onClick={() => void handleUpdateLessonStatus(lesson, 'An')}
                      >
                        Ẩn
                      </button>
                    </div>

                    <Link
                      className="primaryButton fullWidth"
                      href={`/lessons/${lesson.id}`}
                      onClick={() => setSelectedManagementLessonId(lesson.id)}
                    >
                      Mở chi tiết quản lý
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}

              {!visibleManagementLessons.length && !loading ? (
                <div className="subtleBox">Không có bài học nào khớp bộ lọc hiện tại.</div>
              ) : null}
            </div>
          </aside>

          <aside className="lessonManagementDetail">
            {focusManagementLesson ? (
              <section className="lessonManagementDetailHero">
                <div className="lessonManagementDetailCopy">
                  <p className="eyebrow">Chi tiết nhanh</p>
                  <h3>{focusManagementLesson.title}</h3>
                  <p>{focusManagementLesson.description ?? 'Bài học chưa có mô tả chi tiết.'}</p>
                  <div className="progressJourneyBadges lessonManagementMeta">
                    <span>
                      <Compass size={14} />
                      {focusManagementLesson.pathName ?? 'Chưa gắn lộ trình'}
                    </span>
                    <span>
                      <Layers3 size={14} />
                      {focusManagementLesson.stageName ?? 'Chưa gắn giai đoạn'}
                    </span>
                    <span>
                      <BookOpen size={14} />
                      {focusManagementLesson.topicName ?? 'Chưa gắn chủ đề'}
                    </span>
                    <span>
                      <TrendingUp size={14} />
                      Đạt {focusManagementLesson.passingScore}%
                    </span>
                  </div>
                </div>

                <div
                  className="lessonManagementScore"
                  style={{ '--score-fill': `${focusContentLoad}%` } as CSSProperties}
                >
                  <strong>{focusContentLoad}%</strong>
                  <small>khối lượng nội dung</small>
                </div>
              </section>
            ) : null}

            <div className="lessonManagementSnapshot">
              <article>
                <span>Nhiệm vụ</span>
                <strong>{focusManagementLesson?.tasksCount ?? 0}</strong>
                <small>{focusManagementLesson?.requiredTasksCount ?? 0} bắt buộc</small>
              </article>
              <article>
                <span>Từ vựng</span>
                <strong>{focusManagementLesson?.vocabCount ?? 0}</strong>
                <small>Danh mục từ học kèm theo</small>
              </article>
              <article>
                <span>Ngữ pháp</span>
                <strong>{focusManagementLesson?.grammarCount ?? 0}</strong>
                <small>Khối kiến thức ngữ pháp</small>
              </article>
              <article>
                <span>Tài nguyên</span>
                <strong>{focusManagementLesson?.resourcesCount ?? 0}</strong>
                <small>File nghe, hình ảnh, tài liệu</small>
              </article>
              <article>
                <span>Quiz</span>
                <strong>{focusManagementLesson?.quizzesCount ?? 0}</strong>
                <small>{focusManagementLesson?.publishedQuizzesCount ?? 0} quiz công bố</small>
              </article>
              <article>
                <span>Thứ tự</span>
                <strong>{focusManagementLesson?.lessonOrder ?? 0}</strong>
                <small>Vị trí hiển thị trong chặng</small>
              </article>
            </div>

            {focusLessonWarnings.length ? (
              <div className="lessonManagementWarnings">
                {focusLessonWarnings.map((warning) => (
                  <div key={warning}>
                    <ShieldAlert size={14} />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="subtleBox lessonManagementReady">
                Bài học này đã đủ cấu trúc cơ bản và có thể tiếp tục tinh chỉnh nội dung chi tiết.
              </div>
            )}
          </aside>
        </section>

      </AppShell>
    );
  }

  return (
    <main className="studentUcStandalone studentLessonStandalone topicLearningHub">
      <header className="studentUcTopbar">
        <div>
          <p className="eyebrow">Học viên</p>
          <h1>Học từ vựng theo chủ đề</h1>
        </div>
        <div className="topbarActions">
          <Link className="secondaryButton" href="/dashboard">
            Về dashboard
          </Link>
          <ThemeToggleButton />
          <button className="secondaryButton" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải chủ đề từ vựng...</div> : null}

      <section className="lessonStageList">
        {stageGroups.map((stage) => (
          <article className="lessonStagePanel" key={stage.id}>
            <div className="sectionTitle">
              <div>
                <h2>{stage.orderIndex}. {stage.name}</h2>
              </div>
            </div>

            <div className="topicCards simpleTopicList">
              {stage.lessons.map((lesson) => {
                return (
                  <article className="topicCard simpleTopicCard" key={lesson.id}>
                    <strong>
                      {lesson.orderIndex}. {lesson.topicEnglishLabel} - {lesson.topicLabel}
                    </strong>
                    <p>{lesson.topicContext}</p>
                    <Link className="primaryButton" href={`/lessons/${lesson.id}/learn`}>
                      Chọn chủ đề
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}

              {!stage.lessons.length ? (
                <div className="subtleBox">Không có chủ đề nào trong bộ lọc này.</div>
              ) : null}
            </div>
          </article>
        ))}

        {!lessonStates.length && !loading ? <div className="subtleBox">Chưa có chủ đề từ vựng công bố.</div> : null}
      </section>
    </main>
  );
}
