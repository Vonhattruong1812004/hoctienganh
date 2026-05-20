'use client';

import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileAudio,
  FileText,
  Headphones,
  LibraryBig,
  LogOut,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { USER_ROLES } from '@english-learning/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AppShell } from '../../components/app-shell';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import {
  etsAudioTracksForPart,
  etsKeyAsset,
  etsPartPaperAsset,
  etsPracticeParts,
  etsPracticeTests,
  type EtsPracticePart,
} from '../../lib/ets-practice-library';

type TeacherToeicSection = 'Listening' | 'Reading' | 'Speaking' | 'Writing';

type TeacherToeicPart = Omit<EtsPracticePart, 'section'> & {
  section: TeacherToeicSection;
  skillTag: string;
  questionCount: number;
  keyStatus: 'ChuaNhap' | 'MotPhan' | 'DayDu';
  explanationStatus: 'ChuaCo' | 'CanBoSung' | 'DayDu';
  assetStatus: 'CanKiemTra' | 'SanSang';
};

type TeacherToeicTest = {
  id: string;
  testNumber: number;
  title: string;
  description: string;
  type: 'LR' | 'SW';
  level: 'TOEIC 350+' | 'TOEIC 550+' | 'TOEIC 750+' | 'TOEIC 900+';
  source: string;
  status: 'Nhap' | 'SanSang' | 'TamAn';
  parts: TeacherToeicPart[];
  updatedAt: string;
};

type TeacherToeicStore = {
  customTests: TeacherToeicTest[];
  overrides: Record<string, TeacherToeicTest>;
  deletedIds: string[];
};

const STORE_KEY = 'englishpro:teacher-toeic-test-manager:v1';

const swParts: TeacherToeicPart[] = [
  makePart({ id: 'sw-1', label: 'Speaking 1-2', section: 'Speaking', title: 'Read a text aloud', from: 1, to: 2, durationMinutes: 3 }),
  makePart({ id: 'sw-2', label: 'Speaking 3-4', section: 'Speaking', title: 'Describe a picture', from: 3, to: 4, durationMinutes: 3 }),
  makePart({ id: 'sw-3', label: 'Speaking 5-7', section: 'Speaking', title: 'Respond to questions', from: 5, to: 7, durationMinutes: 6 }),
  makePart({ id: 'sw-4', label: 'Speaking 8-10', section: 'Speaking', title: 'Respond using information', from: 8, to: 10, durationMinutes: 7 }),
  makePart({ id: 'sw-5', label: 'Speaking 11', section: 'Speaking', title: 'Express an opinion', from: 11, to: 11, durationMinutes: 5 }),
  makePart({ id: 'sw-6', label: 'Writing 1-5', section: 'Writing', title: 'Write a sentence based on a picture', from: 1, to: 5, durationMinutes: 8 }),
  makePart({ id: 'sw-7', label: 'Writing 6-7', section: 'Writing', title: 'Respond to a written request', from: 6, to: 7, durationMinutes: 20 }),
  makePart({ id: 'sw-8', label: 'Writing 8', section: 'Writing', title: 'Write an opinion essay', from: 8, to: 8, durationMinutes: 30 }),
];

const emptyDraft = {
  title: '',
  description: '',
  source: '',
  type: 'LR' as TeacherToeicTest['type'],
  level: 'TOEIC 550+' as TeacherToeicTest['level'],
};

const emptyTestDraft = {
  title: '',
  description: '',
  source: '',
  level: 'TOEIC 550+' as TeacherToeicTest['level'],
  status: 'Nhap' as TeacherToeicTest['status'],
};

function makePart(
  input: Partial<Omit<TeacherToeicPart, 'skillTag' | 'questionCount' | 'keyStatus' | 'explanationStatus' | 'assetStatus'>> &
    Pick<TeacherToeicPart, 'id' | 'label' | 'section' | 'title' | 'from' | 'to' | 'durationMinutes'>,
): TeacherToeicPart {
  const questionCount = Math.max(1, input.to - input.from + 1);
  return {
    direction: input.direction ?? officialDirection(input.label),
    paperPageOffset: input.paperPageOffset ?? 0,
    reviewFocus: input.reviewFocus ?? reviewFocusForPart(input.label),
    ...input,
    skillTag: `${input.section} • ${input.label}`,
    questionCount,
    keyStatus: 'DayDu',
    explanationStatus: 'DayDu',
    assetStatus: 'SanSang',
  };
}

