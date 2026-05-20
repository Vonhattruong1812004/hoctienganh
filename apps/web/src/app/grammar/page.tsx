'use client';

import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Edit3,
  Filter,
  Layers3,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { ApiError, apiGet } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import {
  toeicGrammarGroups,
  toeicGrammarTopics,
  type ToeicGrammarQuestion,
  type ToeicGrammarTopic,
} from '../../lib/toeic-grammar-library';

type GrammarDraft = {
  title: string;
  vietnameseTitle: string;
  group: string;
  level: ToeicGrammarTopic['level'];
  partFocus: string;
  summary: string;
};

type GrammarStore = {
  overrides: Record<string, ToeicGrammarTopic>;
  customTopics: ToeicGrammarTopic[];
  deletedIds: string[];
};

type GrammarExploreResponse = {
  grammar: Array<{
    message: string;
    shortMessage: string | null;
    category: string;
    ruleId: string;
    context: string;
    replacements: string[];
  }>;
  examples: Array<{
    sentence: string;
    translation: string | null;
  }>;
  warnings: string[];
};

const GRAMMAR_STORE_KEY = 'englishpro:teacher-grammar-manager:v1';

const defaultGrammarDraft: GrammarDraft = {
  title: '',
  vietnameseTitle: '',
  group: 'Từ loại',
  level: 'Core TOEIC',
  partFocus: 'Part 5, Part 6',
  summary: '',
};

const grammarSeedByGroup: Record<string, Pick<ToeicGrammarTopic, 'patterns' | 'rules' | 'toeicTraps'>> = {
  'Thì và thời gian': {
    patterns: ['S + V(s/es)', 'S + am/is/are + V-ing', 'S + have/has + V3', 'S + will + V'],
    rules: [
      'Nhìn dấu hiệu thời gian trước khi chọn thì.',
      'Xác định hành động xảy ra hiện tại, quá khứ hay tương lai.',
      'Trong TOEIC, ngữ cảnh email/báo cáo thường quyết định thì đúng.',
    ],
    toeicTraps: ['currently -> hiện tại tiếp diễn', 'since/for -> hiện tại hoàn thành', 'by the time -> chú ý thứ tự sự kiện'],
  },
  'Từ loại': {
    patterns: ['adjective + noun', 'verb + adverb', 'be + adjective', 'preposition + noun/gerund'],
    rules: [
      'Xác định vị trí chỗ trống cần danh từ, động từ, tính từ hay trạng từ.',
      'Không dịch vội khi các đáp án cùng một gốc từ.',
      'Sau giới từ thường dùng danh từ hoặc V-ing.',
    ],
    toeicTraps: ['management/manager/managerial/manage dễ gây nhiễu', 'Sau mạo từ thường cần danh từ', 'Trạng từ thường bổ nghĩa động từ/tính từ'],
  },
  'Cấu trúc câu': {
    patterns: ['S + V + O', 'S + be + complement', 'Clause + connector + clause'],
    rules: [
      'Tìm chủ ngữ và động từ chính trước.',
      'Kiểm tra câu có thiếu liên từ hoặc mệnh đề hay không.',
      'Loại bỏ cụm chen giữa để thấy cấu trúc chính.',
    ],
    toeicTraps: ['Cụm giới từ không quyết định động từ', 'Một câu không thể có hai động từ chính nếu thiếu liên từ', 'Mệnh đề quan hệ dễ che chủ ngữ thật'],
  },
  'Mệnh đề và liên từ': {
    patterns: ['although + clause', 'because + clause', 'despite + noun/V-ing', 'relative pronoun + clause'],
    rules: [
      'Phân biệt liên từ đi với mệnh đề và giới từ đi với danh từ/V-ing.',
      'Chọn đại từ quan hệ theo danh từ đứng trước.',
      'Đọc quan hệ nguyên nhân, tương phản, điều kiện trong câu.',
    ],
    toeicTraps: ['although không đi trực tiếp với noun', 'despite không đi trực tiếp với clause', 'which/who/that phụ thuộc danh từ trước nó'],
  },
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function normalizeTeacherText(value: string) {
  const typoMap: Record<string, string> = {
    grammer: 'grammar',
    gramar: 'grammar',
    tenses: 'tenses',
    pasive: 'passive',
    passsive: 'passive',
    comparision: 'comparison',
    conjuction: 'conjunction',
    prepositon: 'preposition',
    prepostion: 'preposition',
    adverb: 'adverb',
    adjctive: 'adjective',
    bussiness: 'business',
  };

  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => typoMap[word.toLowerCase()] ?? word)
    .join(' ');
}

function guessGrammarGroup(title: string, summary: string) {
  const text = normalizeText(`${title} ${summary}`);
  if (/(tense|present|past|future|perfect|thi|thoi gian)/.test(text)) return 'Thì và thời gian';
  if (/(noun|verb|adjective|adverb|word form|tu loai|danh tu|dong tu|tinh tu|trang tu)/.test(text)) return 'Từ loại';
  if (/(clause|relative|conjunction|although|because|if|menh de|lien tu)/.test(text)) return 'Mệnh đề và liên từ';
  if (/(passive|active|subject|agreement|sentence|cau truc|bi dong|chu dong)/.test(text)) return 'Cấu trúc câu';
  if (/(preposition|in on at|gioi tu)/.test(text)) return 'Giới từ và cụm từ';
  return 'Từ loại';
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => normalizeTeacherText(item))
    .filter(Boolean);
}

