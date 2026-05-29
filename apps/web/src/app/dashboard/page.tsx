'use client';

import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  Flame,
  Gamepad2,
  Heart,
  LibraryBig,
  LockKeyhole,
  PlayCircle,
  ScanSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { USER_ROLES, type UserRole } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import { topicLibrary } from '../../lib/topic-library';

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

type StudentProgressRow = {
  id: string;
  status: string;
  percentComplete: number;
  bestScore: number;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
};

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
    nextLevelXp: number;
  } | null;
  quests: Array<{
    id: string;
    title: string;
    description: string | null;
    target: number;
    rewardXp: number;
    rewardCoins: number;
    progress: number;
    status: string;
    claimed: boolean;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string | null;
    rewardXp: number;
  }>;
  stats: {
    totalPlays: number;
  };
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
  totalLessons?: number;
  attemptsCount?: number;
  passedAttemptsCount?: number;
  bestQuizScore?: number;
  latestAttemptAt?: string | null;
  linkedParentsCount?: number;
};

type ParentReviewSuggestion = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lessonId: string | null;
  lessonTitle: string | null;
  topicName: string | null;
  pathName: string | null;
  stageName: string | null;
  reason: string;
  priority: number;
  status: string;
  createdAt: string;
  lessonStatus: string;
  lessonProgress: number;
  bestScore: number;
  latestQuizTitle: string | null;
  latestQuizPercentage: number | null;
  latestQuizStatus: string | null;
  latestQuizSubmittedAt: string | null;
};

type ParentNotification = {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientKind: 'PhuHuynh' | 'HocVien';
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  sentAt: string;
};

type RoleProfile = {
  label: string;
  summary: string;
  badge: string;
  privateUseCases: string[];
};

type DashboardFallbackData = {
  summary: Summary;
  learningPath: LearningPathDetail;
  studentProgress: StudentProgressRow[];
  gameDashboard: GameDashboard;
  linkedStudents: LinkedStudent[];
  teacherStudents: LinkedStudent[];
  reviewSuggestions: ParentReviewSuggestion[];
  parentNotifications: ParentNotification[];
};

const roleProfiles: Record<UserRole, RoleProfile> = {
  [USER_ROLES.STUDENT]: {
    label: 'Học viên',
    summary: 'Học TOEIC theo chủ đề, ngữ pháp, luyện Part, thi thử và xem tiến trình.',
    badge: 'Học TOEIC',
    privateUseCases: [
      'Học từ vựng TOEIC theo chủ đề kèm ảnh, audio, ví dụ và game ôn',
      'Học ngữ pháp TOEIC theo topic, luyện câu Part 5/6',
      'Xem cấu trúc bài thi TOEIC và mẹo làm từng Part',
      'Ôn luyện đề mẫu TOEIC theo Part hoặc Full test',
      'Thi thử TOEIC như bài thật và xem lời giải chi tiết',
      'Theo dõi tiến trình, điểm mạnh/yếu và gợi ý học tiếp',
    ],
  },
  [USER_ROLES.PARENT]: {
    label: 'Phụ huynh',
    summary: 'Theo dõi hồ sơ học tập, kết quả kiểm tra và những điểm cần hỗ trợ của con.',
    badge: 'Giám sát học tập',
    privateUseCases: [
      'Theo dõi hồ sơ học tập của con bằng audit log',
      'Xem kết quả kiểm tra và điểm cần cải thiện',
      'Nhận cảnh báo, gợi ý hỗ trợ ôn tập tại nhà',
      'Theo dõi thông báo học tập của gia đình',
    ],
  },
  [USER_ROLES.TEACHER]: {
    label: 'Giáo viên',
    summary: 'Điều phối nội dung TOEIC, đề luyện, thi thử và hỗ trợ học viên theo dữ liệu.',
    badge: 'Điều phối TOEIC',
    privateUseCases: [
      'Quản lý kho chủ đề từ vựng TOEIC và bộ từ theo ngữ cảnh',
      'Quản lý topic ngữ pháp TOEIC và bài luyện Part 5/6',
      'Quản lý quiz, đề mẫu, Part luyện tập và đáp án giải thích',
      'Audit quá trình học, kết quả thi thử TOEIC và cảnh báo học viên cần hỗ trợ',
    ],
  },
  [USER_ROLES.ADMIN]: {
    label: 'Quản trị viên',
    summary: 'Điều phối tài khoản, phân quyền, kiểm duyệt nội dung TOEIC và vận hành hệ thống.',
    badge: 'System governance',
    privateUseCases: [
      'Quản lý tài khoản và phân quyền actor',
      'Kiểm duyệt và công bố kho nội dung TOEIC',
      'Giám sát dữ liệu học tập toàn hệ thống',
      'Cấu hình hệ thống, tích hợp và nhật ký vận hành',
    ],
  },
};

const commonUseCases = [
  'Đăng nhập và xác thực phiên làm việc',
  'Xem dashboard theo vai trò',
  'Đổi giao diện ngày/đêm',
  'Đăng xuất khỏi hệ thống',
];

const contentHubSources = [
  'Datamuse',
  'LanguageTool',
  'Tatoeba',
  'Openverse',
  'Wikimedia',
  'Wikipedia',
  'Free Dictionary',
  'Merriam-Webster',
  'Pixabay',
  'Pexels',
];

const roleCommandItems: Record<
  UserRole,
  Array<{
    href: string;
    icon: ComponentType<{ size?: number }>;
    label: string;
    text: string;
  }>
> = {
  [USER_ROLES.STUDENT]: [
    {
      href: '/lessons',
      icon: BookOpen,
      label: 'Học từ vựng theo chủ đề',
      text: 'Học từ bằng ảnh, audio, ngữ cảnh, luyện nhanh, game và test trong một luồng.',
    },
    {
      href: '/grammar',
      icon: ClipboardCheck,
      label: 'Học ngữ pháp TOEIC',
      text: 'Chọn topic ngữ pháp TOEIC, học quy tắc, ví dụ công sở và chơi game luyện Part 5/6.',
    },
    {
      href: '/toeic-guide',
      icon: Compass,
      label: 'Giới thiệu bài thi TOEIC',
      text: 'Xem cấu trúc Listening & Reading, Speaking & Writing, cách làm từng Part và mẹo đạt điểm cao.',
    },
    {
      href: '/toeic-practice',
      icon: PlayCircle,
      label: 'Ôn luyện bài thi mẫu TOEIC',
      text: 'Chọn đề mô phỏng, luyện từng Part hoặc làm Full test theo thời gian TOEIC thật.',
    },
    {
      href: '/ets-practice',
      icon: FileText,
      label: 'Thi thử TOEIC',
      text: 'Vào phòng thi thử TOEIC với PDF LC/RC, audio, answer sheet 200 câu và đồng hồ 120 phút.',
    },
    {
      href: '/progress',
      icon: ChartNoAxesCombined,
      label: 'Theo dõi tiến trình học tập',
      text: 'Thống kê chủ đề, từ đã nhớ/chưa nhớ, điểm game/test, XP, pet và gợi ý học tiếp.',
    },
  ],
  [USER_ROLES.PARENT]: [
    {
      href: '/parent/audit',
      icon: ScanSearch,
      label: 'Theo dõi hồ sơ học tập của con',
      text: 'Xem audit log học tập: bài học, nhiệm vụ, quiz, game, AI Vision, thông báo và cảnh báo theo thời gian.',
    },
    {
      href: '/parent/results',
      icon: CheckCircle2,
      label: 'Xem kết quả học tập và thi thử',
      text: 'Tổng hợp điểm quiz, bài cần ôn, lượt thi thử TOEIC, độ chính xác và tiến bộ của con.',
    },
    {
      href: '/parent/support',
      icon: ShieldCheck,
      label: 'Nhận cảnh báo và gợi ý ôn tập',
      text: 'Xem bài cần ôn, lý do cảnh báo, mức ưu tiên và việc phụ huynh nên làm tiếp theo.',
    },
    {
      href: '/parent/notifications',
      icon: Bell,
      label: 'Nhắc nhở và tương tác học tập',
      text: 'Theo dõi nhắc nhở, thông báo mới và phản hồi hỗ trợ học tập cho con.',
    },
  ],
  [USER_ROLES.TEACHER]: [
    {
      href: '/lessons',
      icon: BookOpen,
      label: 'Quản lý chủ đề từ vựng TOEIC',
      text: 'Thêm, sửa, xóa chủ đề và bộ từ vựng; dùng AI hỗ trợ chuẩn hóa nội dung và sinh dữ liệu theo chủ đề.',
    },
    {
      href: '/grammar',
      icon: LibraryBig,
      label: 'Quản lý ngữ pháp TOEIC',
      text: 'Rà soát topic ngữ pháp, công thức, ví dụ, lỗi thường gặp và bài luyện Part 5/6.',
    },
    {
      href: '/toeic-practice',
      icon: CheckCircle2,
      label: 'Quản lý đề luyện TOEIC',
      text: 'Theo dõi đề mẫu, từng Part, thời gian làm bài, đáp án và lời giải cho học viên luyện tập.',
    },
    {
      href: '/progress',
      icon: ChartNoAxesCombined,
      label: 'Audit học tập và cảnh báo',
      text: 'Gộp theo dõi kết quả, audit log, cảnh báo và nhắc nhở hỗ trợ học viên trong một màn.',
    },
  ],
  [USER_ROLES.ADMIN]: [
    {
      href: '/admin/users',
      icon: Users,
      label: 'Quản lý tài khoản và phân quyền',
      text: 'Kiểm soát người dùng, vai trò actor, trạng thái truy cập và rủi ro phân quyền.',
    },
    {
      href: '/admin/content',
      icon: LibraryBig,
      label: 'Kiểm duyệt kho nội dung TOEIC',
      text: 'Gom lộ trình, chủ đề, bài học, quiz và đề luyện để duyệt trước khi công bố.',
    },
    {
      href: '/admin/progress',
      icon: ChartNoAxesCombined,
      label: 'Giám sát dữ liệu học tập',
      text: 'Theo dõi tiến độ, kết quả TOEIC, audit học tập và tín hiệu cần can thiệp.',
    },
    {
      href: '/admin',
      icon: Settings,
      label: 'Cấu hình, tích hợp và nhật ký',
      text: 'Theo dõi sức khỏe API, cấu hình nền tảng, nguồn tích hợp và log vận hành.',
    },
  ],
};