function officialDirection(label: string) {
  if (label.includes('Part 1')) return 'Directions: For each question in this part, you will hear four statements about a picture in your test book. Select the one statement that best describes what you see in the picture.';
  if (label.includes('Part 2')) return 'Directions: You will hear a question or statement and three responses spoken in English. Select the best response.';
  if (label.includes('Part 3')) return 'Directions: You will hear some conversations between two or more people. You will be asked to answer three questions about what the speakers say in each conversation.';
  if (label.includes('Part 4')) return 'Directions: You will hear some talks given by a single speaker. You will be asked to answer three questions about what the speaker says in each talk.';
  if (label.includes('Part 5')) return 'Directions: A word or phrase is missing in each sentence. Select the best answer to complete the sentence.';
  if (label.includes('Part 6')) return 'Directions: Read the texts that follow. A word, phrase, or sentence is missing in parts of each text.';
  if (label.includes('Part 7')) return 'Directions: Read a selection of texts. Each text or set of texts is followed by several questions.';
  if (label.includes('Speaking')) return 'Directions: Complete the speaking task within the preparation and response time.';
  return 'Directions: Complete the writing task within the time limit.';
}

function reviewFocusForPart(label: string) {
  if (label.includes('Part 1')) return 'Ảnh người/vật, hành động, vị trí, thì hiện tại tiếp diễn.';
  if (label.includes('Part 2')) return 'Từ hỏi, phản hồi gián tiếp, bẫy lặp âm và ý phủ định.';
  if (label.includes('Part 3')) return 'Mục đích hội thoại, chi tiết, hành động tiếp theo và suy luận.';
  if (label.includes('Part 4')) return 'Thông báo chính, lịch trình, số liệu, yêu cầu hành động.';
  if (label.includes('Part 5')) return 'Từ loại, thì, bị động, giới từ, liên từ và mệnh đề.';
  if (label.includes('Part 6')) return 'Liên kết đoạn, câu chèn, đại từ tham chiếu và mạch văn.';
  if (label.includes('Part 7')) return 'Scanning keyword, suy luận, mục đích văn bản và nhiều đoạn.';
  return 'Tiêu chí chấm TOEIC, độ rõ ý, ngữ pháp, phát âm hoặc tổ chức bài viết.';
}

function normalizeTitle(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\btoic\b/gi, 'TOEIC')
    .replace(/\btoeicc\b/gi, 'TOEIC')
    .replace(/\bets\b/gi, 'ETS');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toTeacherTest(test: (typeof etsPracticeTests)[number]): TeacherToeicTest {
  return {
    id: test.id,
    testNumber: test.testNumber,
    title: test.title,
    description: test.description,
    type: 'LR',
    level: test.testNumber <= 3 ? 'TOEIC 550+' : test.testNumber <= 7 ? 'TOEIC 750+' : 'TOEIC 900+',
    source: `ETS 2026/Test ${test.testNumber}`,
    status: 'SanSang',
    updatedAt: '2026-05-19',
    parts: etsPracticeParts.map((part) => makePart(part)),
  };
}

function readStore(): TeacherToeicStore {
  if (typeof window === 'undefined') return { customTests: [], overrides: {}, deletedIds: [] };
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) return { customTests: [], overrides: {}, deletedIds: [] };
  try {
    return JSON.parse(raw) as TeacherToeicStore;
  } catch {
    return { customTests: [], overrides: {}, deletedIds: [] };
  }
}

function writeStore(store: TeacherToeicStore) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function readiness(test: TeacherToeicTest) {
  const expectedParts = test.type === 'LR' ? 7 : 8;
  const totalQuestions = test.parts.reduce((total, part) => total + part.questionCount, 0);
  const keyReady = test.parts.filter((part) => part.keyStatus === 'DayDu').length;
  const explanationReady = test.parts.filter((part) => part.explanationStatus === 'DayDu').length;
  const assetReady = test.parts.filter((part) => part.assetStatus === 'SanSang').length;
  const partScore = Math.min(1, test.parts.length / expectedParts) * 30;
  const keyScore = test.parts.length ? (keyReady / test.parts.length) * 25 : 0;
  const explanationScore = test.parts.length ? (explanationReady / test.parts.length) * 20 : 0;
  const assetScore = test.parts.length ? (assetReady / test.parts.length) * 15 : 0;
  const questionScore = totalQuestions >= (test.type === 'LR' ? 200 : 19) ? 10 : 5;
  return Math.round(partScore + keyScore + explanationScore + assetScore + questionScore);
}