function readGrammarStore(): GrammarStore {
  if (typeof window === 'undefined') return { overrides: {}, customTopics: [], deletedIds: [] };
  try {
    const raw = window.localStorage.getItem(GRAMMAR_STORE_KEY);
    if (!raw) return { overrides: {}, customTopics: [], deletedIds: [] };
    const parsed = JSON.parse(raw) as Partial<GrammarStore>;
    return {
      overrides: parsed.overrides ?? {},
      customTopics: Array.isArray(parsed.customTopics) ? parsed.customTopics : [],
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
    };
  } catch {
    return { overrides: {}, customTopics: [], deletedIds: [] };
  }
}

function writeGrammarStore(store: GrammarStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GRAMMAR_STORE_KEY, JSON.stringify(store));
}

function buildExample(topicTitle: string, index = 1) {
  return {
    sentence: `The manager reviewed the ${topicTitle.toLowerCase()} rule before the TOEIC practice test.`,
    meaning: `Quản lý đã xem lại quy tắc ${topicTitle} trước bài luyện TOEIC.`,
    note: `Ví dụ ${index} đặt ngữ pháp vào ngữ cảnh công sở TOEIC.`,
  };
}

function buildQuestion(topicId: string, title: string, index = 1): ToeicGrammarQuestion {
  return {
    id: `${topicId}-q-${index}`,
    prompt: `The team _____ the ${title.toLowerCase()} guideline before the meeting.`,
    choices: ['review', 'reviewed', 'reviewing', 'to review'],
    answer: 'reviewed',
    explanation: 'Câu có before the meeting và mô tả hành động đã hoàn tất, chọn động từ quá khứ reviewed.',
  };
}

function buildGrammarTopic(draft: GrammarDraft, external?: GrammarExploreResponse | null, id?: string): ToeicGrammarTopic {
  const title = normalizeTeacherText(draft.title || draft.vietnameseTitle);
  const vietnameseTitle = normalizeTeacherText(draft.vietnameseTitle || draft.title);
  const group = normalizeTeacherText(draft.group || guessGrammarGroup(title, draft.summary));
  const topicId = id ?? `teacher-grammar-${slugify(title || vietnameseTitle)}-${Date.now()}`;
  const groupSeed = grammarSeedByGroup[group] ?? grammarSeedByGroup['Từ loại'];
  const externalRules =
    external?.grammar
      .map((item) => item.message)
      .filter(Boolean)
      .slice(0, 4) ?? [];
  const externalExamples =
    external?.examples.slice(0, 3).map((item, index) => ({
      sentence: item.sentence,
      meaning: item.translation ?? `Ví dụ ${index + 1} liên quan đến ${vietnameseTitle}.`,
      note: 'Câu ví dụ lấy từ nguồn ngoài và cần giáo viên rà soát trước khi dùng chính thức.',
    })) ?? [];

  return {
    id: topicId,
    group,
    title,
    vietnameseTitle,
    level: draft.level,
    partFocus: parseList(draft.partFocus).length ? parseList(draft.partFocus) : ['Part 5', 'Part 6'],
    summary:
      normalizeTeacherText(draft.summary) ||
      `Topic ${title} giúp học viên xử lý câu hỏi TOEIC Reading bằng công thức, dấu hiệu nhận diện và câu luyện tập.`,
    patterns: groupSeed.patterns,
    rules: [...externalRules, ...groupSeed.rules].slice(0, 8),
    toeicTraps: groupSeed.toeicTraps,
    examples: externalExamples.length ? externalExamples : [buildExample(title, 1), buildExample(title, 2)],
    questions: [buildQuestion(topicId, title, 1), buildQuestion(topicId, title, 2)],
  };
}

function getGrammarReadiness(topic: ToeicGrammarTopic) {
  const score = Math.min(
    100,
    Math.round(
      Math.min(topic.patterns.length, 4) * 10 +
        Math.min(topic.rules.length, 5) * 9 +
        Math.min(topic.examples.length, 4) * 8 +
        Math.min(topic.questions.length, 4) * 7 +
        Math.min(topic.toeicTraps.length, 3) * 5,
    ),
  );
  const warnings = [
    topic.patterns.length < 3 ? 'Thiếu công thức/mẫu câu trọng tâm.' : null,
    topic.rules.length < 3 ? 'Thiếu quy tắc xử lý trong TOEIC.' : null,
    topic.examples.length < 2 ? 'Thiếu ví dụ công sở có dịch nghĩa.' : null,
    topic.questions.length < 2 ? 'Thiếu câu luyện Part 5/6.' : null,
    topic.toeicTraps.length < 2 ? 'Thiếu bẫy thường gặp.' : null,
  ].filter((item): item is string => Boolean(item));

  return { score, warnings };
}