function canViewSystemSummary(roles: string[]) {
  return roles.some((role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN);
}

function buildFallbackDashboardData(): DashboardFallbackData {
  const learningPath: LearningPathDetail = {
    id: 'fallback-path-a1',
    name: 'A1 Foundation Path',
    description: 'Lộ trình khởi động với từ vựng, phát âm, ngữ pháp và sân chơi học tập.',
    level: 'A1',
    targetAudience: 'Học viên mới bắt đầu',
    status: 'CongBo',
    stages: [
      {
        id: 'fallback-stage-1',
        name: 'Làm quen từ vựng',
        type: 'TuVung',
        orderIndex: 1,
        description: 'Học viên học các mẫu chào hỏi, số đếm và màu sắc.',
        lessons: [
          {
            id: 'fallback-lesson-1',
            title: 'Chào hỏi cơ bản',
            description: 'Làm quen lời chào, giới thiệu tên và phản xạ hội thoại đầu tiên.',
            level: 'A1',
            orderIndex: 1,
            passingScore: 80,
          },
          {
            id: 'fallback-lesson-2',
            title: 'Số đếm và màu sắc',
            description: 'Nhận diện từ vựng nền tảng để mô tả đồ vật đơn giản.',
            level: 'A1',
            orderIndex: 2,
            passingScore: 80,
          },
        ],
      },
      {
        id: 'fallback-stage-2',
        name: 'Nghe và phát âm',
        type: 'Nghe',
        orderIndex: 2,
        description: 'Luyện nghe ngắn và phát âm rõ từng âm cơ bản.',
        lessons: [
          {
            id: 'fallback-lesson-3',
            title: 'Âm cơ bản /s/ /z/',
            description: 'Luyện phân biệt âm và phát âm theo cụm từ ngắn.',
            level: 'A1',
            orderIndex: 1,
            passingScore: 80,
          },
          {
            id: 'fallback-lesson-4',
            title: 'Nghe hội thoại ngắn',
            description: 'Nghe câu lệnh, xác định ý chính và chọn đáp án đúng.',
            level: 'A1',
            orderIndex: 2,
            passingScore: 80,
          },
        ],
      },
      {
        id: 'fallback-stage-3',
        name: 'Ngữ pháp nền tảng',
        type: 'NguPhap',
        orderIndex: 3,
        description: 'Xây nền với to be, đại từ và câu hỏi cơ bản.',
        lessons: [
          {
            id: 'fallback-lesson-5',
            title: 'To be và đại từ nhân xưng',
            description: 'Hiểu cách ghép chủ ngữ với động từ to be trong câu đơn.',
            level: 'A1',
            orderIndex: 1,
            passingScore: 80,
          },
          {
            id: 'fallback-lesson-6',
            title: 'Câu hỏi Yes/No',
            description: 'Tạo câu hỏi ngắn để luyện phản xạ hỏi đáp thực tế.',
            level: 'A1',
            orderIndex: 2,
            passingScore: 80,
          },
        ],
      },
    ],
  };

  const studentProgress: StudentProgressRow[] = [
    {
      id: 'fallback-progress-1',
      status: 'DangHoc',
      percentComplete: 45,
      bestScore: 84,
      lessonId: 'fallback-lesson-1',
      lessonTitle: 'Chào hỏi cơ bản',
      lessonOrder: 1,
    },
    {
      id: 'fallback-progress-2',
      status: 'ChuaHoc',
      percentComplete: 0,
      bestScore: 0,
      lessonId: 'fallback-lesson-2',
      lessonTitle: 'Số đếm và màu sắc',
      lessonOrder: 2,
    },
    {
      id: 'fallback-progress-3',
      status: 'HoanThanh',
      percentComplete: 100,
      bestScore: 92,
      lessonId: 'fallback-lesson-3',
      lessonTitle: 'Âm cơ bản /s/ /z/',
      lessonOrder: 1,
    },
    {
      id: 'fallback-progress-4',
      status: 'BiKhoa',
      percentComplete: 0,
      bestScore: 0,
      lessonId: 'fallback-lesson-4',
      lessonTitle: 'Nghe hội thoại ngắn',
      lessonOrder: 2,
    },
    {
      id: 'fallback-progress-5',
      status: 'ChuaHoc',
      percentComplete: 20,
      bestScore: 65,
      lessonId: 'fallback-lesson-5',
      lessonTitle: 'To be và đại từ nhân xưng',
      lessonOrder: 1,
    },
    {
      id: 'fallback-progress-6',
      status: 'BiKhoa',
      percentComplete: 0,
      bestScore: 0,
      lessonId: 'fallback-lesson-6',
      lessonTitle: 'Câu hỏi Yes/No',
      lessonOrder: 2,
    },
  ];

  const gameDashboard: GameDashboard = {
    pet: {
      id: 'fallback-pet-pingu',
      name: 'Pingu',
      kind: 'chim cánh cụt',
      level: 4,
      xp: 420,
      coins: 180,
      mood: 'Phấn khởi',
      bond: 72,
      nextLevelXp: 600,
    },
    quests: [
      {
        id: 'quest-1',
        title: 'Học 1 bài mới',
        description: 'Hoàn thành một bài để nhận XP và giữ nhịp học.',
        target: 1,
        rewardXp: 50,
        rewardCoins: 20,
        progress: 1,
        status: 'HoanThanh',
        claimed: true,
      },
      {
        id: 'quest-2',
        title: 'Làm 1 quiz',
        description: 'Chấm điểm và mở khóa bài tiếp theo.',
        target: 1,
        rewardXp: 80,
        rewardCoins: 30,
        progress: 0,
        status: 'DangHoc',
        claimed: false,
      },
      {
        id: 'quest-3',
        title: 'Nghe 2 lần',
        description: 'Nghe audio để luyện tai và phát âm.',
        target: 2,
        rewardXp: 40,
        rewardCoins: 10,
        progress: 1,
        status: 'DangHoc',
        claimed: false,
      },
      {
        id: 'quest-4',
        title: 'Chơi mini game',
        description: 'Hoàn thành 1 lượt chơi để nhận phần thưởng.',
        target: 1,
        rewardXp: 60,
        rewardCoins: 25,
        progress: 1,
        status: 'HoanThanh',
        claimed: false,
      },
    ],
    badges: [
      {
        id: 'badge-1',
        name: 'Khởi động nhanh',
        description: 'Hoàn thành bài đầu tiên.',
        rewardXp: 20,
      },
      {
        id: 'badge-2',
        name: 'Nghe tốt',
        description: 'Nghe đủ số lượt yêu cầu.',
        rewardXp: 40,
      },
      {
        id: 'badge-3',
        name: 'Chuỗi học ổn định',
        description: 'Giữ nhịp học liên tục.',
        rewardXp: 60,
      },
    ],
    stats: {
      totalPlays: 12,
    },
  };

  const linkedStudents: LinkedStudent[] = [
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
      totalLessons: 8,
      attemptsCount: 7,
      passedAttemptsCount: 5,
      bestQuizScore: 88,
      latestAttemptAt: new Date().toISOString(),
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
      totalLessons: 7,
      attemptsCount: 4,
      passedAttemptsCount: 2,
      bestQuizScore: 71,
      latestAttemptAt: new Date().toISOString(),
      linkedParentsCount: 1,
    },
  ];

  const teacherStudents: LinkedStudent[] = [
    ...linkedStudents,
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
      totalLessons: 8,
      attemptsCount: 8,
      passedAttemptsCount: 7,
      bestQuizScore: 94,
      latestAttemptAt: new Date().toISOString(),
      linkedParentsCount: 1,
    },
  ];

  const reviewSuggestions: ParentReviewSuggestion[] = [
    {
      id: 'review-1',
      studentId: 'student-2',
      studentName: 'Trần Gia Bảo',
      studentEmail: 'gialbao@englishpro.local',
      lessonId: 'fallback-lesson-4',
      lessonTitle: 'Nghe hội thoại ngắn',
      topicName: 'Nghe hiểu',
      pathName: 'A1 Foundation Path',
      stageName: 'Nghe và phát âm',
      reason: 'Quiz gần nhất chưa đạt ngưỡng 80%, nên cần nghe lại và làm lại bài.',
      priority: 1,
      status: 'ChuaXem',
      createdAt: new Date().toISOString(),
      lessonStatus: 'DangHoc',
      lessonProgress: 42,
      bestScore: 71,
      latestQuizTitle: 'Listening Check 01',
      latestQuizPercentage: 71,
      latestQuizStatus: 'ChuaXem',
      latestQuizSubmittedAt: new Date().toISOString(),
    },
    {
      id: 'review-2',
      studentId: 'student-1',
      studentName: 'Nguyễn Minh Anh',
      studentEmail: 'minhanh@englishpro.local',
      lessonId: 'fallback-lesson-2',
      lessonTitle: 'Số đếm và màu sắc',
      topicName: 'Từ vựng nền tảng',
      pathName: 'A1 Foundation Path',
      stageName: 'Làm quen từ vựng',
      reason: 'Tiến độ ổn định, chỉ cần nhắc hoàn thành nốt bài còn khóa.',
      priority: 2,
      status: 'DaXem',
      createdAt: new Date().toISOString(),
      lessonStatus: 'DangHoc',
      lessonProgress: 67,
      bestScore: 88,
      latestQuizTitle: 'Vocabulary Sprint 01',
      latestQuizPercentage: 88,
      latestQuizStatus: 'HoanThanh',
      latestQuizSubmittedAt: new Date().toISOString(),
    },
  ];

  const parentNotifications: ParentNotification[] = [
    {
      id: 'notify-1',
      recipientId: 'parent-1',
      recipientName: 'Trần Văn Nam',
      recipientEmail: 'phuhuynh@englishpro.local',
      recipientKind: 'PhuHuynh',
      title: 'Học viên vừa hoàn thành bài phát âm',
      content: 'Nguyễn Minh Anh đã hoàn thành bài Âm cơ bản /s/ /z/ với điểm tốt.',
      type: 'ThongBaoHeThong',
      isRead: false,
      sentAt: new Date().toISOString(),
    },
    {
      id: 'notify-2',
      recipientId: 'student-2',
      recipientName: 'Trần Gia Bảo',
      recipientEmail: 'gialbao@englishpro.local',
      recipientKind: 'HocVien',
      title: 'Cần ôn lại bài nghe',
      content: 'Quiz gần nhất chưa đạt mức yêu cầu, hệ thống đề xuất nghe lại bài và làm lại.',
      type: 'CanhBaoHocTap',
      isRead: true,
      sentAt: new Date().toISOString(),
    },
  ];

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
    learningPath,
    studentProgress,
    gameDashboard,
    linkedStudents,
    teacherStudents,
    reviewSuggestions,
    parentNotifications,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>(USER_ROLES.STUDENT);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathDetail | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgressRow[]>([]);
  const [gameDashboard, setGameDashboard] = useState<GameDashboard | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<LinkedStudent[]>([]);
  const [reviewSuggestions, setReviewSuggestions] = useState<ParentReviewSuggestion[]>([]);
  const [parentNotifications, setParentNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('live');

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

    const allowedRoles = session.user.roles.filter((role): role is UserRole => role in roleProfiles);
    if (!allowedRoles.includes(activeRole)) {
      setActiveRole(allowedRoles[0] ?? USER_ROLES.STUDENT);
    }
  }, [activeRole, session]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const [me, paths] = await Promise.all([
          apiGet<WebAuthSession['user']>('/auth/me', currentSession.accessToken),
          apiGet<LearningPathSummary[]>('/learning-paths', currentSession.accessToken),
        ]);

        if (!active) return;

        const [
          summaryResponse,
          pathResponse,
          progressResponse,
          gameResponse,
          linkedStudentsResponse,
          teacherStudentsResponse,
          reviewResponse,
          notificationResponse,
        ] = await Promise.all([
          canViewSystemSummary(me.roles)
            ? apiGet<Summary>('/users/summary', currentSession.accessToken)
            : Promise.resolve(null),
          paths[0]
            ? apiGet<LearningPathDetail>(`/learning-paths/${paths[0].id}`, currentSession.accessToken)
            : Promise.resolve(null),
          me.roles.includes(USER_ROLES.STUDENT)
            ? apiGet<StudentProgressRow[]>(`/progress/students/${me.id}`, currentSession.accessToken)
            : Promise.resolve([]),
          me.roles.includes(USER_ROLES.STUDENT)
            ? apiGet<GameDashboard>('/gamification/me', currentSession.accessToken)
            : Promise.resolve(null),
          me.roles.includes(USER_ROLES.PARENT)
            ? apiGet<LinkedStudent[]>('/parents/me/students', currentSession.accessToken)
            : Promise.resolve([]),
          canViewSystemSummary(me.roles)
            ? apiGet<LinkedStudent[]>('/users/students', currentSession.accessToken)
            : Promise.resolve([]),
          me.roles.includes(USER_ROLES.PARENT)
            ? apiGet<ParentReviewSuggestion[]>('/parents/me/review-suggestions', currentSession.accessToken)
            : Promise.resolve([]),
          me.roles.includes(USER_ROLES.PARENT)
            ? apiGet<ParentNotification[]>('/parents/me/notifications', currentSession.accessToken)
            : Promise.resolve([]),
        ]);

        if (!active) return;

        setSession((current) => (current ? { ...current, user: me } : current));
        setSummary(summaryResponse);
        setLearningPath(pathResponse);
        setStudentProgress(progressResponse);
        setGameDashboard(gameResponse);
        setLinkedStudents(linkedStudentsResponse);
        setTeacherStudents(teacherStudentsResponse);
        setReviewSuggestions(reviewResponse);
        setParentNotifications(notificationResponse);
        setDataMode('live');
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 0) {
          const fallback = buildFallbackDashboardData();
          setSummary(fallback.summary);
          setLearningPath(fallback.learningPath);
          setStudentProgress(fallback.studentProgress);
          setGameDashboard(fallback.gameDashboard);
          setLinkedStudents(fallback.linkedStudents);
          setTeacherStudents(fallback.teacherStudents);
          setReviewSuggestions(fallback.reviewSuggestions);
          setParentNotifications(fallback.parentNotifications);
          setError('');
          setDataMode('demo');
          return;
        }

        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router, session?.accessToken]);

  const availableRoles = useMemo(
    () => session?.user.roles.filter((role): role is UserRole => role in roleProfiles) ?? [],
    [session],
  );
  const currentRole = availableRoles.includes(activeRole)
    ? activeRole
    : availableRoles[0] ?? USER_ROLES.STUDENT;
  const roleProfile = roleProfiles[currentRole];
  const commandItems = roleCommandItems[currentRole];
  const lessons = learningPath?.stages.flatMap((stage) => stage.lessons) ?? [];
  const studentLessons =
    learningPath?.stages.flatMap((stage) =>
      stage.lessons.map((lesson) => ({
        ...lesson,
        stageName: stage.name,
        stageOrder: stage.orderIndex,
      })),
    ) ?? [];
  const completedCount = studentProgress.filter((item) => item.status === 'HoanThanh').length;
  const activeCount = studentProgress.filter((item) => item.status === 'DangHoc').length;
  const lockedCount = studentProgress.filter((item) => item.status === 'BiKhoa').length;
  const bestScore = studentProgress.reduce((max, item) => Math.max(max, item.bestScore ?? 0), 0);
  const parentReviewSummary = useMemo(() => {
    const urgentCount = reviewSuggestions.filter((item) => item.priority <= 1 && item.status !== 'HoanThanh').length;
    const newCount = reviewSuggestions.filter((item) => item.status === 'ChuaXem').length;
    const doneCount = reviewSuggestions.filter((item) => item.status === 'HoanThanh').length;
    const unreadNotifications = parentNotifications.filter((item) => !item.isRead).length;
    const averageStudentProgress = linkedStudents.length
      ? Math.round(
          linkedStudents.reduce((total, student) => total + Number(student.averageProgress ?? 0), 0) /
            linkedStudents.length,
        )
      : 0;

    return {
      urgentCount,
      newCount,
      doneCount,
      unreadNotifications,
      averageStudentProgress,
    };
  }, [linkedStudents, parentNotifications, reviewSuggestions]);
  const averageProgress = studentProgress.length
    ? Math.round(
        studentProgress.reduce((total, item) => total + Number(item.percentComplete ?? 0), 0) /
          studentProgress.length,
      )
    : 0;
  const teacherSupportSummary = useMemo(() => {
    const totalStudents = teacherStudents.length;
    const urgentStudents = teacherStudents.filter((student) => isStudentNeedingSupport(student));
    const steadyStudents = teacherStudents.filter((student) => getTeacherSupportBand(student) === 'steady');
    const focusStudents = [...teacherStudents].sort((left, right) => {
      const leftBand = getTeacherSupportBand(left);
      const rightBand = getTeacherSupportBand(right);

      if (leftBand !== rightBand) {
        return getSupportBandRank(leftBand) - getSupportBandRank(rightBand);
      }

      return Number(left.averageProgress ?? 0) - Number(right.averageProgress ?? 0);
    });
    const averageTeacherProgress = totalStudents
      ? Math.round(
          teacherStudents.reduce((total, student) => total + Number(student.averageProgress ?? 0), 0) /
            totalStudents,
        )
      : 0;
    const bestQuizScore = teacherStudents.reduce(
      (max, student) => Math.max(max, Number(student.bestQuizScore ?? 0)),
      0,
    );
    const bestStreak = teacherStudents.reduce((max, student) => Math.max(max, Number(student.learningStreak ?? 0)), 0);

    return {
      totalStudents,
      urgentStudents,
      steadyStudents,
      focusStudents,
      averageTeacherProgress,
      bestQuizScore,
      bestStreak,
    };
  }, [teacherStudents]);
  const learningPathLessonCount = learningPath?.stages.reduce(
    (total, stage) => total + stage.lessons.length,
    0,
  ) ?? 0;
  const metricCards =
    currentRole === USER_ROLES.STUDENT
      ? [
          { icon: BookOpen, label: 'Bài học', value: lessons.length },
          { icon: CheckCircle2, label: 'Hoàn thành', value: completedCount },
          { icon: Activity, label: 'Đang học', value: activeCount },
          { icon: ChartNoAxesCombined, label: 'Cao nhất', value: bestScore },
        ]
      : currentRole === USER_ROLES.PARENT
        ? [
            { icon: Users, label: 'Học viên', value: linkedStudents.length },
            { icon: ShieldCheck, label: 'Cần hỗ trợ', value: parentReviewSummary.urgentCount },
            { icon: Bell, label: 'Chưa đọc', value: parentReviewSummary.unreadNotifications },
            { icon: TrendingUp, label: 'TB tiến độ', value: `${parentReviewSummary.averageStudentProgress}%` },
          ]
        : currentRole === USER_ROLES.TEACHER
          ? [
              { icon: Users, label: 'Học viên', value: teacherSupportSummary.totalStudents },
              { icon: ShieldCheck, label: 'Cần hỗ trợ', value: teacherSupportSummary.urgentStudents.length },
              { icon: TrendingUp, label: 'Tiến độ TB', value: `${teacherSupportSummary.averageTeacherProgress}%` },
              { icon: Award, label: 'Điểm quiz cao nhất', value: `${Math.round(teacherSupportSummary.bestQuizScore)}%` },
            ]
          : [
              { icon: Users, label: 'Người dùng', value: summary?.totalUsers ?? 0 },
              { icon: LibraryBig, label: 'Học viên', value: summary?.totalStudents ?? 0 },
              { icon: CheckCircle2, label: 'Phụ huynh', value: summary?.totalParents ?? 0 },
              { icon: ShieldCheck, label: 'Giáo viên', value: summary?.totalTeachers ?? 0 },
            ];

  const dashboardPulse =
    currentRole === USER_ROLES.STUDENT
      ? {
          label: 'Tiến độ cá nhân',
          value: `${averageProgress}%`,
          hint: completedCount
            ? `${completedCount}/${learningPathLessonCount} bài đã hoàn thành`
            : 'Chưa có bài hoàn thành',
        }
      : currentRole === USER_ROLES.PARENT
        ? {
            label: 'Học viên cần theo dõi',
            value: `${parentReviewSummary.urgentCount}`,
            hint: `${parentReviewSummary.unreadNotifications} thông báo chưa đọc`,
          }
        : currentRole === USER_ROLES.TEACHER
          ? {
              label: 'Học viên cần hỗ trợ',
              value: `${teacherSupportSummary.urgentStudents.length}`,
              hint: `${teacherSupportSummary.averageTeacherProgress}% tiến độ trung bình`,
            }
          : {
              label: 'Hệ thống đang xem',
              value: dataMode === 'demo' ? 'DEMO' : 'LIVE',
              hint: `${summary?.totalPublishedPaths ?? 0}/${summary?.totalPaths ?? 0} lộ trình đã công bố`,
            };

  const dashboardMood =
    currentRole === USER_ROLES.STUDENT
      ? {
          title: 'Bài nên bắt đầu',
          detail:
            learningPath?.stages[0]?.lessons[0]?.title ??
            'Học theo lộ trình đang mở để mở khóa bài tiếp theo.',
        }
      : currentRole === USER_ROLES.PARENT
        ? {
            title: 'Điểm cần hỗ trợ',
            detail:
              reviewSuggestions[0]?.lessonTitle ??
              'Danh sách gợi ý sẽ xuất hiện khi học viên có bài cần ôn tập.',
          }
        : currentRole === USER_ROLES.TEACHER
          ? {
              title: 'Lớp đang theo dõi',
              detail:
                teacherSupportSummary.focusStudents[0]?.fullName ??
                'Chưa có học viên trong nhóm ưu tiên.',
          }
          : {
              title: 'Nội dung đang giám sát',
              detail: learningPath?.name ?? 'Chưa có lộ trình công bố',
            };

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở bảng điều khiển...</p>
      </main>
    );
  }

  if (currentRole === USER_ROLES.STUDENT) {
    return (
      <StudentMenuDashboard session={session} />
    );
  }

  if (currentRole === USER_ROLES.PARENT) {
    return (
      <ParentDashboard
        session={session}
        loading={loading}
        error={error}
        dataMode={dataMode}
        commandItems={commandItems}
      />
    );
  }

  if (currentRole === USER_ROLES.TEACHER) {
    return (
      <TeacherDashboard
        session={session}
        learningPath={learningPath}
        teacherSupportSummary={teacherSupportSummary}
        summary={summary}
        loading={loading}
        error={error}
        dataMode={dataMode}
        commandItems={commandItems}
        roleProfile={roleProfile}
      />
    );
  }

  return (
    <AdminDashboard
      session={session}
      showSidebar={false}
      commandItems={commandItems}
      roleProfile={roleProfile}
    />
  );
  /*
  return (
    <AppShell
      session={session!}
      active="dashboard"
      eyebrow={learningPath?.name ?? 'A1 Foundation Path'}
      title="Tổng quan học tập"
    >
      <section className="heroPanel" id="tong-quan">
        <div>
          <p className="eyebrow">Xin chào, {session!.user.fullName}</p>
          <h2>
            Vai trò hiện tại <span className="inlineBadge">{roleProfile.label}</span>
          </h2>
          <p>
            Đây là cổng làm việc theo actor. UC chung được giữ chung, còn UC riêng chỉ hiển thị theo
            vai trò hiện tại để không biến hệ thống thành một actor duy nhất.
          </p>
          <p>{roleProfile.summary}</p>
          <div className="heroFocusRow" aria-label="Tóm tắt ngữ cảnh dashboard">
            <div className="heroFocusCard">
              <span>{dashboardPulse.label}</span>
              <strong>{dashboardPulse.value}</strong>
              <small>{dashboardPulse.hint}</small>
            </div>
            <div className="heroFocusCard">
              <span>{dashboardMood.title}</span>
              <strong>{dashboardMood.detail}</strong>
              <small>{dataMode === 'demo' ? 'Dữ liệu mẫu đang hiển thị' : 'Đang lấy dữ liệu thật từ API'}</small>
            </div>
            <div className="heroFocusCard">
              <span>Chế độ vai trò</span>
              <strong>{roleProfile.badge}</strong>
              <small>{commonUseCases.length} UC chung luôn sẵn sàng</small>
            </div>
          </div>
        </div>

        <div className="scoreDial" aria-label="Tiến độ tổng quan">
          <span>{currentRole === USER_ROLES.ADMIN ? `${summary?.totalPublishedPaths ?? 0}` : `${Math.min(100, Math.max(0, Math.round(averageProgress || parentReviewSummary.averageStudentProgress || teacherSupportSummary.averageTeacherProgress || 67)))}%`}</span>
          <small>{currentRole === USER_ROLES.ADMIN ? 'lộ trình công bố' : 'tổng quan'}</small>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {dataMode === 'demo' ? (
        <div className="subtleBox dashboardMessage">
          Đang hiển thị dữ liệu mẫu vì backend chưa phản hồi. Bạn vẫn có thể duyệt giao diện và kiểm tra
          luồng nghiệp vụ ngay trên web.
        </div>
      ) : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ dữ liệu...</div> : null}

      <section className="metricGrid" aria-label="Chỉ số tổng quan">
        {metricCards.map((metric) => (
          <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="panel rolePanel" aria-label="Chọn ngữ cảnh vai trò">
        <div className="sectionTitle">
          <div>
            <h2>Ngữ cảnh làm việc</h2>
            <span>Chọn vai trò để dashboard đổi số liệu và lời nhắc phù hợp</span>
          </div>
          <span className="inlineBadge">{roleProfile.badge}</span>
        </div>

        <div className="roleSwitcher" role="tablist" aria-label="Chọn vai trò">
          {availableRoles.map((role) => {
            const profile = roleProfiles[role];
            const active = role === currentRole;

            return (
              <button
                key={role}
                className={`roleTab ${active ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveRole(role)}
                aria-pressed={active}
              >
                <span>{profile.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="actorUseCaseGrid" aria-label="Use case theo actor">
        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>UC chung</h2>
              <span>Actor nào cũng dùng được</span>
            </div>
            <span className="inlineBadge">
              <LockKeyhole size={14} />
              Shared
            </span>
          </div>
          <div className="roleOverviewStack">
            {commonUseCases.map((item) => (
              <div className="roleOverviewItem" key={item}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>UC riêng</h2>
              <span>{roleProfile.label} mới thấy và thao tác nhóm nghiệp vụ này</span>
            </div>
            <span className="inlineBadge">{roleProfile.label}</span>
          </div>
          <div className="roleOverviewStack">
            {roleProfile.privateUseCases.map((item) => (
              <div className="roleOverviewItem" key={item}>
                <ShieldCheck size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {currentRole === USER_ROLES.TEACHER ? (
        <section className="parentReviewPanel panel" aria-label="Cảnh báo lớp học">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Theo dõi lớp học</p>
              <h2>Học viên cần hỗ trợ và lớp đang vận hành</h2>
              <span>
                Giáo viên nhìn nhanh ai đang chậm tiến độ, ai ổn định, và bấm vào đúng học viên để mở báo
                cáo chi tiết.
              </span>
            </div>
            <span className="inlineBadge">
              <Users size={14} />
              {teacherSupportSummary.totalStudents} học viên
            </span>
          </div>

          <div className="parentReviewSummary">
            <div>
              <strong>{teacherSupportSummary.urgentStudents.length}</strong>
              <span>cần hỗ trợ</span>
            </div>
            <div>
              <strong>{teacherSupportSummary.steadyStudents.length}</strong>
              <span>ổn định</span>
            </div>
            <div>
              <strong>{teacherSupportSummary.averageTeacherProgress}%</strong>
              <span>tiến độ trung bình</span>
            </div>
            <div>
              <strong>{Math.round(teacherSupportSummary.bestQuizScore)}%</strong>
              <span>quiz cao nhất</span>
            </div>
          </div>

          <div className="parentReviewList">
            {teacherSupportSummary.focusStudents.slice(0, 4).map((student) => {
              const band = getTeacherSupportBand(student);
              const label = getTeacherSupportLabel(student);
              const isUrgent = band === 'needs-support';

              return (
                <article className={`parentReviewCard priority-${isUrgent ? 1 : 2}`} key={student.id}>
                  <div className="parentReviewCardHead">
                    <div>
                      <p className="eyebrow">{student.currentLevel ?? 'Chưa rõ cấp độ'}</p>
                      <strong>{student.fullName}</strong>
                      <span>
                        {student.learningGoal ?? 'Chưa cập nhật mục tiêu'} • {student.completedLessons} bài hoàn
                        thành
                      </span>
                    </div>
                    <span className={`parentReviewStatus ${isUrgent ? 'ChuaXem' : 'DaXem'}`}>{label}</span>
                  </div>

                  <div className="parentReviewMeta">
                    <span>
                      <TrendingUp size={14} />
                      {Math.round(Number(student.averageProgress ?? 0))}% tiến độ
                    </span>
                    <span>
                      <BookOpen size={14} />
                      {student.activeLessons} bài đang học
                    </span>
                    <span>
                      <ShieldCheck size={14} />
                      {student.lockedLessons} bài khóa
                    </span>
                    <span>
                      <Award size={14} />
                      {Math.round(Number(student.bestQuizScore ?? 0))}% quiz cao nhất
                    </span>
                    <span>
                      <Flame size={14} />
                      {student.learningStreak} ngày liên tiếp
                    </span>
                  </div>

                  <div className="parentReviewActions">
                    <div className="progressRail">
                      <div
                        className="progressFill"
                        style={{ width: `${Math.min(100, Math.max(0, Number(student.averageProgress ?? 0)))}%` }}
                      />
                    </div>
                    <Link className="secondaryButton" href={`/progress?studentId=${student.id}`}>
                      Xem tiến trình
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}

            {!teacherSupportSummary.focusStudents.length && !loading ? (
              <div className="subtleBox">
                Chưa có học viên nào trong lớp. Khi có dữ liệu học viên, giáo viên sẽ thấy danh sách ưu tiên
                tại đây.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {currentRole === USER_ROLES.ADMIN ? (
        <section className="panel adminOverviewPanel" aria-label="Thống kê nội dung công bố">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">UC riêng của quản trị viên</p>
              <h2>Thống kê nội dung và trạng thái công bố</h2>
              <span>Gói số liệu này giúp quản trị biết hệ thống đang có bao nhiêu nội dung sẵn sàng vận hành.</span>
            </div>
            <span className="inlineBadge">
              <Settings size={14} />
              System overview
            </span>
          </div>

          <section className="metricGrid adminMetricGrid">
            <Metric icon={Compass} label="Lộ trình" value={summary?.totalPaths ?? 0} />
            <Metric icon={Sparkles} label="Lộ trình công bố" value={summary?.totalPublishedPaths ?? 0} />
            <Metric icon={BookOpen} label="Bài học" value={summary?.totalLessons ?? 0} />
            <Metric icon={PlayCircle} label="Bài học công bố" value={summary?.totalPublishedLessons ?? 0} />
            <Metric icon={CheckCircle2} label="Quiz" value={summary?.totalQuizzes ?? 0} />
            <Metric icon={Award} label="Quiz công bố" value={summary?.totalPublishedQuizzes ?? 0} />
          </section>

          <div className="adminOverviewNotes">
            <div>
              <strong>Nguyên tắc vận hành</strong>
              <span>Admin chỉ thấy thống kê tổng quan, không đi vào luồng học viên.</span>
            </div>
            <div>
              <strong>Trạng thái dữ liệu</strong>
              <span>Hiển thị rõ nội dung nháp và nội dung đã công bố để kiểm soát release.</span>
            </div>
          </div>
        </section>
      ) : null}

      {currentRole === USER_ROLES.PARENT ? (
        <section className="parentReviewPanel panel" aria-label="Cảnh báo và gợi ý ôn tập">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Cảnh báo và gợi ý ôn tập</p>
              <h2>Việc phụ huynh nên hỗ trợ hôm nay</h2>
              <span>
                Hệ thống tổng hợp từ tiến trình, điểm quiz và bảng gợi ý ôn tập để phụ huynh biết cần
                hỗ trợ học viên ở bài nào.
              </span>
            </div>
            <span className="inlineBadge">
              <Sparkles size={14} />
              {reviewSuggestions.length} gợi ý
            </span>
          </div>

          <div className="parentReviewSummary">
            <div>
              <strong>{parentReviewSummary.urgentCount}</strong>
              <span>ưu tiên cao</span>
            </div>
            <div>
              <strong>{parentReviewSummary.newCount}</strong>
              <span>chưa xem</span>
            </div>
            <div>
              <strong>{parentReviewSummary.doneCount}</strong>
              <span>đã hoàn tất</span>
            </div>
            <div>
              <strong>{parentReviewSummary.averageStudentProgress}%</strong>
              <span>tiến độ trung bình</span>
            </div>
          </div>

          <div className="parentReviewList">
            {reviewSuggestions.map((suggestion) => (
              <article className={`parentReviewCard priority-${suggestion.priority}`} key={suggestion.id}>
                <div className="parentReviewCardHead">
                  <div>
                    <p className="eyebrow">{suggestion.studentName}</p>
                    <strong>{suggestion.lessonTitle ?? suggestion.topicName ?? 'Nội dung cần ôn tập'}</strong>
                    <span>{suggestion.reason}</span>
                  </div>
                  <span className={`parentReviewStatus ${suggestion.status}`}>
                    {formatReviewStatus(suggestion.status)}
                  </span>
                </div>

                <div className="parentReviewMeta">
                  <span>
                    <BookOpen size={14} />
                    {suggestion.pathName ?? 'Lộ trình hiện tại'}
                  </span>
                  <span>
                    <ClipboardCheck size={14} />
                    {suggestion.stageName ?? suggestion.topicName ?? 'Chặng học'}
                  </span>
                  <span>
                    <TrendingUp size={14} />
                    {Math.round(Number(suggestion.lessonProgress ?? 0))}% bài học
                  </span>
                  <span>
                    <Award size={14} />
                    {Math.round(Number(suggestion.bestScore ?? 0))}% cao nhất
                  </span>
                  {suggestion.latestQuizTitle ? (
                    <span>
                      <CheckCircle2 size={14} />
                      Quiz gần nhất {Math.round(Number(suggestion.latestQuizPercentage ?? 0))}%
                    </span>
                  ) : null}
                </div>

                <div className="parentReviewActions">
                  <div className="progressRail">
                    <div
                      className="progressFill"
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(suggestion.lessonProgress ?? 0)))}%`,
                      }}
                    />
                  </div>
                  {suggestion.lessonId ? (
                    <Link className="secondaryButton" href={`/lessons/${suggestion.lessonId}`}>
                      Xem bài cần ôn
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link className="secondaryButton" href="/progress">
                      Xem tiến trình
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </article>
            ))}

            {!reviewSuggestions.length && !loading ? (
              <div className="subtleBox">
                Chưa có cảnh báo ôn tập. Khi học viên chưa đạt quiz hoặc có bài cần hỗ trợ, hệ thống sẽ
                hiển thị gợi ý tại đây.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {currentRole === USER_ROLES.PARENT ? (
        <section className="parentNotificationPanel panel" aria-label="Thông báo học tập">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Thông báo học tập</p>
              <h2>Thông báo mới và lịch sử học tập</h2>
              <span>
                Tổng hợp thông báo hệ thống và thông báo gắn với học viên đã liên kết để phụ huynh
                kiểm tra nhanh tình trạng học tập.
              </span>
            </div>
            <span className="inlineBadge">
              <Bell size={14} />
              {parentReviewSummary.unreadNotifications} chưa đọc
            </span>
          </div>

          <div className="parentNotificationList">
            {parentNotifications.map((notification) => (
              <article className={`parentNotificationCard ${notification.isRead ? 'read' : 'unread'}`} key={notification.id}>
                <div className="parentNotificationHead">
                  <div>
                    <p className="eyebrow">
                      {notification.recipientKind === 'PhuHuynh' ? 'Gửi cho phụ huynh' : notification.recipientName}
                    </p>
                    <strong>{notification.title}</strong>
                    <span>{notification.content}</span>
                  </div>
                  <span className={`parentNotificationType ${notification.type}`}>{notification.type}</span>
                </div>

                <div className="parentNotificationMeta">
                  <span>
                    <Users size={14} />
                    {notification.recipientKind === 'PhuHuynh' ? 'Tài khoản phụ huynh' : notification.recipientName}
                  </span>
                  <span>{formatReviewDate(notification.sentAt)}</span>
                  <span>{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
                </div>
              </article>
            ))}

            {!parentNotifications.length && !loading ? (
              <div className="subtleBox">
                Chưa có thông báo nào. Khi học viên hoàn thành bài, có cảnh báo hoặc hệ thống gửi tin,
                phụ huynh sẽ thấy ở đây.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="panel commandCenter" aria-label="Đi tới chức năng">
        <div className="sectionTitle">
          <div>
            <h2>Đi tới chức năng</h2>
            <span>Danh sách này đổi theo actor đang chọn, không còn dùng chung một bộ UC</span>
          </div>
        </div>

        <div className="commandGrid">
          {commandItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="commandCard" href={item.href} key={`${currentRole}:${item.href}:${item.label}`}>
                <Icon size={20} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.text}</span>
                </div>
                <ArrowRight size={16} />
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
  */
}