function getTestWarnings(test: TeacherToeicTest) {
  const warnings: string[] = [];
  const totalQuestions = test.parts.reduce((total, part) => total + part.questionCount, 0);
  const expectedQuestions = test.type === 'LR' ? 200 : 19;
  const expectedParts = test.type === 'LR' ? 7 : 8;

  if (test.parts.length < expectedParts) warnings.push(`Thiếu Part: hiện có ${test.parts.length}/${expectedParts}.`);
  if (totalQuestions < expectedQuestions) warnings.push(`Thiếu câu hỏi: hiện có ${totalQuestions}/${expectedQuestions}.`);
  if (test.parts.some((part) => part.keyStatus !== 'DayDu')) warnings.push('Một số Part chưa đủ đáp án để chấm tự động.');
  if (test.parts.some((part) => part.explanationStatus !== 'DayDu')) warnings.push('Một số Part chưa đủ lời giải/chủ điểm lỗi.');
  if (test.parts.some((part) => part.assetStatus !== 'SanSang')) warnings.push('Một số Part cần kiểm tra audio, ảnh, PDF hoặc task.');

  const overlapped = test.parts.some((part, index) =>
    test.parts.some((other, otherIndex) => index !== otherIndex && part.from <= other.to && other.from <= part.to && part.section === other.section),
  );
  if (overlapped) warnings.push('Có dải câu bị trùng trong cùng kỹ năng, cần chỉnh lại từ câu/đến câu.');

  return warnings;
}

function buildAiTest(draft: typeof emptyDraft, nextIndex: number): TeacherToeicTest {
  const title = normalizeTitle(draft.title || `TOEIC Practice Test ${nextIndex}`);
  const isSW = draft.type === 'SW';
  const description =
    draft.description.trim() ||
    (isSW
      ? 'Bộ đề luyện TOEIC Speaking & Writing theo task, có tiêu chí chấm, mẫu trả lời và gợi ý cải thiện.'
      : 'Bộ đề luyện TOEIC Listening & Reading gồm 7 Part, audio, câu hỏi, key và giải thích để học viên thi thử.');
  return {
    id: `teacher-toeic-${slugify(title)}-${Date.now()}`,
    testNumber: 100 + nextIndex,
    title,
    description,
    type: draft.type,
    level: draft.level,
    source: draft.source.trim() || 'Giáo viên tạo bằng AI nội bộ',
    status: 'Nhap',
    updatedAt: new Date().toISOString().slice(0, 10),
    parts: (isSW ? swParts : etsPracticeParts.map((part) => makePart(part))).map((part) => ({
      ...part,
      id: `${slugify(title)}-${part.id}`,
      keyStatus: isSW ? 'MotPhan' : 'DayDu',
      explanationStatus: isSW ? 'CanBoSung' : 'DayDu',
      assetStatus: 'CanKiemTra',
    })),
  };
}