export default function GrammarLibraryPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Tất cả');
  const [store, setStore] = useState<GrammarStore>({ overrides: {}, customTopics: [], deletedIds: [] });
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [draft, setDraft] = useState<GrammarDraft>(defaultGrammarDraft);
  const [editMode, setEditMode] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [patternDraft, setPatternDraft] = useState('');
  const [ruleDraft, setRuleDraft] = useState('');
  const [trapDraft, setTrapDraft] = useState('');
  const [exampleDraft, setExampleDraft] = useState({ sentence: '', meaning: '', note: '' });
  const [questionDraft, setQuestionDraft] = useState({
    prompt: '',
    choices: 'A, B, C, D',
    answer: '',
    explanation: '',
  });

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
    setStore(readGrammarStore());
  }, [router]);

  useEffect(() => {
    writeGrammarStore(store);
  }, [store]);

  const editableTopics = useMemo(() => {
    const deleted = new Set(store.deletedIds);
    const base = toeicGrammarTopics
      .filter((topic) => !deleted.has(topic.id))
      .map((topic) => store.overrides[topic.id] ?? topic);
    const custom = store.customTopics.filter((topic) => !deleted.has(topic.id));
    return [...custom, ...base];
  }, [store]);

  const groups = useMemo(() => {
    return Array.from(new Set([...toeicGrammarGroups, ...editableTopics.map((topic) => topic.group)]));
  }, [editableTopics]);

  const filteredTopics = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    return editableTopics.filter((topic) => {
      const matchesGroup = group === 'Tất cả' || topic.group === group;
      const haystack = normalizeText(
        `${topic.title} ${topic.vietnameseTitle} ${topic.group} ${topic.summary} ${topic.partFocus.join(' ')}`,
      );
      return matchesGroup && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [editableTopics, group, query]);
  const studentFilteredTopics = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    return toeicGrammarTopics.filter((topic) => {
      const matchesGroup = group === 'Tất cả' || topic.group === group;
      const haystack = normalizeText(
        `${topic.title} ${topic.vietnameseTitle} ${topic.group} ${topic.summary} ${topic.partFocus.join(' ')}`,
      );
      return matchesGroup && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [group, query]);

  const selectedTopic = useMemo(
    () => filteredTopics.find((topic) => topic.id === selectedTopicId) ?? filteredTopics[0] ?? null,
    [filteredTopics, selectedTopicId],
  );

  const stats = useMemo(() => {
    const questions = editableTopics.reduce((sum, topic) => sum + topic.questions.length, 0);
    const warnings = editableTopics.filter((topic) => getGrammarReadiness(topic).warnings.length > 0).length;
    return {
      topics: editableTopics.length,
      groups: groups.length,
      questions,
      warnings,
    };
  }, [editableTopics, groups.length]);

  useEffect(() => {
    if (!filteredTopics.length) {
      setSelectedTopicId('');
      return;
    }
    if (!selectedTopicId || !filteredTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, selectedTopicId]);

  const isTeacher = session?.user.roles.includes(USER_ROLES.TEACHER) ?? false;
  const selectedReadiness = selectedTopic ? getGrammarReadiness(selectedTopic) : null;

  function persistTopic(topic: ToeicGrammarTopic) {
    setStore((current) => {
      const isBase = toeicGrammarTopics.some((item) => item.id === topic.id);
      if (isBase) {
        return {
          ...current,
          overrides: { ...current.overrides, [topic.id]: topic },
          deletedIds: current.deletedIds.filter((id) => id !== topic.id),
        };
      }
      const exists = current.customTopics.some((item) => item.id === topic.id);
      return {
        ...current,
        customTopics: exists
          ? current.customTopics.map((item) => (item.id === topic.id ? topic : item))
          : [topic, ...current.customTopics],
        deletedIds: current.deletedIds.filter((id) => id !== topic.id),
      };
    });
  }

  async function handleGenerateTopic() {
    if (!session) return;
    setError('');
    setMessage('');
    setAiBusy(true);

    try {
      const normalizedDraft: GrammarDraft = {
        ...draft,
        title: normalizeTeacherText(draft.title || draft.vietnameseTitle),
        vietnameseTitle: normalizeTeacherText(draft.vietnameseTitle || draft.title),
        summary: normalizeTeacherText(draft.summary),
        group: draft.group || guessGrammarGroup(draft.title, draft.summary),
      };

      let external: GrammarExploreResponse | null = null;
      try {
        const params = new URLSearchParams({
          q: normalizedDraft.title || normalizedDraft.vietnameseTitle,
          text: normalizedDraft.summary || normalizedDraft.title,
          limit: '8',
        });
        external = await apiGet<GrammarExploreResponse>(`/integrations/explore?${params.toString()}`, session.accessToken);
      } catch (err) {
        setMessage(
          err instanceof ApiError && err.status === 0
            ? 'API ngoài chưa phản hồi, hệ thống dùng kho ngữ pháp TOEIC nội bộ để sinh topic.'
            : 'Nguồn ngoài chưa đủ ổn định, hệ thống dùng kho ngữ pháp TOEIC nội bộ để sinh topic.',
        );
      }

      const topic = buildGrammarTopic(normalizedDraft, external);
      persistTopic(topic);
      setSelectedTopicId(topic.id);
      setDraft(defaultGrammarDraft);
      setMessage(
        external
          ? `Đã chuẩn hóa topic và lấy thêm ${external.grammar.length} gợi ý ngữ pháp từ nguồn ngoài.`
          : `Đã chuẩn hóa topic và sinh nội dung từ kho TOEIC nội bộ.`,
      );
    } finally {
      setAiBusy(false);
    }
  }

  function handleLoadTopic(topic: ToeicGrammarTopic) {
    setSelectedTopicId(topic.id);
    setEditMode(true);
    setDraft({
      title: topic.title,
      vietnameseTitle: topic.vietnameseTitle,
      group: topic.group,
      level: topic.level,
      partFocus: topic.partFocus.join(', '),
      summary: topic.summary,
    });
  }

  function handleSaveTopicInfo() {
    if (!selectedTopic) return;
    const normalizedDraft: GrammarDraft = {
      title: normalizeTeacherText(draft.title || selectedTopic.title),
      vietnameseTitle: normalizeTeacherText(draft.vietnameseTitle || selectedTopic.vietnameseTitle),
      group: normalizeTeacherText(draft.group || selectedTopic.group),
      level: draft.level || selectedTopic.level,
      partFocus: draft.partFocus || selectedTopic.partFocus.join(', '),
      summary: normalizeTeacherText(draft.summary || selectedTopic.summary),
    };
    const updated = {
      ...selectedTopic,
      ...normalizedDraft,
      partFocus: parseList(normalizedDraft.partFocus),
    };
    persistTopic(updated);
    setEditMode(false);
    setMessage(`Đã cập nhật topic "${updated.vietnameseTitle}".`);
  }

  function handleDeleteTopic(topicId: string) {
    setStore((current) => ({
      overrides: Object.fromEntries(Object.entries(current.overrides).filter(([id]) => id !== topicId)),
      customTopics: current.customTopics.filter((topic) => topic.id !== topicId),
      deletedIds: Array.from(new Set([...current.deletedIds, topicId])),
    }));
    setSelectedTopicId('');
    setMessage('Đã xóa topic khỏi danh sách quản lý.');
  }

  async function handleReviewSelectedTopic() {
    if (!session || !selectedTopic) return;
    setError('');
    setMessage('');
    setAiBusy(true);

    try {
      let external: GrammarExploreResponse | null = null;
      try {
        const params = new URLSearchParams({
          q: selectedTopic.title,
          text: `${selectedTopic.summary} ${selectedTopic.rules.join(' ')}`,
          limit: '8',
        });
        external = await apiGet<GrammarExploreResponse>(`/integrations/explore?${params.toString()}`, session.accessToken);
      } catch {
        external = null;
      }

      const fallback = buildGrammarTopic(
        {
          title: selectedTopic.title,
          vietnameseTitle: selectedTopic.vietnameseTitle,
          group: selectedTopic.group,
          level: selectedTopic.level,
          partFocus: selectedTopic.partFocus.join(', '),
          summary: selectedTopic.summary,
        },
        external,
        selectedTopic.id,
      );
      const normalized: ToeicGrammarTopic = {
        ...selectedTopic,
        title: normalizeTeacherText(selectedTopic.title),
        vietnameseTitle: normalizeTeacherText(selectedTopic.vietnameseTitle),
        group: normalizeTeacherText(selectedTopic.group),
        summary: normalizeTeacherText(selectedTopic.summary),
        patterns: [...new Set([...selectedTopic.patterns.map(normalizeTeacherText), ...fallback.patterns])].filter(Boolean),
        rules: [...new Set([...selectedTopic.rules.map(normalizeTeacherText), ...fallback.rules])].filter(Boolean).slice(0, 10),
        toeicTraps: [...new Set([...selectedTopic.toeicTraps.map(normalizeTeacherText), ...fallback.toeicTraps])].filter(Boolean),
        examples: selectedTopic.examples.length >= 2 ? selectedTopic.examples : fallback.examples,
        questions: selectedTopic.questions.length >= 2 ? selectedTopic.questions : fallback.questions,
      };
      persistTopic(normalized);
      setMessage(
        external
          ? `AI đã rà soát topic và bổ sung ${external.grammar.length} gợi ý từ nguồn ngoài.`
          : 'AI đã rà soát topic bằng kho TOEIC nội bộ và chuẩn hóa nội dung còn thiếu.',
      );
    } finally {
      setAiBusy(false);
    }
  }

  function handleRestoreBaseTopic(topicId: string) {
    const baseTopic = toeicGrammarTopics.find((topic) => topic.id === topicId);
    if (!baseTopic) return;
    setStore((current) => ({
      ...current,
      overrides: Object.fromEntries(Object.entries(current.overrides).filter(([id]) => id !== topicId)),
      deletedIds: current.deletedIds.filter((id) => id !== topicId),
    }));
    setSelectedTopicId(baseTopic.id);
    setMessage(`Đã khôi phục topic gốc "${baseTopic.vietnameseTitle}".`);
  }

  function updateSelectedTopic(updater: (topic: ToeicGrammarTopic) => ToeicGrammarTopic) {
    if (!selectedTopic) return;
    persistTopic(updater(selectedTopic));
  }

  function addListItem(kind: 'patterns' | 'rules' | 'toeicTraps', value: string, clear: () => void) {
    const normalized = normalizeTeacherText(value);
    if (!normalized) return;
    updateSelectedTopic((topic) => ({
      ...topic,
      [kind]: [...topic[kind], normalized],
    }));
    clear();
  }

  function removeListItem(kind: 'patterns' | 'rules' | 'toeicTraps', index: number) {
    updateSelectedTopic((topic) => ({
      ...topic,
      [kind]: topic[kind].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateListItem(kind: 'patterns' | 'rules' | 'toeicTraps', index: number, value: string) {
    updateSelectedTopic((topic) => ({
      ...topic,
      [kind]: topic[kind].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function normalizeListItem(kind: 'patterns' | 'rules' | 'toeicTraps', index: number) {
    updateSelectedTopic((topic) => ({
      ...topic,
      [kind]: topic[kind].map((item, itemIndex) => (itemIndex === index ? normalizeTeacherText(item) : item)),
    }));
  }

  function updateExample(index: number, field: 'sentence' | 'meaning' | 'note', value: string) {
    updateSelectedTopic((topic) => ({
      ...topic,
      examples: topic.examples.map((example, itemIndex) =>
        itemIndex === index
          ? {
              ...example,
              [field]: value,
            }
          : example,
      ),
    }));
  }

  function normalizeExample(index: number) {
    updateSelectedTopic((topic) => ({
      ...topic,
      examples: topic.examples.map((example, itemIndex) =>
        itemIndex === index
          ? {
              sentence: normalizeTeacherText(example.sentence),
              meaning: normalizeTeacherText(example.meaning),
              note: normalizeTeacherText(example.note),
            }
          : example,
      ),
    }));
  }

  function updateQuestion(index: number, field: 'prompt' | 'choices' | 'answer' | 'explanation', value: string) {
    updateSelectedTopic((topic) => ({
      ...topic,
      questions: topic.questions.map((question, itemIndex) => {
        if (itemIndex !== index) return question;
        if (field === 'choices') return { ...question, choices: parseList(value) };
        return { ...question, [field]: value };
      }),
    }));
  }

  function normalizeQuestion(index: number) {
    updateSelectedTopic((topic) => ({
      ...topic,
      questions: topic.questions.map((question, itemIndex) =>
        itemIndex === index
          ? {
              ...question,
              prompt: normalizeTeacherText(question.prompt),
              choices: question.choices.map(normalizeTeacherText).filter(Boolean),
              answer: normalizeTeacherText(question.answer),
              explanation: normalizeTeacherText(question.explanation),
            }
          : question,
      ),
    }));
  }

  function addExample() {
    if (!exampleDraft.sentence.trim()) return;
    updateSelectedTopic((topic) => ({
      ...topic,
      examples: [
        ...topic.examples,
        {
          sentence: normalizeTeacherText(exampleDraft.sentence),
          meaning: normalizeTeacherText(exampleDraft.meaning),
          note: normalizeTeacherText(exampleDraft.note) || 'Ví dụ giáo viên thêm vào topic.',
        },
      ],
    }));
    setExampleDraft({ sentence: '', meaning: '', note: '' });
  }

  function addQuestion() {
    if (!selectedTopic || !questionDraft.prompt.trim()) return;
    const choices = parseList(questionDraft.choices);
    const answer = normalizeTeacherText(questionDraft.answer || choices[0] || '');
    const question: ToeicGrammarQuestion = {
      id: `${selectedTopic.id}-q-${Date.now()}`,
      prompt: normalizeTeacherText(questionDraft.prompt),
      choices: choices.length >= 2 ? choices : ['A', 'B', 'C', 'D'],
      answer,
      explanation: normalizeTeacherText(questionDraft.explanation) || `Đáp án đúng là ${answer}.`,
    };
    updateSelectedTopic((topic) => ({
      ...topic,
      questions: [...topic.questions, question],
    }));
    setQuestionDraft({ prompt: '', choices: 'A, B, C, D', answer: '', explanation: '' });
  }

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  if (isTeacher) {
    return (
      <AppShell
        session={session}
        active="paths"
        roleContext={USER_ROLES.TEACHER}
        showSidebar={false}
        eyebrow="Giáo viên"
        title="Quản lý ngữ pháp TOEIC"
      >
        <section className="teacherGrammarHero panel">
          <div>
            <p className="eyebrow">CRUD topic ngữ pháp</p>
            <h2>Thêm, sửa, xóa topic ngữ pháp và bài luyện Part 5/6.</h2>
            <p>
              Giáo viên nhập topic, AI hỗ trợ sửa chính tả, phân nhóm nội dung, tạo công thức,
              quy tắc, ví dụ, bẫy TOEIC và câu luyện để học viên học ngay.
            </p>
          </div>
          <div className="teacherGrammarStats">
            <span><BookOpenCheck size={16} />{stats.topics} topic</span>
            <span><Layers3 size={16} />{stats.groups} nhóm</span>
            <span><CheckCircle2 size={16} />{stats.questions} câu luyện</span>
            <span><Sparkles size={16} />{stats.warnings} cần rà soát</span>
          </div>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {message ? <div className="subtleBox dashboardMessage">{message}</div> : null}

        <section className="teacherGrammarBuilder panel">
          <div className="sectionTitle">
            <div>
              <h2>{editMode ? 'Sửa topic đang chọn' : 'Thêm topic bằng AI'}</h2>
              <span>Topic mới được chuẩn hóa rồi đưa vào danh sách để giáo viên tiếp tục chỉnh rule/câu luyện.</span>
            </div>
            <button className="secondaryButton" type="button" onClick={() => {
              setEditMode(false);
              setDraft(defaultGrammarDraft);
            }}>
              <X size={15} />
              Làm mới
            </button>
          </div>

          <div className="teacherGrammarFormGrid">
            <label className="field">
              <span>Tên tiếng Anh</span>
              <input
                value={draft.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setDraft((current) => ({ ...current, title, group: guessGrammarGroup(title, current.summary) }));
                }}
                placeholder="Passive voice, Relative clauses..."
              />
            </label>
            <label className="field">
              <span>Tên tiếng Việt</span>
              <input
                value={draft.vietnameseTitle}
                onChange={(event) => setDraft((current) => ({ ...current, vietnameseTitle: event.target.value }))}
                placeholder="Câu bị động, Mệnh đề quan hệ..."
              />
            </label>
            <label className="field">
              <span>Nhóm</span>
              <input
                value={draft.group}
                onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))}
                list="grammar-group-list"
              />
              <datalist id="grammar-group-list">
                {groups.map((item) => (
                  <option value={item} key={item} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Cấp độ</span>
              <select
                value={draft.level}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, level: event.target.value as ToeicGrammarTopic['level'] }))
                }
              >
                {['Foundation', 'Core TOEIC', 'Advanced TOEIC'].map((level) => (
                  <option value={level} key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Part áp dụng</span>
              <input
                value={draft.partFocus}
                onChange={(event) => setDraft((current) => ({ ...current, partFocus: event.target.value }))}
                placeholder="Part 5, Part 6"
              />
            </label>
            <label className="field teacherGrammarSummary">
              <span>Mô tả</span>
              <textarea
                value={draft.summary}
                onChange={(event) => {
                  const summary = event.target.value;
                  setDraft((current) => ({ ...current, summary, group: current.group || guessGrammarGroup(current.title, summary) }));
                }}
                placeholder="Mô tả cách topic này xuất hiện trong TOEIC..."
              />
            </label>
          </div>

          <div className="teacherTopicBuilderActions">
            {editMode ? (
              <button className="primaryButton" type="button" onClick={handleSaveTopicInfo}>
                <Save size={15} />
                Lưu topic
              </button>
            ) : (
              <button className="primaryButton" type="button" onClick={handleGenerateTopic} disabled={aiBusy || !(draft.title || draft.vietnameseTitle)}>
                {aiBusy ? <RefreshCw size={15} /> : <Wand2 size={15} />}
                {aiBusy ? 'Đang sinh topic...' : 'Phân tích và thêm topic'}
              </button>
            )}
          </div>
        </section>

        <section className="teacherGrammarToolbar panel">
          <label className="field">
            <span>Tìm topic</span>
            <div className="parentSearchInput">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="passive, relative, preposition..." />
            </div>
          </label>
          <label className="field">
            <span>Nhóm</span>
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              <option value="Tất cả">Tất cả</option>
              {groups.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <span className="inlineBadge"><Filter size={14} />{filteredTopics.length}/{editableTopics.length}</span>
        </section>

        <section className="teacherGrammarWorkspace">
          <div className="teacherGrammarList panel">
            <div className="sectionTitle">
              <div>
                <h2>Danh sách topic</h2>
                <span>Chọn topic để sửa nội dung chi tiết.</span>
              </div>
            </div>
            <div className="teacherGrammarTopicList">
              {filteredTopics.map((topic) => {
                const readiness = getGrammarReadiness(topic);
                return (
                  <article className={selectedTopic?.id === topic.id ? 'active' : ''} key={topic.id}>
                    <p className="eyebrow">{topic.group}</p>
                    <h3>{topic.vietnameseTitle}</h3>
                    <strong>{topic.title}</strong>
                    <p>{topic.summary}</p>
                    <div className="grammarTopicMeta">
                      <span>{topic.level}</span>
                      <span>{topic.partFocus.join(' / ')}</span>
                      <span>{readiness.score}% sẵn sàng</span>
                    </div>
                    <div className="teacherTopicActions">
                      <button className="secondaryButton" type="button" onClick={() => setSelectedTopicId(topic.id)}>Chọn</button>
                      <button className="secondaryButton" type="button" onClick={() => handleLoadTopic(topic)}>
                        <Edit3 size={14} />
                        Sửa
                      </button>
                      <button className="dangerButton" type="button" onClick={() => handleDeleteTopic(topic.id)}>
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="teacherGrammarDetail panel">
            {selectedTopic && selectedReadiness ? (
              <>
                <div className="teacherTopicDetailHead">
                  <p className="eyebrow">{selectedTopic.group}</p>
                  <h2>{selectedTopic.vietnameseTitle}</h2>
                  <span>{selectedTopic.summary}</span>
                </div>

                <div className="teacherGrammarReadiness">
                  <strong>{selectedReadiness.score}%</strong>
                  <span>sẵn sàng</span>
                </div>

                <div className="teacherGrammarDetailActions">
                  <button className="primaryButton" type="button" onClick={handleReviewSelectedTopic} disabled={aiBusy}>
                    {aiBusy ? <RefreshCw size={14} /> : <Wand2 size={14} />}
                    {aiBusy ? 'Đang rà soát...' : 'AI rà soát topic'}
                  </button>
                  {toeicGrammarTopics.some((topic) => topic.id === selectedTopic.id) ? (
                    <button className="secondaryButton" type="button" onClick={() => handleRestoreBaseTopic(selectedTopic.id)}>
                      Khôi phục gốc
                    </button>
                  ) : null}
                </div>

                <div className="teacherGrammarBuckets">
                  <GrammarBucket title="Công thức" items={selectedTopic.patterns} value={patternDraft} onValue={setPatternDraft} onAdd={() => addListItem('patterns', patternDraft, () => setPatternDraft(''))} onEdit={(index, value) => updateListItem('patterns', index, value)} onNormalize={(index) => normalizeListItem('patterns', index)} onRemove={(index) => removeListItem('patterns', index)} />
                  <GrammarBucket title="Quy tắc" items={selectedTopic.rules} value={ruleDraft} onValue={setRuleDraft} onAdd={() => addListItem('rules', ruleDraft, () => setRuleDraft(''))} onEdit={(index, value) => updateListItem('rules', index, value)} onNormalize={(index) => normalizeListItem('rules', index)} onRemove={(index) => removeListItem('rules', index)} />
                  <GrammarBucket title="Bẫy TOEIC" items={selectedTopic.toeicTraps} value={trapDraft} onValue={setTrapDraft} onAdd={() => addListItem('toeicTraps', trapDraft, () => setTrapDraft(''))} onEdit={(index, value) => updateListItem('toeicTraps', index, value)} onNormalize={(index) => normalizeListItem('toeicTraps', index)} onRemove={(index) => removeListItem('toeicTraps', index)} />
                </div>

                <div className="teacherGrammarEditorBlock">
                  <h3>Ví dụ ngữ cảnh</h3>
                  <div className="teacherGrammarExampleList">
                    {selectedTopic.examples.map((example, index) => (
                      <div key={`${example.sentence}:${index}`}>
                        <input value={example.sentence} onChange={(event) => updateExample(index, 'sentence', event.target.value)} />
                        <input value={example.meaning} onChange={(event) => updateExample(index, 'meaning', event.target.value)} />
                        <input value={example.note} onChange={(event) => updateExample(index, 'note', event.target.value)} />
                        <div className="teacherGrammarRowActions">
                          <button className="secondaryButton" type="button" onClick={() => normalizeExample(index)}>AI sửa chữ</button>
                          <button className="dangerButton" type="button" onClick={() => updateSelectedTopic((topic) => ({ ...topic, examples: topic.examples.filter((_, itemIndex) => itemIndex !== index) }))}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="teacherGrammarMiniForm">
                    <input value={exampleDraft.sentence} onChange={(event) => setExampleDraft((current) => ({ ...current, sentence: event.target.value }))} placeholder="Sentence" />
                    <input value={exampleDraft.meaning} onChange={(event) => setExampleDraft((current) => ({ ...current, meaning: event.target.value }))} placeholder="Dịch nghĩa" />
                    <input value={exampleDraft.note} onChange={(event) => setExampleDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Ghi chú TOEIC" />
                    <button className="secondaryButton" type="button" onClick={addExample}><Plus size={14} />Thêm ví dụ</button>
                  </div>
                </div>

                <div className="teacherGrammarEditorBlock">
                  <h3>Câu luyện Part 5/6</h3>
                  <div className="teacherGrammarQuestionList">
                    {selectedTopic.questions.map((question, index) => (
                      <div key={question.id}>
                        <label>
                          <span>{index + 1}. Câu hỏi</span>
                          <input value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} />
                        </label>
                        <label>
                          <span>Lựa chọn</span>
                          <input value={question.choices.join(', ')} onChange={(event) => updateQuestion(index, 'choices', event.target.value)} />
                        </label>
                        <label>
                          <span>Đáp án</span>
                          <input value={question.answer} onChange={(event) => updateQuestion(index, 'answer', event.target.value)} />
                        </label>
                        <label>
                          <span>Giải thích</span>
                          <input value={question.explanation} onChange={(event) => updateQuestion(index, 'explanation', event.target.value)} />
                        </label>
                        <div className="teacherGrammarRowActions">
                          <button className="secondaryButton" type="button" onClick={() => normalizeQuestion(index)}>AI sửa chữ</button>
                          <button className="dangerButton" type="button" onClick={() => updateSelectedTopic((topic) => ({ ...topic, questions: topic.questions.filter((item) => item.id !== question.id) }))}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="teacherGrammarMiniForm question">
                    <input value={questionDraft.prompt} onChange={(event) => setQuestionDraft((current) => ({ ...current, prompt: event.target.value }))} placeholder="Câu hỏi" />
                    <input value={questionDraft.choices} onChange={(event) => setQuestionDraft((current) => ({ ...current, choices: event.target.value }))} placeholder="Các lựa chọn, cách nhau bằng dấu phẩy" />
                    <input value={questionDraft.answer} onChange={(event) => setQuestionDraft((current) => ({ ...current, answer: event.target.value }))} placeholder="Đáp án đúng" />
                    <input value={questionDraft.explanation} onChange={(event) => setQuestionDraft((current) => ({ ...current, explanation: event.target.value }))} placeholder="Giải thích" />
                    <button className="secondaryButton" type="button" onClick={addQuestion}><Plus size={14} />Thêm câu</button>
                  </div>
                </div>

                {selectedReadiness.warnings.length ? (
                  <div className="teacherTopicWarnings">
                    {selectedReadiness.warnings.map((warning) => (
                      <div key={warning}><Sparkles size={14} /><span>{warning}</span></div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="subtleBox">Chọn một topic để quản lý chi tiết.</div>
            )}
          </aside>
        </section>
      </AppShell>
    );
  }

  return (
    <main className="studentUcStandalone grammarLibraryPage">
      <header className="studentUcTopbar">
        <Link className="secondaryButton" href="/dashboard">
          <ArrowLeft size={16} />
          Về dashboard
        </Link>
        <div>
          <p className="eyebrow">Học viên</p>
          <h1>Học ngữ pháp TOEIC</h1>
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

      <section className="grammarHero">
        <div>
          <p className="eyebrow">TOEIC Reading • Part 5/6</p>
          <h2>Chọn topic ngữ pháp để học rồi luyện game ngay.</h2>
          <p>
            Bộ topic này tập trung vào các điểm ngữ pháp hay gặp trong Incomplete Sentences và Text Completion:
            thì, từ loại, bị động, mệnh đề, giới từ, liên từ, rút gọn và cấu trúc câu công sở.
          </p>
        </div>
        <div className="grammarHeroStats">
          <strong>{toeicGrammarTopics.length}</strong>
          <span>topic TOEIC</span>
          <strong>{toeicGrammarGroups.length}</strong>
          <span>nhóm ngữ pháp</span>
        </div>
      </section>

      <section className="grammarToolbar" aria-label="Lọc topic ngữ pháp">
        <label className="field">
          <span>
            <Search size={16} />
            Tìm topic
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="VD: bị động, relative, preposition..."
          />
        </label>
        <div className="grammarGroupTabs" aria-label="Nhóm topic">
          <button className={group === 'Tất cả' ? 'active' : ''} type="button" onClick={() => setGroup('Tất cả')}>
            <Filter size={15} />
            Tất cả
          </button>
          {toeicGrammarGroups.map((item) => (
            <button className={group === item ? 'active' : ''} type="button" onClick={() => setGroup(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="grammarTopicGrid" aria-label="Danh sách topic ngữ pháp TOEIC">
        {studentFilteredTopics.map((topic) => (
          <Link className="grammarTopicCard" href={`/grammar/${topic.id}`} key={topic.id}>
            <span className="grammarTopicIcon">
              <BookOpenCheck size={22} />
            </span>
            <p className="eyebrow">{topic.group}</p>
            <h2>{topic.vietnameseTitle}</h2>
            <strong>{topic.title}</strong>
            <p>{topic.summary}</p>
            <div className="grammarTopicMeta">
              <span>
                <CheckCircle2 size={15} />
                {topic.level}
              </span>
              <span>
                <Sparkles size={15} />
                {topic.partFocus.join(' / ')}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

function GrammarBucket({
  title,
  items,
  value,
  onValue,
  onAdd,
  onEdit,
  onNormalize,
  onRemove,
}: {
  title: string;
  items: string[];
  value: string;
  onValue: (value: string) => void;
  onAdd: () => void;
  onEdit: (index: number, value: string) => void;
  onNormalize: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="teacherGrammarEditableList">
        {items.map((item, index) => (
          <div key={`${item}:${index}`}>
            <input value={item} onChange={(event) => onEdit(index, event.target.value)} />
            <button className="secondaryButton" type="button" onClick={() => onNormalize(index)}>
              AI sửa
            </button>
            <button className="dangerButton" type="button" onClick={() => onRemove(index)} aria-label={`Xóa ${item}`}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="teacherGrammarInlineAdd">
        <input value={value} onChange={(event) => onValue(event.target.value)} placeholder={`Thêm ${title.toLowerCase()}`} />
        <button className="secondaryButton" type="button" onClick={onAdd}>
          <Plus size={14} />
          Thêm
        </button>
      </div>
    </section>
  );
}