function ContentHubSpotlight({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="content-hub-dashboard"
      className={`contentHubSpotlight ${compact ? 'compact' : ''}`}
      aria-label="AI Content Hub đa nguồn"
    >
      <div className="contentHubPixelStage" aria-hidden="true">
        <span className="contentHubPixelSun" />
        <span className="contentHubPixelCloud contentHubPixelCloudOne" />
        <span className="contentHubPixelCloud contentHubPixelCloudTwo" />
        <span className="contentHubPixelTree contentHubPixelTreeOne" />
        <span className="contentHubPixelTree contentHubPixelTreeTwo" />
        <span className="contentHubPixelPet contentHubPixelPetPenguin" />
        <span className="contentHubPixelPet contentHubPixelPetRabbit" />
        <span className="contentHubPixelPet contentHubPixelPetTurtle" />
        <span className="contentHubPixelGround" />
      </div>

      <div className="contentHubSpotlightCopy">
        <p className="eyebrow">AI Content Hub đã tích hợp</p>
        <h2>Nguồn học liệu sống cho từ vựng, ngữ pháp, hình ảnh, audio, video và câu ví dụ.</h2>
        <p>
          Hệ thống đã nối nhiều API ngoài để làm giàu nội dung học: tra nghĩa, phát âm, ví dụ thật, kiểm tra ngữ pháp,
          tìm ảnh minh họa, audio và video theo từ khóa.
        </p>

        <div className="contentHubSpotlightActions">
          <Link className="primaryButton" href="#content-hub-dashboard">
            Xem Content Hub
            <ArrowRight size={16} />
          </Link>
          <Link className="secondaryButton" href="/playground">
            Vào sân chơi
            <Gamepad2 size={16} />
          </Link>
        </div>
      </div>

      <div className="contentHubSourceCloud" aria-label="Nguồn dữ liệu đang tích hợp">
        {contentHubSources.map((source) => (
          <span key={source}>{source}</span>
        ))}
      </div>

      <div className="contentHubSpotlightStats" aria-label="Nhóm dữ liệu học tập">
        <div>
          <strong>10+</strong>
          <span>Nguồn API</span>
        </div>
        <div>
          <strong>6</strong>
          <span>Loại học liệu</span>
        </div>
        <div>
          <strong>Live</strong>
          <span>Dữ liệu ngoài</span>
        </div>
      </div>
    </section>
  );
}