export default function ToeicPracticePage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [store, setStore] = useState<TeacherToeicStore>({ customTests: [], overrides: {}, deletedIds: [] });
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TatCa' | TeacherToeicTest['type']>('TatCa');
  const [selectedId, setSelectedId] = useState(etsPracticeTests[0]?.id ?? '');
  const [draft, setDraft] = useState(emptyDraft);
  const [testDraft, setTestDraft] = useState(emptyTestDraft);
  const [partDraft, setPartDraft] = useState<TeacherToeicPart | null>(null);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
    setStore(readStore());
  }, [router]);

  useEffect(() => {
    if (session?.user.roles.includes(USER_ROLES.TEACHER)) writeStore(store);
  }, [session, store]);

  const tests = useMemo(() => {
    const deleted = new Set(store.deletedIds);
    const base = etsPracticeTests
      .map(toTeacherTest)
      .map((test) => store.overrides[test.id] ?? test)
      .filter((test) => !deleted.has(test.id));
    return [...base, ...store.customTests.filter((test) => !deleted.has(test.id))];
  }, [store]);

  const selectedTest = tests.find((test) => test.id === selectedId) ?? tests[0];
  const filteredTests = tests.filter((test) => {
    const text = `${test.title} ${test.description} ${test.source}`.toLowerCase();
    const matchQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchType = typeFilter === 'TatCa' || test.type === typeFilter;
    return matchQuery && matchType;
  });

  const stats = useMemo(() => {
    const parts = tests.reduce((total, test) => total + test.parts.length, 0);
    const ready = tests.filter((test) => readiness(test) >= 85).length;
    const questions = tests.reduce((total, test) => total + test.parts.reduce((sum, part) => sum + part.questionCount, 0), 0);
    const warnings = tests.reduce((total, test) => total + test.parts.filter((part) => part.assetStatus !== 'SanSang' || part.keyStatus !== 'DayDu').length, 0);
    return { ready, parts, questions, warnings };
  }, [tests]);

  useEffect(() => {
    if (!selectedTest) return;
    setTestDraft({
      title: selectedTest.title,
      description: selectedTest.description,
      source: selectedTest.source,
      level: selectedTest.level,
      status: selectedTest.status,
    });
    setPartDraft((current) => selectedTest.parts.find((part) => part.id === current?.id) ?? selectedTest.parts[0] ?? null);
    setSyncMessage('');
  }, [selectedTest?.id]);

  function saveTest(next: TeacherToeicTest) {
    setStore((current) => {
      const isCustom = current.customTests.some((test) => test.id === next.id) || next.id.startsWith('teacher-toeic-');
      if (isCustom) {
        return {
          ...current,
          customTests: current.customTests.some((test) => test.id === next.id)
            ? current.customTests.map((test) => (test.id === next.id ? next : test))
            : [next, ...current.customTests],
        };
      }
      return { ...current, overrides: { ...current.overrides, [next.id]: next } };
    });
    setSelectedId(next.id);
  }

  function handleCreateTest() {
    const next = buildAiTest(draft, tests.length + 1);
    saveTest(next);
    setDraft(emptyDraft);
    setPartDraft(next.parts[0] ?? null);
  }

  function handleSaveTestMetadata() {
    if (!selectedTest) return;
    saveTest({
      ...selectedTest,
      title: normalizeTitle(testDraft.title || selectedTest.title),
      description: testDraft.description.trim() || selectedTest.description,
      source: testDraft.source.trim() || selectedTest.source,
      level: testDraft.level,
      status: testDraft.status,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  }

  function handleDeleteTest(testId: string) {
    setStore((current) => ({
      customTests: current.customTests.filter((test) => test.id !== testId),
      overrides: Object.fromEntries(Object.entries(current.overrides).filter(([id]) => id !== testId)),
      deletedIds: Array.from(new Set([...current.deletedIds, testId])),
    }));
    setSelectedId(tests.find((test) => test.id !== testId)?.id ?? '');
  }

  function handleReviewTest() {
    if (!selectedTest) return;
    const reviewed: TeacherToeicTest = {
      ...selectedTest,
      title: normalizeTitle(selectedTest.title),
      description: selectedTest.description.trim() || 'Đề TOEIC đã được giáo viên rà soát để học viên luyện tập.',
      updatedAt: new Date().toISOString().slice(0, 10),
      parts: selectedTest.parts.map((part) => ({
        ...part,
        direction: officialDirection(part.label),
        reviewFocus: part.reviewFocus.trim() || reviewFocusForPart(part.label),
        questionCount: Math.max(1, part.to - part.from + 1),
        keyStatus: part.keyStatus === 'ChuaNhap' ? 'MotPhan' : part.keyStatus,
        explanationStatus: part.explanationStatus === 'ChuaCo' ? 'CanBoSung' : part.explanationStatus,
      })),
    };
    saveTest(reviewed);
    setPartDraft(reviewed.parts[0] ?? null);
  }

  function handleBulkPartStatus(status: Pick<TeacherToeicPart, 'keyStatus' | 'explanationStatus' | 'assetStatus'>) {
    if (!selectedTest) return;
    const updated = {
      ...selectedTest,
      updatedAt: new Date().toISOString().slice(0, 10),
      parts: selectedTest.parts.map((part) => ({ ...part, ...status })),
    };
    saveTest(updated);
    setPartDraft(updated.parts.find((part) => part.id === partDraft?.id) ?? updated.parts[0] ?? null);
  }

  function handleSyncForStudents() {
    if (!selectedTest) return;
    const score = readiness(selectedTest);
    const warnings = getTestWarnings(selectedTest);
    const nextStatus: TeacherToeicTest['status'] = score >= 85 && warnings.length === 0 ? 'SanSang' : 'Nhap';
    saveTest({
      ...selectedTest,
      status: nextStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setTestDraft((current) => ({ ...current, status: nextStatus }));
    setSyncMessage(
      nextStatus === 'SanSang'
        ? 'Đề đã đủ điều kiện và được bật sẵn sàng cho UC thi thử.'
        : 'Đề chưa đủ điều kiện công bố. Hãy xử lý các cảnh báo còn lại trước.',
    );
  }

  function handleRestoreBaseTest(testId: string) {
    setStore((current) => ({
      customTests: current.customTests.filter((test) => test.id !== testId),
      overrides: Object.fromEntries(Object.entries(current.overrides).filter(([id]) => id !== testId)),
      deletedIds: current.deletedIds.filter((id) => id !== testId),
    }));
    setSelectedId(testId);
  }

  function handleSavePart() {
    if (!selectedTest || !partDraft) return;
    const normalizedPart = {
      ...partDraft,
      title: normalizeTitle(partDraft.title),
      questionCount: Math.max(1, partDraft.to - partDraft.from + 1),
      skillTag: `${partDraft.section} • ${partDraft.label}`,
    };
    const exists = selectedTest.parts.some((part) => part.id === normalizedPart.id);
    saveTest({
      ...selectedTest,
      updatedAt: new Date().toISOString().slice(0, 10),
      parts: exists
        ? selectedTest.parts.map((part) => (part.id === normalizedPart.id ? normalizedPart : part))
        : [...selectedTest.parts, normalizedPart],
    });
    setPartDraft(normalizedPart);
  }

  function handleDeletePart(partId: string) {
    if (!selectedTest) return;
    const parts = selectedTest.parts.filter((part) => part.id !== partId);
    saveTest({ ...selectedTest, parts, updatedAt: new Date().toISOString().slice(0, 10) });
    setPartDraft(parts[0] ?? null);
  }

  if (!session) return <main className="studentUcStandalone">Đang chuyển hướng...</main>;

  const isTeacher = session.user.roles.includes(USER_ROLES.TEACHER);
  if (!isTeacher) {
    return (
      <main className="studentUcStandalone">
        <header className="studentUcTopbar">
          <Link className="secondaryButton" href="/dashboard">
            <ArrowLeft size={16} />
            Về dashboard
          </Link>
          <div>
            <p className="eyebrow">Học viên</p>
            <h1>Thi thử TOEIC</h1>
          </div>
          <div className="topbarActions">
            <ThemeToggleButton />
            <button
              className="secondaryButton"
              type="button"
              onClick={() => {
                clearStoredSession();
                router.replace('/login');
              }}
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </header>
        <section className="panel">
          <h2>UC thi thử nằm ở trang riêng.</h2>
          <p>Học viên vào màn chọn Part, làm bài và xem kết quả tại UC thi thử TOEIC.</p>
          <Link className="primaryButton" href="/ets-practice">
            Vào thi thử
          </Link>
        </section>
      </main>
    );
  }

  return (
    <AppShell session={session} active="quizzes" roleContext={USER_ROLES.TEACHER} eyebrow="Giáo viên" title="Quản lý đề luyện TOEIC">
      <section className="teacherToeicHero panel">
        <div>
          <p className="eyebrow">UC3 • Quản lý đề luyện TOEIC</p>
          <h2>Giáo viên kiểm soát bộ đề trước khi học viên thi thử.</h2>
          <p>
            Thêm, sửa, xoá đề; rà soát cấu trúc từng Part, số câu, thời gian, audio, file đề, key và giải thích. Dữ
            liệu đạt sẵn sàng sẽ đồng bộ nghiệp vụ với UC thi thử của học viên.
          </p>
        </div>
        <div className="teacherToeicStats">
          <span><FileText size={18} />{tests.length} đề</span>
          <span><ClipboardList size={18} />{stats.parts} part</span>
          <span><CheckCircle2 size={18} />{stats.ready} sẵn sàng</span>
          <span><RefreshCw size={18} />{stats.warnings} cần rà soát</span>
        </div>
      </section>

      <section className="teacherToeicBuilder panel">
        <div>
          <p className="eyebrow">Tạo đề mới</p>
          <h3>AI chuẩn hóa tên đề và sinh cấu trúc Part</h3>
        </div>
        <div className="teacherToeicFormGrid">
          <label className="field">
            <span>Tên đề</span>
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Ví dụ: ETS 2026 Test 11" />
          </label>
          <label className="field">
            <span>Loại bài</span>
            <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as TeacherToeicTest['type'] }))}>
              <option value="LR">Listening & Reading</option>
              <option value="SW">Speaking & Writing</option>
            </select>
          </label>
          <label className="field">
            <span>Mức mục tiêu</span>
            <select value={draft.level} onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value as TeacherToeicTest['level'] }))}>
              <option>TOEIC 350+</option>
              <option>TOEIC 550+</option>
              <option>TOEIC 750+</option>
              <option>TOEIC 900+</option>
            </select>
          </label>
          <label className="field">
            <span>Nguồn dữ liệu</span>
            <input value={draft.source} onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))} placeholder="Thư mục/PDF/audio/key" />
          </label>
          <label className="field teacherToeicSummary">
            <span>Mô tả</span>
            <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Mục tiêu, phạm vi part, đối tượng học viên..." />
          </label>
        </div>
        <button className="primaryButton" type="button" onClick={handleCreateTest}>
          <Sparkles size={17} />
          Tạo đề bằng AI
        </button>
      </section>

      <section className="teacherToeicToolbar panel">
        <label className="field">
          <span>Tìm đề</span>
          <div className="inlineInputIcon">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên đề, nguồn, mô tả..." />
          </div>
        </label>
        <label className="field">
          <span>Loại bài</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
            <option value="TatCa">Tất cả</option>
            <option value="LR">Listening & Reading</option>
            <option value="SW">Speaking & Writing</option>
          </select>
        </label>
      </section>

      <section className="teacherToeicWorkspace">
        <div className="teacherToeicList panel">
          <div className="sectionHeading">
            <FileText size={20} />
            <div>
              <p className="eyebrow">Danh sách đề</p>
              <h3>{filteredTests.length}/{tests.length} đề đang hiển thị</h3>
            </div>
          </div>
          <div className="teacherToeicTestList">
            {filteredTests.map((test) => {
              const active = selectedTest?.id === test.id;
              const score = readiness(test);
              return (
                <article className={active ? 'active' : ''} key={test.id}>
                  <button type="button" onClick={() => {
                    setSelectedId(test.id);
                    setPartDraft(test.parts[0] ?? null);
                  }}>
                    <small>{test.type === 'LR' ? 'Listening & Reading' : 'Speaking & Writing'} • {test.level}</small>
                    <strong>{test.title}</strong>
                    <span>{test.description}</span>
                  </button>
                  <div className="teacherToeicCardMeta">
                    <em>{test.parts.length} part</em>
                    <em>{test.parts.reduce((total, part) => total + part.questionCount, 0)} câu</em>
                    <em>{score}% sẵn sàng</em>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="teacherToeicDetail panel">
          {selectedTest ? (
            <>
              <div className="teacherTopicDetailHead">
                <div>
                  <p className="eyebrow">{selectedTest.source}</p>
                  <h2>{selectedTest.title}</h2>
                  <span>{selectedTest.description}</span>
                </div>
                <div className="teacherGrammarReadiness" style={{ '--grammar-readiness': `${readiness(selectedTest)}%` } as CSSProperties}>
                  <strong>{readiness(selectedTest)}%</strong>
                  <span>sẵn sàng</span>
                </div>
              </div>

              <div className="teacherToeicDetailActions">
                <button type="button" onClick={handleReviewTest}>
                  <Sparkles size={16} />
                  AI rà soát đề
                </button>
                <button type="button" onClick={handleSyncForStudents}>
                  <Save size={16} />
                  Đồng bộ thi thử
                </button>
                <Link href="/ets-practice" className="teacherToeicInlineLink">
                  <Eye size={16} />
                  Xem phía học viên
                </Link>
                <button type="button" onClick={() => handleRestoreBaseTest(selectedTest.id)}>
                  <RefreshCw size={16} />
                  Khôi phục gốc
                </button>
                <button type="button" onClick={() => handleDeleteTest(selectedTest.id)}>
                  <Trash2 size={16} />
                  Xoá đề
                </button>
              </div>
              {syncMessage ? <div className="teacherToeicSyncMessage">{syncMessage}</div> : null}

              <div className="teacherToeicMetaEditor">
                <div className="sectionHeading compact">
                  <FileText size={18} />
                  <div>
                    <p className="eyebrow">Thông tin đề</p>
                    <h3>Sửa metadata, nguồn và trạng thái công bố</h3>
                  </div>
                  <button type="button" onClick={handleSaveTestMetadata}>
                    <Save size={16} />
                    Lưu đề
                  </button>
                </div>
                <div className="teacherToeicFormGrid">
                  <label className="field">
                    <span>Tên đề</span>
                    <input value={testDraft.title} onChange={(event) => setTestDraft((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="field">
                    <span>Mức mục tiêu</span>
                    <select value={testDraft.level} onChange={(event) => setTestDraft((current) => ({ ...current, level: event.target.value as TeacherToeicTest['level'] }))}>
                      <option>TOEIC 350+</option>
                      <option>TOEIC 550+</option>
                      <option>TOEIC 750+</option>
                      <option>TOEIC 900+</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Trạng thái</span>
                    <select value={testDraft.status} onChange={(event) => setTestDraft((current) => ({ ...current, status: event.target.value as TeacherToeicTest['status'] }))}>
                      <option value="Nhap">Bản nháp</option>
                      <option value="SanSang">Sẵn sàng</option>
                      <option value="TamAn">Tạm ẩn</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Nguồn dữ liệu</span>
                    <input value={testDraft.source} onChange={(event) => setTestDraft((current) => ({ ...current, source: event.target.value }))} />
                  </label>
                  <label className="field teacherToeicSummary">
                    <span>Mô tả</span>
                    <textarea value={testDraft.description} onChange={(event) => setTestDraft((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                </div>
              </div>

              <div className="teacherToeicChecklist">
                <div className="sectionHeading compact">
                  <TriangleAlert size={18} />
                  <div>
                    <p className="eyebrow">Checklist trước khi công bố</p>
                    <h3>{getTestWarnings(selectedTest).length ? `${getTestWarnings(selectedTest).length} vấn đề cần xử lý` : 'Đủ điều kiện nghiệp vụ'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleBulkPartStatus({
                        keyStatus: 'DayDu',
                        explanationStatus: 'DayDu',
                        assetStatus: 'SanSang',
                      })
                    }
                  >
                    <CheckCircle2 size={16} />
                    Đánh dấu đủ
                  </button>
                </div>
                {getTestWarnings(selectedTest).length ? (
                  getTestWarnings(selectedTest).map((warning) => (
                    <span className="warning" key={warning}>
                      <TriangleAlert size={15} />
                      {warning}
                    </span>
                  ))
                ) : (
                  <span>
                    <CheckCircle2 size={15} />
                    Part, số câu, key, lời giải và asset đã sẵn sàng cho học viên luyện đề.
                  </span>
                )}
              </div>

              <div className="teacherToeicAssetGrid">
                <span><FileAudio size={17} />Audio: {selectedTest.type === 'LR' ? `${etsAudioTracksForPart(selectedTest.testNumber, etsPracticeParts[0]).length}+ track` : 'cần rubric riêng'}</span>
                <span><FileText size={17} />Đề: {selectedTest.type === 'LR' ? etsPartPaperAsset(selectedTest.testNumber, etsPracticeParts[0]).label : 'task speaking/writing'}</span>
                <span><LibraryBig size={17} />Key: {selectedTest.type === 'LR' ? etsKeyAsset(selectedTest.testNumber, 'Listening').includes('KEY') ? 'có file key' : 'cần nhập' : 'rubric + mẫu'}</span>
              </div>

              <div className="teacherToeicBulkActions">
                <button type="button" onClick={() => handleBulkPartStatus({ keyStatus: 'DayDu', explanationStatus: 'DayDu', assetStatus: 'SanSang' })}>
                  <CheckCircle2 size={16} />
                  Tất cả sẵn sàng
                </button>
                <button type="button" onClick={() => handleBulkPartStatus({ keyStatus: 'MotPhan', explanationStatus: 'CanBoSung', assetStatus: 'CanKiemTra' })}>
                  <RefreshCw size={16} />
                  Chuyển sang rà soát
                </button>
              </div>

              <div className="teacherToeicPartRail">
                {selectedTest.parts.map((part) => (
                  <button className={partDraft?.id === part.id ? 'active' : ''} type="button" onClick={() => setPartDraft(part)} key={part.id}>
                    <small>{part.skillTag}</small>
                    <strong>{part.title}</strong>
                    <span>Câu {part.from}-{part.to} • {part.durationMinutes} phút</span>
                  </button>
                ))}
              </div>

              <div className="teacherToeicPartEditor">
                <div className="sectionHeading compact">
                  <Headphones size={18} />
                  <div>
                    <p className="eyebrow">Sửa Part</p>
                    <h3>{partDraft?.label ?? 'Chưa chọn Part'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPartDraft(
                        makePart({
                          id: `custom-part-${Date.now()}`,
                          label: `Part ${selectedTest.parts.length + 1}`,
                          section: selectedTest.type === 'LR' ? 'Reading' : 'Writing',
                          title: 'New TOEIC Part',
                          from: 1,
                          to: 1,
                          durationMinutes: 10,
                        }),
                      )
                    }
                  >
                    <Plus size={16} />
                    Thêm Part
                  </button>
                </div>

                {partDraft ? (
                  <>
                    <div className="teacherToeicPartForm">
                      <label className="field">
                        <span>Nhãn Part</span>
                        <input value={partDraft.label} onChange={(event) => setPartDraft({ ...partDraft, label: event.target.value })} />
                      </label>
                      <label className="field">
                        <span>Tên Part</span>
                        <input value={partDraft.title} onChange={(event) => setPartDraft({ ...partDraft, title: event.target.value })} />
                      </label>
                      <label className="field">
                        <span>Kỹ năng</span>
                        <select value={partDraft.section} onChange={(event) => setPartDraft({ ...partDraft, section: event.target.value as TeacherToeicPart['section'] })}>
                          <option>Listening</option>
                          <option>Reading</option>
                          <option>Speaking</option>
                          <option>Writing</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Từ câu</span>
                        <input type="number" value={partDraft.from} onChange={(event) => setPartDraft({ ...partDraft, from: Number(event.target.value) })} />
                      </label>
                      <label className="field">
                        <span>Đến câu</span>
                        <input type="number" value={partDraft.to} onChange={(event) => setPartDraft({ ...partDraft, to: Number(event.target.value) })} />
                      </label>
                      <label className="field">
                        <span>Thời gian</span>
                        <input type="number" value={partDraft.durationMinutes} onChange={(event) => setPartDraft({ ...partDraft, durationMinutes: Number(event.target.value) })} />
                      </label>
                      <label className="field">
                        <span>Key</span>
                        <select value={partDraft.keyStatus} onChange={(event) => setPartDraft({ ...partDraft, keyStatus: event.target.value as TeacherToeicPart['keyStatus'] })}>
                          <option value="ChuaNhap">Chưa nhập</option>
                          <option value="MotPhan">Một phần</option>
                          <option value="DayDu">Đầy đủ</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Giải thích</span>
                        <select value={partDraft.explanationStatus} onChange={(event) => setPartDraft({ ...partDraft, explanationStatus: event.target.value as TeacherToeicPart['explanationStatus'] })}>
                          <option value="ChuaCo">Chưa có</option>
                          <option value="CanBoSung">Cần bổ sung</option>
                          <option value="DayDu">Đầy đủ</option>
                        </select>
                      </label>
                      <label className="field teacherToeicSummary">
                        <span>Directions</span>
                        <textarea value={partDraft.direction} onChange={(event) => setPartDraft({ ...partDraft, direction: event.target.value })} />
                      </label>
                      <label className="field teacherToeicSummary">
                        <span>Trọng tâm review</span>
                        <textarea value={partDraft.reviewFocus} onChange={(event) => setPartDraft({ ...partDraft, reviewFocus: event.target.value })} />
                      </label>
                    </div>
                    <div className="teacherToeicDetailActions">
                      <button type="button" onClick={() => setPartDraft({ ...partDraft, direction: officialDirection(partDraft.label), reviewFocus: reviewFocusForPart(partDraft.label) })}>
                        <Sparkles size={16} />
                        AI sửa Part
                      </button>
                      <button type="button" onClick={handleSavePart}>
                        <Save size={16} />
                        Lưu Part
                      </button>
                      <button type="button" onClick={() => handleDeletePart(partDraft.id)}>
                        <Trash2 size={16} />
                        Xoá Part
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <div className="emptyState">Chưa có đề TOEIC để quản lý.</div>
          )}
        </aside>
      </section>
    </AppShell>
  );
}