function StudentMenuDashboard({
  session,
}: {
  session: WebAuthSession;
}) {
  const studentUseCaseItems = [
    {
      href: '/lessons',
      icon: BookOpen,
      label: 'Học từ vựng theo chủ đề',
      text: 'Chọn chủ đề, học từ bằng ảnh, audio, phiên âm, ví dụ ngữ cảnh, luyện nhanh, chơi game và test trong cùng một luồng.',
    },
    {
      href: '/grammar',
      icon: ClipboardCheck,
      label: 'Học ngữ pháp TOEIC',
      text: 'Học theo topic như thì, bị động, đại từ quan hệ, giới từ, mệnh đề; cuối topic có game luyện Part 5/6.',
    },
    {
      href: '/toeic-guide',
      icon: Compass,
      label: 'Giới thiệu bài thi TOEIC',
      text: 'Nắm cấu trúc 2 bài thi, từng Part/Task, cách phân bổ thời gian, mẹo làm bài và lỗi cần tránh.',
    },
    {
      href: '/toeic-practice',
      icon: PlayCircle,
      label: 'Ôn luyện bài thi mẫu TOEIC',
      text: 'Chọn đề mô phỏng TOEIC, làm từng Part hoặc Full test với đồng hồ, đáp án và giải thích.',
    },
    {
      href: '/ets-practice',
      icon: FileText,
      label: 'Thi thử TOEIC',
      text: 'Làm full test ETS như phòng thi thật: audio, PDF đề, answer sheet 1-200, timer và chấm bằng key.',
    },
    {
      href: '/progress',
      icon: ChartNoAxesCombined,
      label: 'Theo dõi tiến trình học tập',
      text: 'Thống kê chủ đề đã học, từ đã nhớ/chưa nhớ, điểm game/test, XP, pet, nhiệm vụ ngày và gợi ý học tiếp.',
    },
  ];

  return (
    <AppShell
      session={session}
      active="dashboard"
      roleContext={USER_ROLES.STUDENT}
      showSidebar={false}
      eyebrow="Không gian học viên"
      title="Trung tâm học tập"
    >
      <section className="panel adminMenuPanel studentMenuPanel" aria-label="Chọn chức năng học viên">
        <div className="adminMenuHero studentMenuHero">
          <div className="adminMenuHeroCopy">
            <p className="eyebrow">Xin chào, {session.user.fullName}</p>
            <h2>Chọn luồng học TOEIC</h2>
          </div>

        </div>

        <div className="sectionTitle adminMenuHeading">
          <div>
            <h2>Chọn chức năng học tập</h2>
          </div>
        </div>

        <div className="adminMenuGrid studentMenuGrid">
          {studentUseCaseItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                className="adminMenuCard studentMenuCard"
                href={item.href}
                key={`student:${item.href}:${item.label}`}
              >
                <span className="adminMenuCardIndex">{String(index + 1).padStart(2, '0')}</span>
                <span className="adminMenuCardIcon">
                  <Icon size={20} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.text}</small>
              </Link>
            );
          })}
        </div>

      </section>
    </AppShell>
  );
}

function StudentDashboard({
  session,
  learningPath,
  lessons,
  progress,
  gameDashboard,
  loading,
  error,
  dataMode,
  averageProgress,
  completedCount,
  activeCount,
  lockedCount,
  bestScore,
}: {
  session: WebAuthSession;
  learningPath: LearningPathDetail | null;
  lessons: Array<LearningPathDetail['stages'][number]['lessons'][number] & { stageName: string; stageOrder: number }>;
  progress: StudentProgressRow[];
  gameDashboard: GameDashboard | null;
  loading: boolean;
  error: string;
  dataMode: 'live' | 'demo';
  averageProgress: number;
  completedCount: number;
  activeCount: number;
  lockedCount: number;
  bestScore: number;
}) {
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
    () =>
      lessons.map((lesson) => {
        const progressRow = progressByLesson.get(lesson.id);
        const isFirstLesson = lesson.stageOrder === 1 && lesson.orderIndex === 1;
        const status = progressRow?.status ?? (isFirstLesson ? 'ChuaHoc' : 'BiKhoa');
        const percentComplete = progressRow?.percentComplete ?? 0;
        const bestScore = progressRow?.bestScore ?? 0;
        const canOpen = status !== 'BiKhoa';

        return {
          ...lesson,
          status,
          percentComplete,
          bestScore,
          canOpen,
        };
      }),
    [lessons, progressByLesson],
  );

  const completedLessons = lessonStates.filter((lesson) => lesson.status === 'HoanThanh').length;
  const unlockedLessons = lessonStates.filter((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh').length;
  const lockedLessons = lessonStates.filter((lesson) => lesson.status === 'BiKhoa').length;
  const activeLessonState =
    lessonStates.find((lesson) => lesson.status === 'DangHoc') ??
    lessonStates.find((lesson) => lesson.status === 'ChuaHoc') ??
    lessonStates.find((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh') ??
    lessonStates[0] ??
    null;
  const nextLockedLesson = lessonStates.find((lesson) => lesson.status === 'BiKhoa') ?? null;
  const currentLesson = activeLessonState;
  const currentLessonProgress = currentLesson ? progressByLesson.get(currentLesson.id) : null;
  const currentLessonLocked = currentLesson?.status === 'BiKhoa';
  const completionRate = lessonStates.length ? Math.round((completedLessons / lessonStates.length) * 100) : 0;
  const currentLessonPercent = currentLesson?.percentComplete ?? currentLessonProgress?.percentComplete ?? 0;
  const currentLessonBestScore = currentLesson?.bestScore ?? currentLessonProgress?.bestScore ?? 0;
  const nextQuizHint = currentLesson
    ? `Hoàn thành bài "${currentLesson.title}" rồi làm quiz đạt ${currentLesson.passingScore}%`
    : 'Chưa có quiz được mở.';
  const pet = gameDashboard?.pet ?? null;
  const petLevelProgress = pet ? Math.min(100, Math.round((pet.xp / Math.max(pet.nextLevelXp, 1)) * 100)) : 0;
  const quests = gameDashboard?.quests.slice(0, 4) ?? [];
  const badges = gameDashboard?.badges.slice(0, 3) ?? [];
  const completedQuestCount = quests.filter((quest) => quest.status === 'HoanThanh' || quest.progress >= quest.target).length;
  const todayPlan = [
    {
      title: currentLesson ? `Học tiếp: ${currentLesson.title}` : 'Chọn bài học đầu tiên',
      description: currentLesson
        ? `Mục tiêu hiện tại là đạt tối thiểu ${currentLesson.passingScore}% để mở bài sau.`
        : 'Chưa có bài học đang mở trong lộ trình.',
      href: currentLesson && !currentLessonLocked ? `/lessons/${currentLesson.id}` : '/learning-paths',
      status: currentLessonLocked ? 'BiKhoa' : 'DangHoc',
    },
    {
      title: 'Làm quiz khi đã học xong',
      description:
        currentLessonBestScore > 0
          ? `Điểm cao nhất hiện tại ${currentLessonBestScore}%.`
          : 'Quiz sẽ ghi điểm, cập nhật tiến trình và thưởng XP cho pet.',
      href: '/quizzes',
      status: currentLessonBestScore >= Number(currentLesson?.passingScore ?? 80) ? 'HoanThanh' : 'ChuaHoc',
    },
    {
      title: 'Hoàn thành nhiệm vụ ngày',
      description: `${completedQuestCount}/${quests.length || 0} nhiệm vụ đã xong để tích XP và vàng.`,
      href: '/playground',
      status: completedQuestCount > 0 ? 'DangHoc' : 'ChuaHoc',
    },
  ];
  const dashboardHealth = [
    {
      label: 'Dữ liệu lộ trình',
      value: learningPath ? learningPath.name : 'Chưa có lộ trình',
      status: learningPath ? 'Tot' : 'CanXuLy',
    },
    {
      label: 'Bài đang mở',
      value: currentLesson && !currentLessonLocked ? currentLesson.title : 'Chưa có bài mở',
      status: currentLesson && !currentLessonLocked ? 'Tot' : 'CanXuLy',
    },
    {
      label: 'Tiến trình học',
      value: `${completionRate}% bài đã hoàn thành`,
      status: completionRate > 0 ? 'Tot' : 'KhoiDong',
    },
    {
      label: 'Pet & nhiệm vụ',
      value: pet ? `${pet.name} Lv.${pet.level} • ${completedQuestCount}/${quests.length || 0} nhiệm vụ` : 'Đang tạo pet',
      status: pet ? 'Tot' : 'KhoiDong',
    },
  ];
  const heroSnapshot = [
    {
      label: 'Lộ trình',
      value: learningPath?.name ?? 'Chưa có lộ trình',
    },
    {
      label: 'Bài kế tiếp',
      value: currentLessonLocked ? 'Bài đang khóa' : currentLesson?.title ?? 'Chưa có bài mở',
    },
    {
      label: 'Pet',
      value: pet ? `${pet.name} • Lv.${pet.level}` : 'Đang tạo Pingu',
    },
  ];

  return (
    <AppShell
      session={session}
      active="dashboard"
      roleContext={USER_ROLES.STUDENT}
      eyebrow={learningPath?.name ?? 'Không gian học viên'}
      title="Dashboard học viên"
    >
      <section className="studentHero">
        <div className="studentHeroCopy">
          <p className="eyebrow">Xin chào, {session.user.fullName}</p>
          <h2>
            {currentLesson && !currentLessonLocked
              ? `Hôm nay học tiếp "${currentLesson.title}" và giữ nhịp mở khóa.`
              : 'Dashboard đã sẵn sàng, hãy bắt đầu từ bài đầu tiên được mở.'}
          </h2>
          <p>
            Đây là bảng điều khiển riêng cho Học viên: gom bài đang học, trạng thái lộ trình, quiz
            tiếp theo, nhiệm vụ ngày và pet để người học biết chính xác bước cần làm.
          </p>
          <div className="studentHeroMeta" aria-label="Tóm tắt dashboard học viên">
            <span>
              <Compass size={14} />
              {learningPath?.level ?? 'A1'} • {lessonStates.length} bài
            </span>
            <span>
              <TrendingUp size={14} />
              {completionRate}% hoàn thành path
            </span>
            <span>
              <Star size={14} />
              Điểm cao nhất {bestScore}%
            </span>
          </div>
          <div className="studentHeroActions">
            {currentLesson && !currentLessonLocked ? (
              <Link className="primaryButton" href={`/lessons/${currentLesson.id}`}>
                Học tiếp
                <ArrowRight size={16} />
              </Link>
            ) : currentLesson ? (
              <span className="primaryButton disabledAction" aria-disabled="true">
                Bài đang khóa
                <LockKeyhole size={16} />
              </span>
            ) : null}
            <Link className="secondaryButton" href="/playground">
              Vào sân chơi
              <Gamepad2 size={16} />
            </Link>
          </div>
        </div>

        <div className="studentHeroAside">
          <div className="studentProgressOrb" aria-label="Tiến trình học viên">
            <span>{averageProgress}%</span>
            <small>tiến trình</small>
          </div>

          <div className="studentHeroSnapshot" aria-label="Tóm tắt nhanh">
            {heroSnapshot.map((item) => (
              <div className="studentHeroSnapshotItem" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {dataMode === 'demo' ? (
        <div className="subtleBox dashboardMessage">
          Đang hiển thị dữ liệu mẫu vì backend chưa phản hồi. Bạn vẫn có thể duyệt giao diện và kiểm tra
          luồng nghiệp vụ ngay trên web.
        </div>
      ) : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ dữ liệu học viên...</div> : null}

      <section className="metricGrid" aria-label="Chỉ số học viên">
        <Metric icon={BookOpen} label="Bài trong path" value={lessonStates.length} />
        <Metric icon={CheckCircle2} label="Đã hoàn thành" value={completedLessons || completedCount} />
        <Metric icon={Activity} label="Đang mở" value={unlockedLessons || activeCount} />
        <Metric icon={Award} label="Điểm cao nhất" value={bestScore} />
      </section>

      <ContentHubSpotlight />

      <section className="studentDashboardGrid">
        <div className="panel studentPlanPanel">
          <div className="sectionTitle">
            <div>
              <h2>Kế hoạch hôm nay</h2>
              <span>Dashboard đề xuất đúng việc cần làm theo tiến trình hiện tại</span>
            </div>
            <span className="inlineBadge">
              <ClipboardCheck size={14} />
              {todayPlan.length} bước
            </span>
          </div>

          <div className="studentPlanList">
            {todayPlan.map((item, index) => (
              <Link className={`studentPlanItem ${item.status}`} href={item.href} key={item.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>

        <div className="panel studentHealthPanel">
          <div className="sectionTitle">
            <div>
              <h2>Tình trạng học tập</h2>
              <span>Kiểm tra nhanh dashboard có đủ dữ liệu vận hành không</span>
            </div>
            <span className="inlineBadge">
              <ShieldCheck size={14} />
              Live
            </span>
          </div>

          <div className="studentHealthList">
            {dashboardHealth.map((item) => (
              <div className={`studentHealthItem ${item.status}`} key={item.label}>
                <CheckCircle2 size={16} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.value}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="studentDashboardGrid">
        <div className="panel studentFocusPanel">
          <div className="sectionTitle">
            <div>
              <h2>Học tiếp</h2>
              <span>Bài đang mở theo tiến trình cá nhân</span>
            </div>
            <span className="inlineBadge">
              <PlayCircle size={14} />
              {currentLessonProgress?.status === 'DangHoc' ? 'Đang học' : 'Sẵn sàng'}
            </span>
          </div>

          {currentLesson ? (
            <div className="continueLessonCard">
              <div>
                <p className="eyebrow">
                  Chặng {currentLesson.stageOrder}: {currentLesson.stageName}
                </p>
                <h3>{currentLesson.title}</h3>
                <p>{currentLesson.description}</p>
              </div>
              <div className="progressRail">
                <div className="progressFill" style={{ width: `${currentLessonPercent}%` }} />
              </div>
              <div className="progressMeta">
                <span>{currentLessonPercent}% hoàn thành</span>
                <span>Đạt yêu cầu {currentLesson.passingScore}%</span>
              </div>
              <div className="studentHeroActions">
                {!currentLessonLocked ? (
                  <Link className="primaryButton" href={`/lessons/${currentLesson.id}`}>
                    Mở bài học
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <span className="primaryButton disabledAction" aria-disabled="true">
                    Bị khóa
                    <LockKeyhole size={16} />
                  </span>
                )}
                <Link className="secondaryButton" href="/quizzes">
                  Vào quiz
                  <CheckCircle2 size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="subtleBox">Chưa có bài học nào được mở cho học viên.</div>
          )}
        </div>

        <div className="panel studentPetPanel">
          <div className="sectionTitle">
            <div>
              <h2>Pet Pingu</h2>
              <span>Bạn đồng hành học tập của học viên</span>
            </div>
            <span className="inlineBadge">
              <Heart size={14} />
              Lv. {pet?.level ?? 1}
            </span>
          </div>

          <div className="petMiniCard">
            <div className="petMiniFace">P</div>
            <div>
              <strong>{pet?.name ?? 'Pingu'}</strong>
              <span>{pet?.mood ?? 'Vui vẻ'} • {pet?.coins ?? 0} vàng</span>
            </div>
          </div>
          <div className="progressRail">
            <div className="progressFill" style={{ width: `${petLevelProgress}%` }} />
          </div>
          <div className="progressMeta">
            <span>{petLevelProgress}% tới cấp tiếp theo</span>
            <span>Gắn bó {pet?.bond ?? 0}</span>
          </div>
          <Link className="secondaryButton fullWidth" href="/playground">
            Chơi với Pingu
            <Gamepad2 size={16} />
          </Link>
        </div>
      </section>

      <section className="studentDashboardGrid">
        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>Lộ trình của tôi</h2>
              <span>Trạng thái từng bài trong path hiện tại</span>
            </div>
            <span className="inlineBadge">{lockedLessons || lockedCount} bài khóa</span>
          </div>

          <div className="studentLessonRoadmap">
            {lessonStates.slice(0, 6).map((lesson) => {
              const status = lesson.status;
              const canOpen = lesson.canOpen;
              if (canOpen) {
                return (
                  <Link className={`studentRoadmapItem ${status}`} href={`/lessons/${lesson.id}`} key={lesson.id}>
                    <span>{lesson.orderIndex}</span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <small>
                        {lesson.percentComplete}% • {formatProgressStatus(status)}
                      </small>
                    </div>
                  </Link>
                );
              }

              return (
                <div className={`studentRoadmapItem ${status}`} key={lesson.id}>
                  <span>{lesson.orderIndex}</span>
                  <div>
                    <strong>{lesson.title}</strong>
                    <small>
                      {lesson.percentComplete}% • {formatProgressStatus(status)}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>Nhiệm vụ ngày</h2>
              <span>Làm nhiệm vụ để nhận XP, vàng và huy hiệu</span>
            </div>
            <span className="inlineBadge">
              <Flame size={14} />
              Daily
            </span>
          </div>

          <div className="studentQuestList">
            {quests.map((quest) => (
              <div className="studentQuestItem" key={quest.id}>
                <div>
                  <strong>{quest.title}</strong>
                  <span>{quest.description}</span>
                </div>
                <em>
                  {quest.progress}/{quest.target} • +{quest.rewardXp} XP
                </em>
              </div>
            ))}
            {!quests.length ? <div className="subtleBox">Chưa có nhiệm vụ ngày.</div> : null}
          </div>
        </div>
      </section>

      <section className="studentDashboardGrid">
        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>Quiz tiếp theo</h2>
              <span>{nextQuizHint}</span>
            </div>
            <Link className="secondaryButton" href="/quizzes">
              Xem quiz
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="studentActionStrip">
            <Link href="/lessons">
              <BookOpen size={16} />
              Học từ vựng
            </Link>
            <Link href="/quizzes">
              <CheckCircle2 size={16} />
              Làm kiểm tra
            </Link>
            <Link href="/progress">
              <ChartNoAxesCombined size={16} />
              Xem tiến trình
            </Link>
          </div>
          {nextLockedLesson ? (
            <div className="studentUnlockHint">
              <LockKeyhole size={16} />
              <span>
                Bài kế tiếp đang khóa: <strong>{nextLockedLesson.title}</strong>. Đạt quiz bài hiện tại để mở.
              </span>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>AI học từ ảnh</h2>
              <span>Upload hình để nhận từ vựng, phát âm và ví dụ</span>
            </div>
            <span className="inlineBadge">
              <ScanSearch size={14} />
              Vision
            </span>
          </div>
          <div className="studentActionStrip">
            <Link href="/playground">
              <ScanSearch size={16} />
              Nhận diện ảnh
            </Link>
            <Link href="/playground">
              <Sparkles size={16} />
              Nhận XP
            </Link>
            <Link href="/playground">
              <Award size={16} />
              Huy hiệu
            </Link>
          </div>
          {badges.length ? (
            <div className="studentBadgeRow">
              {badges.map((badge) => (
                <span key={badge.id}>{badge.name}</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function ParentDashboard({
  session,
  loading,
  error,
  dataMode,
  commandItems,
}: {
  session: WebAuthSession;
  loading: boolean;
  error: string;
  dataMode: 'live' | 'demo';
  commandItems: Array<{
    href: string;
    icon: ComponentType<{ size?: number }>;
    label: string;
    text: string;
  }>;
}) {
  return (
    <AppShell
      session={session}
      active="dashboard"
      roleContext={USER_ROLES.PARENT}
      showSidebar={false}
      eyebrow="Parent hub"
      title="Trung tâm phụ huynh"
    >
      <section className="panel adminMenuPanel parentMenuPanel" aria-label="Chọn chức năng phụ huynh">
        <div className="adminMenuHero parentMenuHero">
          <div className="adminMenuHeroCopy">
            <p className="eyebrow">Xin chào, {session.user.fullName}</p>
            <h2>Chọn chức năng phụ huynh</h2>
          </div>

          <div className="parentMenuScene" aria-hidden="true">
            <span className="parentSceneSun" />
            <span className="parentSceneCloud parentSceneCloudOne" />
            <span className="parentSceneCloud parentSceneCloudTwo" />
            <span className="parentSceneHouse" />
            <span className="parentSceneTree parentSceneTreeOne" />
            <span className="parentSceneTree parentSceneTreeTwo" />
            <span className="parentScenePath" />
            <span className="parentSceneMascot parentSceneMascotLarge" />
            <span className="parentSceneMascot parentSceneMascotSmall" />
            <span className="parentSceneHeart parentSceneHeartOne" />
            <span className="parentSceneHeart parentSceneHeartTwo" />
            <span className="parentSceneLeaf parentSceneLeafOne" />
            <span className="parentSceneLeaf parentSceneLeafTwo" />
          </div>
        </div>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {dataMode === 'demo' ? (
          <div className="subtleBox dashboardMessage">Đang hiển thị dữ liệu mẫu vì backend chưa phản hồi.</div>
        ) : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ dữ liệu phụ huynh...</div> : null}

        <div className="adminMenuGrid parentMenuGrid">
          {commandItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                className="adminMenuCard parentMenuCard"
                href={item.href}
                key={`parent:${item.href}:${item.label}`}
              >
                <span className="adminMenuCardIndex">{String(index + 1).padStart(2, '0')}</span>
                <span className="adminMenuCardIcon">
                  <Icon size={20} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.text}</small>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function TeacherDashboard({
  session,
  learningPath,
  teacherSupportSummary,
  summary,
  loading,
  error,
  dataMode,
  commandItems,
  roleProfile,
}: {
  session: WebAuthSession;
  learningPath: LearningPathDetail | null;
  teacherSupportSummary: {
    totalStudents: number;
    urgentStudents: LinkedStudent[];
    steadyStudents: LinkedStudent[];
    focusStudents: LinkedStudent[];
    averageTeacherProgress: number;
    bestQuizScore: number;
    bestStreak: number;
  };
  summary: Summary | null;
  loading: boolean;
  error: string;
  dataMode: 'live' | 'demo';
  commandItems: Array<{
    href: string;
    icon: ComponentType<{ size?: number }>;
    label: string;
    text: string;
  }>;
  roleProfile: RoleProfile;
}) {
  const pathCount = summary?.totalPublishedPaths ?? 0;
  const lessonCount = summary?.totalPublishedLessons ?? 0;
  const quizCount = summary?.totalPublishedQuizzes ?? 0;
  const toeicTopicCount = topicLibrary.length;
  const toeicWordCount = topicLibrary.reduce((sum, topic) => sum + topic.vocabulary.length, 0);
  const teacherStats = [
    {
      label: 'Chủ đề TOEIC',
      value: toeicTopicCount,
      note: `${toeicWordCount} từ vựng`,
    },
    {
      label: 'Học viên',
      value: teacherSupportSummary.totalStudents,
      note: 'Đang theo dõi',
    },
    {
      label: 'Tiến độ TB',
      value: `${teacherSupportSummary.averageTeacherProgress}%`,
      note: 'Toàn lớp',
    },
    {
      label: 'Nội dung',
      value: pathCount + lessonCount + quizCount,
      note: 'Đang công bố',
    },
  ];

  return (
    <AppShell
      session={session}
      active="dashboard"
      roleContext={USER_ROLES.TEACHER}
      showSidebar={false}
      eyebrow="Teacher hub"
      title="Trung tâm giáo viên"
    >
      <section className="panel adminMenuPanel teacherMenuPanel" aria-label="Chọn chức năng giáo viên">
        <div className="adminMenuHero teacherMenuHero">
          <div className="adminMenuHeroCopy">
            <p className="eyebrow">Xin chào, {session.user.fullName}</p>
            <h2>Điều phối học TOEIC từ từng trang riêng</h2>
            <p>
              Dashboard giáo viên chỉ giữ các UC chính của hệ thống TOEIC: chủ đề từ vựng, ngữ pháp,
              đề luyện, học viên, kết quả và cảnh báo học tập.
            </p>
            <div className="adminMenuChips" aria-hidden="true">
              <span>
                <BookOpen size={14} />
                {toeicTopicCount} chủ đề TOEIC
              </span>
              <span>
                <ShieldCheck size={14} />
                {roleProfile.badge}
              </span>
              <span>
                <Users size={14} />
                {teacherSupportSummary.totalStudents} học viên
              </span>
            </div>
          </div>

          <div className="teacherMenuScene" aria-hidden="true">
            <span className="teacherSceneBoard" />
            <span className="teacherSceneGraph teacherSceneGraphOne" />
            <span className="teacherSceneGraph teacherSceneGraphTwo" />
            <span className="teacherSceneGraph teacherSceneGraphThree" />
            <span className="teacherSceneDesk" />
            <span className="teacherSceneBook teacherSceneBookOne" />
            <span className="teacherSceneBook teacherSceneBookTwo" />
            <span className="teacherSceneMascot" />
            <span className="teacherSceneSpark teacherSceneSparkOne" />
            <span className="teacherSceneSpark teacherSceneSparkTwo" />
            <span className="teacherSceneSpark teacherSceneSparkThree" />
            <span className="teacherSceneLine teacherSceneLineOne" />
            <span className="teacherSceneLine teacherSceneLineTwo" />
          </div>
        </div>

        <div className="studentMenuStats teacherMenuStats" aria-label="Tóm tắt vận hành giáo viên">
          {teacherStats.map((item) => (
            <div className="studentMenuStat teacherMenuStat" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <em>{item.note}</em>
            </div>
          ))}
        </div>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {dataMode === 'demo' ? (
          <div className="subtleBox dashboardMessage">Đang hiển thị dữ liệu mẫu vì backend chưa phản hồi.</div>
        ) : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ dữ liệu giáo viên...</div> : null}

        <div className="sectionTitle adminMenuHeading">
          <div>
            <h2>Chọn chức năng giáo viên TOEIC</h2>
            <span>Mỗi chức năng mở sang một màn nghiệp vụ riêng, không trộn vào dashboard.</span>
          </div>
        </div>

        <div className="adminMenuGrid teacherMenuGrid">
          {commandItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                className="adminMenuCard teacherMenuCard"
                href={item.href}
                key={`teacher:${item.href}:${item.label}`}
              >
                <span className="adminMenuCardIndex">{String(index + 1).padStart(2, '0')}</span>
                <span className="adminMenuCardIcon">
                  <Icon size={20} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.text}</small>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function AdminDashboard({
  session,
  showSidebar,
  commandItems,
  roleProfile,
}: {
  session: WebAuthSession;
  showSidebar: boolean;
  commandItems: Array<{
    href: string;
    icon: ComponentType<{ size?: number }>;
    label: string;
    text: string;
  }>;
  roleProfile: RoleProfile;
}) {
  return (
    <AppShell
      session={session}
      active="dashboard"
      roleContext={USER_ROLES.ADMIN}
      showSidebar={showSidebar}
      eyebrow="Control hub"
      title="Trung tâm quản trị"
    >
      <section className="panel adminMenuPanel" aria-label="Đi tới chức năng">
        <div className="adminMenuHero">
          <div className="adminMenuHeroCopy">
            <p className="eyebrow">Xin chào, {session.user.fullName}</p>
            <h2>Trung tâm quản trị EnglishPro TOEIC</h2>
            <p>
              Dashboard admin chỉ giữ 4 UC cấp hệ thống: tài khoản, nội dung TOEIC, dữ liệu học tập và vận hành.
            </p>
            <div className="adminMenuChips" aria-hidden="true">
              <span>
                <Settings size={14} />
                4 UC cốt lõi
              </span>
              <span>
                <Sparkles size={14} />
                TOEIC content
              </span>
              <span>
                <ShieldCheck size={14} />
                Phân quyền
              </span>
            </div>
          </div>

          <div className="adminMenuScene" aria-hidden="true">
            <span className="adminSceneFrame" />
            <span className="adminScenePixelGround" />
            <span className="adminScenePixelTower adminScenePixelTowerOne" />
            <span className="adminScenePixelTower adminScenePixelTowerTwo" />
            <span className="adminScenePixelTree adminScenePixelTreeOne" />
            <span className="adminScenePixelTree adminScenePixelTreeTwo" />
            <span className="adminScenePixelMascot">
              <span />
            </span>
            <span className="adminSceneRidge adminSceneRidgeOne" />
            <span className="adminSceneRidge adminSceneRidgeTwo" />
            <span className="adminSceneRidge adminSceneRidgeThree" />
            <span className="adminSceneGlow adminSceneGlowOne" />
            <span className="adminSceneGlow adminSceneGlowTwo" />
            <span className="adminScenePulse adminScenePulseOne" />
            <span className="adminScenePulse adminScenePulseTwo" />
            <span className="adminSceneBoard" />
            <span className="adminSceneCard adminSceneCardOne" />
            <span className="adminSceneCard adminSceneCardTwo" />
            <span className="adminSceneCard adminSceneCardThree" />
            <span className="adminSceneLine adminSceneLineOne" />
            <span className="adminSceneLine adminSceneLineTwo" />
            <span className="adminSceneLine adminSceneLineThree" />
            <span className="adminSceneDot adminSceneDotOne" />
            <span className="adminSceneDot adminSceneDotTwo" />
            <span className="adminSceneDot adminSceneDotThree" />
            <span className="adminSceneOrbit adminSceneOrbitOne" />
            <span className="adminSceneOrbit adminSceneOrbitTwo" />
          </div>
        </div>

        <div className="sectionTitle adminMenuHeading">
          <div>
            <h2>Chọn UC quản trị</h2>
          </div>
        </div>

        <div className="adminMenuGrid">
          {commandItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                className="adminMenuCard"
                href={item.href}
                key={`admin:${item.href}:${item.label}`}
              >
                <span className="adminMenuCardIndex">{String(index + 1).padStart(2, '0')}</span>
                <span className="adminMenuCardIcon">
                  <Icon size={20} />
                </span>
                <strong>{item.label}</strong>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function formatProgressStatus(status: string) {
  const labels: Record<string, string> = {
    ChuaHoc: 'Chưa học',
    DangHoc: 'Đang học',
    HoanThanh: 'Hoàn thành',
    BiKhoa: 'Bị khóa',
  };

  return labels[status] ?? status;
}

function formatReviewStatus(status: string) {
  const labels: Record<string, string> = {
    ChuaXem: 'Chưa xem',
    DaXem: 'Đã xem',
    HoanThanh: 'Hoàn tất',
  };

  return labels[status] ?? status;
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isStudentNeedingSupport(student: LinkedStudent) {
  return Number(student.averageProgress ?? 0) < 55 || Number(student.lockedLessons ?? 0) > Math.max(1, Number(student.activeLessons ?? 0));
}

function getTeacherSupportBand(student: LinkedStudent) {
  if (isStudentNeedingSupport(student)) {
    return 'needs-support';
  }

  if (Number(student.averageProgress ?? 0) >= 80 || Number(student.learningStreak ?? 0) >= 7) {
    return 'steady';
  }

  return 'watch';
}

function getTeacherSupportLabel(student: LinkedStudent) {
  const band = getTeacherSupportBand(student);

  switch (band) {
    case 'needs-support':
      return 'Cần hỗ trợ';
    case 'steady':
      return 'Ổn định';
    default:
      return 'Nên theo dõi';
  }
}

function getSupportBandRank(band: string) {
  switch (band) {
    case 'needs-support':
      return 0;
    case 'watch':
      return 1;
    default:
      return 2;
  }
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
  note?: string;
}) {
  return (
    <div className="metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
