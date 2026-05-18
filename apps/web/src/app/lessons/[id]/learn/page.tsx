'use client';

import { ArrowLeft, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SpeechButton } from '../../../../components/speech-button';
import { ThemeToggleButton } from '../../../../components/theme-toggle';
import { ApiError, apiGet, resolveApiAssetUrl } from '../../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../../lib/session';
import { getLibraryLessonDetail, isLibraryTopicId } from '../../../../lib/topic-library';
import { mergeTopicVocabulary, resolveVocabularyTopic } from '../../../../lib/topic-meta';

type LessonDetail = {
  id: string;
  title: string;
  description: string;
  content: string;
  level: string;
  passingScore: number;
  topicName: string;
  stageName?: string | null;
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
  grammarPoints: Array<{
    id: string;
    title: string;
    structure: string | null;
    explanation: string | null;
    example: string | null;
    note: string | null;
  }>;
  quizzes: Array<{ id: string; title: string; passingScore: number; durationMinutes: number | null; status?: string }>;
  progress: { status: string; percentComplete: number; bestScore: number } | null;
  progressPercent: number;
};

const abstractImageWords = new Set([
  'ability',
  'able',
  'accept',
  'achieve',
  'action',
  'active',
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
  'connect',
  'continue',
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
  'keep',
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
  'right',
  'same',
  'search',
  'select',
  'share',
  'simple',
  'solve',
  'support',
  'target',
  'think',
  'try',
  'understand',
  'use',
  'useful',
  'work',
]);

type VocabularyVisualKind =
  | 'calendar'
  | 'meeting'
  | 'people'
  | 'document'
  | 'device'
  | 'office'
  | 'travel'
  | 'food'
  | 'animal'
  | 'education'
  | 'finance'
  | 'communication'
  | 'health'
  | 'logistics'
  | 'nature'
  | 'concept';

const visualWordGroups: Record<VocabularyVisualKind, string[]> = {
  calendar: ['agenda', 'appointment', 'calendar', 'deadline', 'schedule', 'date', 'time', 'plan', 'itinerary'],
  meeting: [
    'boardroom',
    'briefing',
    'chairperson',
    'committee',
    'conference',
    'meeting',
    'presentation',
    'projector',
    'training',
    'workshop',
  ],
  people: [
    'assistant',
    'colleague',
    'employee',
    'manager',
    'recruit',
    'secretary',
    'staff',
    'supervisor',
    'teamwork',
    'customer',
    'client',
    'guest',
    'passenger',
    'interview',
  ],
  document: [
    'document',
    'file',
    'folder',
    'form',
    'memo',
    'noticeboard',
    'paperwork',
    'proposal',
    'report',
    'invoice',
    'receipt',
    'contract',
    'application',
    'brochure',
  ],
  device: [
    'desk',
    'equipment',
    'extension',
    'monitor',
    'printer',
    'scanner',
    'telephone',
    'computer',
    'keyboard',
    'screen',
    'camera',
    'machine',
    'tool',
  ],
  office: [
    'department',
    'headquarters',
    'office',
    'reception',
    'workplace',
    'building',
    'company',
    'factory',
    'branch',
    'warehouse',
  ],
  travel: [
    'airport',
    'airline',
    'arrival',
    'baggage',
    'boarding',
    'booking',
    'departure',
    'destination',
    'flight',
    'gate',
    'hotel',
    'luggage',
    'passport',
    'platform',
    'reservation',
    'ticket',
    'train',
    'transportation',
  ],
  food: ['apple', 'bread', 'breakfast', 'coffee', 'drink', 'food', 'fruit', 'juice', 'meal', 'milk', 'orange', 'restaurant', 'water'],
  animal: ['animal', 'bird', 'cat', 'dog', 'fish', 'penguin', 'pig', 'rabbit', 'turtle', 'zoo'],
  education: ['book', 'classroom', 'course', 'lesson', 'notebook', 'pen', 'pencil', 'school', 'student', 'teacher', 'test', 'vocabulary'],
  finance: ['account', 'bank', 'budget', 'cash', 'coin', 'cost', 'credit', 'fee', 'money', 'payment', 'price', 'salary', 'tax'],
  communication: ['call', 'email', 'message', 'phone', 'reply', 'send', 'speak', 'telephone', 'text', 'write'],
  health: ['doctor', 'exercise', 'health', 'hospital', 'medicine', 'patient', 'sleep', 'treatment'],
  logistics: ['cart', 'delivery', 'package', 'parcel', 'ship', 'shipment', 'stock', 'store', 'supply', 'truck', 'warehouse'],
  nature: ['cloud', 'flower', 'garden', 'leaf', 'mountain', 'rain', 'river', 'sea', 'sun', 'tree', 'water', 'weather'],
  concept: [],
};

function resolveVocabularyVisualKind(word: string, meaning: string, wordType?: string | null): VocabularyVisualKind {
  const normalized = `${word} ${meaning}`.toLowerCase();
  if (/expression \d+/i.test(word)) return 'concept';

  for (const [kind, keywords] of Object.entries(visualWordGroups) as Array<[VocabularyVisualKind, string[]]>) {
    if (kind === 'concept') continue;
    if (keywords.some((keyword) => normalized.includes(keyword))) return kind;
  }

  const exactWord = word.toLowerCase().trim();
  if (abstractImageWords.has(exactWord)) return 'concept';
  if (wordType === 'verb' || wordType === 'adjective' || wordType === 'keyword' || wordType === 'phrase') return 'concept';
  return 'education';
}

function buildVocabularyFallbackImage(word: string, meaning: string, wordType?: string | null) {
  const safeWord = encodeXml(word);
  const safeMeaning = encodeXml(meaning);
  const shortWord = encodeXml(word.length > 22 ? `${word.slice(0, 20)}...` : word);
  const shortMeaning = encodeXml(meaning.length > 34 ? `${meaning.slice(0, 32)}...` : meaning);
  const hue = Math.abs([...word].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360;
  const kind = resolveVocabularyVisualKind(word, meaning, wordType);
  const scene = renderVocabularyScene(kind, hue, word, meaning);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue}, 86%, 86%)"/>
          <stop offset="52%" stop-color="#f0f9ff"/>
          <stop offset="100%" stop-color="#ecfeff"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" flood-color="#0f172a" flood-opacity=".18"/>
        </filter>
      </defs>
      <rect width="900" height="560" rx="38" fill="url(#bg)"/>
      <circle cx="760" cy="106" r="54" fill="#fde047" opacity=".9"/>
      <path d="M0 410 L150 286 L272 360 L418 244 L574 386 L708 302 L900 418 L900 560 L0 560 Z" fill="#bfdbfe" opacity=".5"/>
      <path d="M0 432 H900 V560 H0 Z" fill="#dcfce7" opacity=".72"/>
      <g filter="url(#shadow)">
        <rect x="80" y="70" width="740" height="390" rx="34" fill="#ffffff" opacity=".94"/>
        ${scene}
        <rect x="124" y="348" width="652" height="78" rx="24" fill="#f8fafc" stroke="#bae6fd" stroke-width="3"/>
        <text x="154" y="394" font-family="Inter, Arial, sans-serif" font-size="${word.length > 18 ? 36 : 44}" font-weight="900" fill="#0f172a">${shortWord}</text>
        <text x="520" y="393" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="#475569">${shortMeaning}</text>
      </g>
      <text x="90" y="498" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="#075985">${safeWord} • ${safeMeaning}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderVocabularyScene(kind: VocabularyVisualKind, hue: number, word: string, meaning: string) {
  const accent = `hsl(${hue}, 78%, 58%)`;
  const dark = '#0f172a';
  const orange = '#fb923c';
  const focusObject = renderVocabularyFocusObject(word, meaning, kind, hue);

  const scenes: Record<VocabularyVisualKind, string> = {
    calendar: `
      <rect x="182" y="122" width="250" height="178" rx="28" fill="#ffffff" stroke="#38bdf8" stroke-width="12"/>
      <rect x="182" y="122" width="250" height="52" rx="26" fill="${accent}"/>
      <circle cx="232" cy="146" r="12" fill="#0f172a"/><circle cx="382" cy="146" r="12" fill="#0f172a"/>
      <g fill="#e0f2fe"><rect x="216" y="198" width="42" height="32" rx="8"/><rect x="280" y="198" width="42" height="32" rx="8"/><rect x="344" y="198" width="42" height="32" rx="8"/><rect x="216" y="246" width="42" height="32" rx="8"/><rect x="280" y="246" width="42" height="32" rx="8"/></g>
      <path d="M348 255 l22 22 l52 -64" fill="none" stroke="#16a34a" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="498" y="154" width="170" height="112" rx="22" fill="#fef3c7"/><path d="M530 198 H640 M530 230 H606" stroke="#92400e" stroke-width="14" stroke-linecap="round"/>
      ${focusObject}`,
    meeting: `
      <rect x="196" y="120" width="320" height="132" rx="24" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="10"/>
      <path d="M236 176 H478 M236 214 H412" stroke="${dark}" stroke-width="16" stroke-linecap="round"/>
      <ellipse cx="454" cy="292" rx="176" ry="50" fill="#c084fc" opacity=".8"/>
      <g fill="#0f172a"><circle cx="286" cy="292" r="28"/><circle cx="452" cy="238" r="28"/><circle cx="620" cy="292" r="28"/></g>
      <g fill="${orange}"><rect x="256" y="316" width="60" height="54" rx="18"/><rect x="422" y="262" width="60" height="54" rx="18"/><rect x="590" y="316" width="60" height="54" rx="18"/></g>
      ${focusObject}`,
    people: `
      <rect x="176" y="250" width="500" height="74" rx="22" fill="#bae6fd"/>
      <g fill="#0f172a"><circle cx="250" cy="190" r="42"/><circle cx="452" cy="170" r="46"/><circle cx="648" cy="190" r="42"/></g>
      <g fill="${accent}"><rect x="196" y="236" width="108" height="102" rx="32"/><rect x="390" y="222" width="124" height="116" rx="34"/><rect x="594" y="236" width="108" height="102" rx="32"/></g>
      <rect x="290" y="316" width="320" height="24" rx="12" fill="#0284c7"/>
      ${focusObject}`,
    document: `
      <path d="M182 174 h204 l42 54 v142 H182 Z" fill="#ffffff" stroke="#38bdf8" stroke-width="12" stroke-linejoin="round"/>
      <path d="M386 174 v58 h50" fill="#dbeafe"/>
      <path d="M226 246 H360 M226 286 H390 M226 326 H336" stroke="#475569" stroke-width="15" stroke-linecap="round"/>
      <path d="M446 208 h168 l34 44 v102 H446 Z" fill="#fef3c7" stroke="${orange}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M482 276 H616 M482 314 H586" stroke="#92400e" stroke-width="13" stroke-linecap="round"/>
      ${focusObject}`,
    device: `
      <rect x="210" y="132" width="330" height="178" rx="24" fill="#0f172a"/>
      <rect x="236" y="158" width="278" height="118" rx="16" fill="#bae6fd"/>
      <path d="M332 310 h86 l18 46 H314 Z" fill="#334155"/><rect x="276" y="356" width="196" height="22" rx="11" fill="#64748b"/>
      <rect x="576" y="198" width="116" height="132" rx="22" fill="#ffffff" stroke="#38bdf8" stroke-width="10"/>
      <rect x="598" y="230" width="72" height="36" rx="10" fill="${accent}"/><circle cx="634" cy="300" r="14" fill="#0f172a"/>
      ${focusObject}`,
    office: `
      <rect x="216" y="118" width="180" height="236" rx="18" fill="#0ea5e9"/>
      <rect x="428" y="156" width="236" height="198" rx="18" fill="${accent}"/>
      <g fill="#e0f2fe"><rect x="246" y="154" width="38" height="34" rx="8"/><rect x="320" y="154" width="38" height="34" rx="8"/><rect x="246" y="220" width="38" height="34" rx="8"/><rect x="320" y="220" width="38" height="34" rx="8"/><rect x="466" y="192" width="42" height="34" rx="8"/><rect x="544" y="192" width="42" height="34" rx="8"/><rect x="466" y="258" width="42" height="34" rx="8"/><rect x="544" y="258" width="42" height="34" rx="8"/></g>
      <rect x="294" y="292" width="54" height="62" rx="12" fill="#082f49"/><rect x="520" y="292" width="58" height="62" rx="12" fill="#082f49"/>
      ${focusObject}`,
    travel: `
      <path d="M178 210 L640 112 C682 104 698 144 662 166 L492 242 L576 322 L536 350 L414 280 L258 338 L222 306 L350 230 L188 238 Z" fill="#38bdf8" stroke="#075985" stroke-width="8" stroke-linejoin="round"/>
      <rect x="248" y="330" width="150" height="88" rx="24" fill="${orange}"/><path d="M292 330 v-26 h62 v26" fill="none" stroke="#92400e" stroke-width="12" stroke-linecap="round"/>
      <circle cx="284" cy="424" r="14" fill="#0f172a"/><circle cx="362" cy="424" r="14" fill="#0f172a"/>
      ${focusObject}`,
    food: `
      <ellipse cx="450" cy="286" rx="228" ry="82" fill="#ffffff" stroke="#38bdf8" stroke-width="12"/>
      <circle cx="370" cy="258" r="56" fill="#ef4444"/><path d="M370 204 c24 -40 60 -38 82 -8 c-42 2 -68 12 -82 8Z" fill="#22c55e"/>
      <rect x="482" y="216" width="112" height="118" rx="24" fill="#fef3c7"/><path d="M482 250 h112" stroke="#f59e0b" stroke-width="12"/>
      <path d="M248 168 v166 M278 168 v166 M248 230 h62" stroke="#64748b" stroke-width="12" stroke-linecap="round"/>
      ${focusObject}`,
    animal: `
      <ellipse cx="440" cy="292" rx="150" ry="86" fill="${accent}"/>
      <circle cx="318" cy="238" r="64" fill="${accent}"/>
      <circle cx="296" cy="224" r="10" fill="#0f172a"/><circle cx="340" cy="224" r="10" fill="#0f172a"/>
      <path d="M318 246 q18 18 36 0" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
      <path d="M554 276 l96 -58 l-24 86 l48 80 l-108 -34" fill="#22c55e"/>
      <g fill="#0f172a"><circle cx="374" cy="376" r="20"/><circle cx="510" cy="376" r="20"/></g>
      ${focusObject}`,
    education: `
      <path d="M218 172 h214 c44 0 72 26 72 68 v144 H290 c-44 0 -72 -26 -72 -68 Z" fill="#ffffff" stroke="#38bdf8" stroke-width="12"/>
      <path d="M504 172 h168 v212 H504 Z" fill="#fef3c7" stroke="${orange}" stroke-width="12"/>
      <path d="M266 230 h160 M266 274 h132 M540 230 h92 M540 274 h106" stroke="#475569" stroke-width="13" stroke-linecap="round"/>
      <path d="M208 120 l420 -30 l36 46 l-420 30 Z" fill="${accent}"/>
      ${focusObject}`,
    finance: `
      <rect x="206" y="174" width="430" height="196" rx="30" fill="#dcfce7" stroke="#16a34a" stroke-width="12"/>
      <circle cx="420" cy="272" r="70" fill="#22c55e"/><text x="420" y="302" text-anchor="middle" font-family="Inter, Arial" font-size="82" font-weight="900" fill="#fff">$</text>
      <rect x="562" y="134" width="100" height="82" rx="18" fill="#fef3c7" stroke="#f59e0b" stroke-width="10"/>
      ${focusObject}`,
    communication: `
      <rect x="212" y="150" width="306" height="172" rx="34" fill="#ffffff" stroke="#38bdf8" stroke-width="12"/>
      <path d="M236 192 l130 82 l128 -82" fill="none" stroke="#0f172a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="568" y="198" width="104" height="146" rx="28" fill="#0f172a"/><rect x="590" y="222" width="60" height="88" rx="12" fill="#bae6fd"/>
      ${focusObject}`,
    health: `
      <rect x="270" y="146" width="330" height="210" rx="38" fill="#ffffff" stroke="#38bdf8" stroke-width="12"/>
      <path d="M432 194 v112 M376 250 h112" stroke="#ef4444" stroke-width="30" stroke-linecap="round"/>
      <circle cx="636" cy="196" r="44" fill="#dcfce7"/><path d="M612 194 h48" stroke="#16a34a" stroke-width="14" stroke-linecap="round"/>
      ${focusObject}`,
    logistics: `
      <rect x="190" y="218" width="290" height="112" rx="22" fill="#38bdf8"/><rect x="480" y="250" width="126" height="80" rx="18" fill="${orange}"/>
      <rect x="232" y="154" width="120" height="80" rx="18" fill="#fef3c7" stroke="#f59e0b" stroke-width="10"/>
      <circle cx="266" cy="346" r="28" fill="#0f172a"/><circle cx="546" cy="346" r="28" fill="#0f172a"/>
      ${focusObject}`,
    nature: `
      <circle cx="650" cy="146" r="54" fill="#fde047"/>
      <rect x="284" y="236" width="58" height="138" rx="18" fill="#92400e"/><circle cx="260" cy="226" r="64" fill="#22c55e"/><circle cx="346" cy="206" r="70" fill="#16a34a"/><circle cx="416" cy="236" r="58" fill="#15803d"/>
      <path d="M190 356 c108 -40 198 -38 288 0 c92 40 170 42 236 -12" fill="none" stroke="#38bdf8" stroke-width="26" stroke-linecap="round"/>
      ${focusObject}`,
    concept: `
      <circle cx="314" cy="222" r="84" fill="${accent}" opacity=".9"/>
      <path d="M314 168 v108 M260 222 h108" stroke="#ffffff" stroke-width="22" stroke-linecap="round"/>
      <rect x="438" y="156" width="248" height="172" rx="30" fill="#ffffff" stroke="#38bdf8" stroke-width="10"/>
      <path d="M484 214 H636 M484 260 H604" stroke="#475569" stroke-width="16" stroke-linecap="round"/>
      <path d="M442 332 c66 -30 142 -30 220 0" fill="none" stroke="#22c55e" stroke-width="18" stroke-linecap="round"/>
      ${focusObject}`,
  };

  return scenes[kind];
}

function renderVocabularyFocusObject(word: string, meaning: string, kind: VocabularyVisualKind, hue: number) {
  const normalized = word.toLowerCase().trim();
  const safeLabel = encodeXml(word.length > 12 ? word.slice(0, 12) : word);
  const accent = `hsl(${hue}, 78%, 58%)`;
  const panel = `<rect x="570" y="108" width="150" height="150" rx="30" fill="#ffffff" opacity=".96" stroke="#bae6fd" stroke-width="6"/>`;
  const label = `<text x="645" y="286" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="900" fill="#0f172a">${safeLabel}</text>`;

  const exact: Record<string, string> = {
    agenda: `${panel}<rect x="602" y="136" width="86" height="96" rx="14" fill="#dbeafe" stroke="#0284c7" stroke-width="8"/><path d="M620 166 H670 M620 194 H662 M620 220 H652" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>${label}`,
    appointment: `${panel}<circle cx="645" cy="181" r="48" fill="#fef3c7" stroke="#f59e0b" stroke-width="8"/><path d="M645 154 v30 l24 18" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/>${label}`,
    deadline: `${panel}<rect x="604" y="136" width="82" height="92" rx="14" fill="#fee2e2" stroke="#ef4444" stroke-width="8"/><text x="646" y="204" text-anchor="middle" font-family="Inter, Arial" font-size="58" font-weight="900" fill="#ef4444">!</text>${label}`,
    schedule: `${panel}<rect x="604" y="134" width="84" height="100" rx="14" fill="#ecfeff" stroke="#06b6d4" stroke-width="8"/><path d="M622 164 H670 M622 190 H670 M622 216 H654" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>${label}`,
    calendar: `${panel}<rect x="602" y="134" width="88" height="102" rx="16" fill="#fff" stroke="#38bdf8" stroke-width="8"/><rect x="602" y="134" width="88" height="30" rx="14" fill="${accent}"/><g fill="#bae6fd"><rect x="618" y="178" width="16" height="16" rx="4"/><rect x="646" y="178" width="16" height="16" rx="4"/><rect x="618" y="204" width="16" height="16" rx="4"/><rect x="646" y="204" width="16" height="16" rx="4"/></g>${label}`,
    boardroom: `${panel}<ellipse cx="645" cy="192" rx="56" ry="28" fill="#c084fc"/><g fill="#0f172a"><circle cx="602" cy="164" r="12"/><circle cx="688" cy="164" r="12"/><circle cx="604" cy="222" r="12"/><circle cx="686" cy="222" r="12"/></g>${label}`,
    briefing: `${panel}<path d="M610 190 h54 l34 -28 v84 l-34 -28 h-54 z" fill="#38bdf8" stroke="#075985" stroke-width="7" stroke-linejoin="round"/><path d="M610 218 l-12 28" stroke="#075985" stroke-width="8" stroke-linecap="round"/>${label}`,
    chairperson: `${panel}<circle cx="645" cy="158" r="28" fill="#0f172a"/><rect x="606" y="190" width="78" height="58" rx="24" fill="${accent}"/><path d="M612 226 h66" stroke="#fff" stroke-width="8" stroke-linecap="round"/>${label}`,
    committee: `${panel}<g fill="#0f172a"><circle cx="612" cy="166" r="18"/><circle cx="646" cy="150" r="20"/><circle cx="680" cy="166" r="18"/></g><g fill="${accent}"><rect x="590" y="194" width="44" height="44" rx="16"/><rect x="620" y="180" width="52" height="58" rx="18"/><rect x="660" y="194" width="44" height="44" rx="16"/></g>${label}`,
    conference: `${panel}<rect x="604" y="142" width="84" height="50" rx="12" fill="#dbeafe" stroke="#0284c7" stroke-width="7"/><rect x="624" y="204" width="44" height="42" rx="12" fill="${accent}"/><path d="M646 192 v12" stroke="#0f172a" stroke-width="8"/>${label}`,
    meeting: `${panel}<ellipse cx="645" cy="204" rx="58" ry="24" fill="#bae6fd"/><g fill="#0f172a"><circle cx="610" cy="176" r="14"/><circle cx="646" cy="166" r="14"/><circle cx="682" cy="176" r="14"/></g>${label}`,
    training: `${panel}<rect x="598" y="134" width="96" height="62" rx="12" fill="#ecfeff" stroke="#06b6d4" stroke-width="7"/><path d="M618 164 h56 M618 184 h38" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/><circle cx="624" cy="226" r="20" fill="${accent}"/><path d="M650 226 h38" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>${label}`,
    workshop: `${panel}<rect x="600" y="150" width="92" height="78" rx="16" fill="#fef3c7" stroke="#f59e0b" stroke-width="8"/><path d="M620 178 h52 M620 204 h30" stroke="#92400e" stroke-width="8" stroke-linecap="round"/>${label}`,
    assistant: `${panel}<circle cx="626" cy="158" r="24" fill="#0f172a"/><rect x="598" y="188" width="56" height="58" rx="20" fill="${accent}"/><rect x="658" y="168" width="38" height="76" rx="12" fill="#dbeafe" stroke="#0284c7" stroke-width="7"/>${label}`,
    colleague: `${panel}<g fill="#0f172a"><circle cx="620" cy="162" r="23"/><circle cx="672" cy="162" r="23"/></g><g fill="${accent}"><rect x="590" y="194" width="60" height="54" rx="20"/><rect x="642" y="194" width="60" height="54" rx="20"/></g>${label}`,
    employee: `${panel}<rect x="602" y="140" width="88" height="104" rx="18" fill="#fff" stroke="#38bdf8" stroke-width="8"/><circle cx="646" cy="174" r="20" fill="#0f172a"/><path d="M622 218 h48" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>${label}`,
    manager: `${panel}<circle cx="626" cy="158" r="24" fill="#0f172a"/><rect x="596" y="190" width="60" height="58" rx="20" fill="${accent}"/><path d="M666 220 h34 M682 186 v34" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/>${label}`,
    secretary: `${panel}<circle cx="624" cy="156" r="22" fill="#0f172a"/><rect x="596" y="184" width="58" height="54" rx="18" fill="${accent}"/><rect x="656" y="150" width="42" height="88" rx="12" fill="#fff" stroke="#38bdf8" stroke-width="7"/>${label}`,
    supervisor: `${panel}<circle cx="646" cy="154" r="26" fill="#0f172a"/><rect x="610" y="188" width="72" height="58" rx="22" fill="${accent}"/><path d="M604 138 l42 -20 l42 20" fill="none" stroke="#f59e0b" stroke-width="9" stroke-linecap="round"/>${label}`,
    teamwork: `${panel}<g fill="#0f172a"><circle cx="610" cy="170" r="17"/><circle cx="646" cy="154" r="17"/><circle cx="682" cy="170" r="17"/></g><path d="M610 212 h72 M626 230 h40" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>${label}`,
    document: `${panel}<path d="M610 136 h56 l28 32 v76 h-84 z" fill="#fff" stroke="#38bdf8" stroke-width="8"/><path d="M666 136 v34 h28" fill="#dbeafe"/><path d="M626 188 h48 M626 214 h34" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>${label}`,
    file: `${panel}<path d="M594 168 h44 l16 18 h44 v58 H594 z" fill="#fef3c7" stroke="#f59e0b" stroke-width="8" stroke-linejoin="round"/><path d="M612 212 h66" stroke="#92400e" stroke-width="8" stroke-linecap="round"/>${label}`,
    folder: `${panel}<path d="M590 164 h48 l18 20 h48 v62 H590 z" fill="#fde68a" stroke="#f59e0b" stroke-width="8" stroke-linejoin="round"/>${label}`,
    form: `${panel}<rect x="606" y="136" width="84" height="108" rx="14" fill="#fff" stroke="#38bdf8" stroke-width="8"/><path d="M624 166 h44 M624 194 h44 M624 222 h30" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/><circle cx="616" cy="166" r="5" fill="${accent}"/><circle cx="616" cy="194" r="5" fill="${accent}"/>${label}`,
    memo: `${panel}<rect x="604" y="146" width="88" height="92" rx="14" fill="#fef3c7" stroke="#f59e0b" stroke-width="8"/><path d="M624 178 h46 M624 204 h36" stroke="#92400e" stroke-width="8" stroke-linecap="round"/>${label}`,
    paperwork: `${panel}<g stroke-width="7"><path d="M604 150 h72 v82 h-72z" fill="#fff" stroke="#38bdf8"/><path d="M626 134 h72 v82 h-72z" fill="#f8fafc" stroke="#94a3b8"/></g><path d="M640 170 h38 M640 194 h32" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>${label}`,
    proposal: `${panel}<rect x="606" y="138" width="84" height="104" rx="14" fill="#fff" stroke="#22c55e" stroke-width="8"/><path d="M624 182 l18 18 l38 -48" fill="none" stroke="#16a34a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>${label}`,
    report: `${panel}<rect x="604" y="138" width="88" height="108" rx="14" fill="#fff" stroke="#38bdf8" stroke-width="8"/><rect x="624" y="204" width="12" height="24" fill="${accent}"/><rect x="646" y="182" width="12" height="46" fill="#22c55e"/><rect x="668" y="160" width="12" height="68" fill="#f59e0b"/>${label}`,
    desk: `${panel}<rect x="596" y="194" width="100" height="28" rx="10" fill="#92400e"/><path d="M612 222 v34 M680 222 v34" stroke="#92400e" stroke-width="10" stroke-linecap="round"/><path d="M622 178 h42" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/><circle cx="690" cy="170" r="18" fill="#fde047"/>${label}`,
    equipment: `${panel}<path d="M612 150 l44 44 M656 150 l-44 44" stroke="#0f172a" stroke-width="12" stroke-linecap="round"/><rect x="640" y="204" width="54" height="42" rx="12" fill="${accent}"/><circle cx="622" cy="224" r="18" fill="#38bdf8"/>${label}`,
    extension: `${panel}<rect x="612" y="136" width="72" height="108" rx="18" fill="#0f172a"/><rect x="628" y="156" width="40" height="24" rx="8" fill="#bae6fd"/><g fill="#fff"><circle cx="630" cy="198" r="5"/><circle cx="648" cy="198" r="5"/><circle cx="666" cy="198" r="5"/><circle cx="630" cy="218" r="5"/><circle cx="648" cy="218" r="5"/><circle cx="666" cy="218" r="5"/></g>${label}`,
    monitor: `${panel}<rect x="600" y="142" width="94" height="70" rx="12" fill="#0f172a"/><rect x="616" y="156" width="62" height="38" rx="8" fill="#bae6fd"/><path d="M646 212 v22 M620 236 h52" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>${label}`,
    printer: `${panel}<rect x="604" y="166" width="88" height="68" rx="14" fill="#f8fafc" stroke="#64748b" stroke-width="8"/><rect x="620" y="132" width="56" height="46" rx="8" fill="#fff" stroke="#38bdf8" stroke-width="7"/><path d="M626 212 h44" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>${label}`,
    projector: `${panel}<rect x="602" y="174" width="90" height="54" rx="16" fill="#0f172a"/><circle cx="630" cy="202" r="18" fill="#38bdf8"/><path d="M688 196 l42 -24 v60 l-42 -24" fill="#bae6fd"/>${label}`,
    telephone: `${panel}<path d="M606 184 c28 -34 64 -34 92 0 l-18 20 c-20 -16 -34 -16 -54 0z" fill="#0f172a"/><rect x="624" y="206" width="46" height="36" rx="10" fill="${accent}"/>${label}`,
    headquarters: `${panel}<rect x="608" y="124" width="78" height="126" rx="12" fill="#0ea5e9"/><g fill="#e0f2fe"><rect x="626" y="146" width="14" height="14"/><rect x="654" y="146" width="14" height="14"/><rect x="626" y="176" width="14" height="14"/><rect x="654" y="176" width="14" height="14"/><rect x="626" y="206" width="14" height="14"/><rect x="654" y="206" width="14" height="14"/></g>${label}`,
    office: `${panel}<rect x="604" y="150" width="92" height="80" rx="14" fill="#e0f2fe" stroke="#38bdf8" stroke-width="8"/><rect x="626" y="196" width="38" height="34" rx="8" fill="#0f172a"/><path d="M618 174 h60" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>${label}`,
    reception: `${panel}<rect x="596" y="204" width="100" height="42" rx="12" fill="#38bdf8"/><circle cx="646" cy="166" r="24" fill="#0f172a"/><rect x="618" y="190" width="56" height="34" rx="16" fill="${accent}"/>${label}`,
    workplace: `${panel}<rect x="596" y="154" width="98" height="86" rx="16" fill="#dbeafe" stroke="#38bdf8" stroke-width="8"/><circle cx="626" cy="198" r="14" fill="#0f172a"/><rect x="650" y="182" width="28" height="34" rx="8" fill="${accent}"/>${label}`,
    airport: `${panel}<path d="M596 196 l94 -58 c16 -10 30 10 16 22 l-44 38 l34 34 l-20 14 l-48 -28 l-38 20 z" fill="#38bdf8" stroke="#075985" stroke-width="7" stroke-linejoin="round"/>${label}`,
    luggage: `${panel}<rect x="608" y="158" width="76" height="80" rx="18" fill="${accent}"/><path d="M626 158 v-24 h40 v24" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/><circle cx="626" cy="250" r="7" fill="#0f172a"/><circle cx="666" cy="250" r="7" fill="#0f172a"/>${label}`,
    passport: `${panel}<rect x="614" y="136" width="64" height="108" rx="12" fill="#1d4ed8"/><circle cx="646" cy="188" r="24" fill="none" stroke="#bfdbfe" stroke-width="6"/><path d="M624 222 h44" stroke="#bfdbfe" stroke-width="8" stroke-linecap="round"/>${label}`,
    ticket: `${panel}<path d="M598 172 h96 v22 c-20 0 -20 30 0 30 v22 h-96 v-22 c20 0 20 -30 0 -30z" fill="#fef3c7" stroke="#f59e0b" stroke-width="8"/><path d="M626 194 h38" stroke="#92400e" stroke-width="7" stroke-linecap="round"/>${label}`,
  };

  if (exact[normalized]) return exact[normalized];

  if (kind === 'concept') {
    const initial = encodeXml((word.trim()[0] ?? 'E').toUpperCase());
    return `${panel}<circle cx="645" cy="184" r="52" fill="${accent}"/><text x="645" y="210" text-anchor="middle" font-family="Inter, Arial" font-size="70" font-weight="900" fill="#fff">${initial}</text>${label}`;
  }

  return `${panel}<circle cx="645" cy="176" r="46" fill="${accent}"/><path d="M620 206 h50 M630 228 h32" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/><text x="645" y="192" text-anchor="middle" font-family="Inter, Arial" font-size="36" font-weight="900" fill="#fff">${encodeXml((meaning.trim()[0] ?? word.trim()[0] ?? 'E').toUpperCase())}</text>${label}`;
}

function encodeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function TopicSmartImage({
  word,
  meaning,
  example,
  src,
  wordType,
}: {
  word: string;
  meaning: string;
  example?: string | null;
  src?: string | null;
  wordType?: string | null;
}) {
  const visualKind = useMemo(() => resolveVocabularyVisualKind(word, meaning, wordType), [meaning, word, wordType]);
  const fallbackSrc = useMemo(() => buildVocabularyFallbackImage(word, meaning, wordType), [meaning, word, wordType]);
  const imageSource = useMemo(() => resolveApiAssetUrl(src) ?? fallbackSrc, [fallbackSrc, src]);
  const [imageSrc, setImageSrc] = useState(imageSource);

  useEffect(() => {
    setImageSrc(imageSource);

    return undefined;
  }, [imageSource]);

  return (
    <figure className={`topicLearningVisual ${visualKind}`}>
      <img
        className="topicLearningImage"
        src={imageSrc}
        alt={`${word} - ${meaning}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImageSrc(fallbackSrc)}
      />
      <figcaption className="topicLearningCaption">
        <strong>{word}</strong>
        <span>{meaning}</span>
      </figcaption>
    </figure>
  );
}

export default function TopicLearnPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const lessonId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentenceDrafts, setSentenceDrafts] = useState<Record<string, string>>({});
  const [sentenceResults, setSentenceResults] = useState<Record<string, { score: number; feedback: string; accepted: boolean }>>({});

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  useEffect(() => {
    if (!session || !lessonId) return;
    const currentSession = session;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        if (isLibraryTopicId(lessonId)) {
          const libraryLesson = getLibraryLessonDetail(lessonId);
          if (active && libraryLesson) setLesson(libraryLesson);
          return;
        }
        const response = await apiGet<LessonDetail>(`/lessons/${lessonId}`, currentSession.accessToken);
        if (active) setLesson(response);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được chủ đề.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [lessonId, router, session]);

  const topicMeta = useMemo(
    () =>
      lesson
        ? resolveVocabularyTopic({
            title: lesson.title,
            description: lesson.description,
            topicName: lesson.topicName,
            stageName: lesson.stageName,
            content: lesson.content,
          })
        : null,
    [lesson],
  );
  const expandedVocabulary = useMemo(
    () => (isLibraryTopicId(lessonId) ? lesson?.vocabularies ?? [] : mergeTopicVocabulary(lesson?.vocabularies, topicMeta)),
    [lesson?.vocabularies, lessonId, topicMeta],
  );
  function evaluateSentence(vocabulary: { id: string; word: string; example?: string | null }) {
    const draft = (sentenceDrafts[vocabulary.id] ?? '').trim();
    if (!draft) {
      setSentenceResults((current) => ({
        ...current,
        [vocabulary.id]: { score: 0, accepted: false, feedback: 'Hãy viết một câu tiếng Anh có dùng từ này.' },
      }));
      return;
    }

    const normalizedDraft = draft.toLowerCase();
    const wordTokens = vocabulary.word.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
    const mainToken = wordTokens[0] ?? vocabulary.word.toLowerCase();
    const containsWord = normalizedDraft.includes(vocabulary.word.toLowerCase()) || normalizedDraft.includes(mainToken);
    const wordCount = draft.split(/\s+/).filter(Boolean).length;
    const hasCapital = /^[A-Z]/.test(draft);
    const hasPunctuation = /[.!?]$/.test(draft);
    const followsExampleShape = vocabulary.example
      ? vocabulary.example
          .toLowerCase()
          .split(/\s+/)
          .filter((token) => token.length > 3)
          .some((token) => normalizedDraft.includes(token))
      : false;

    const score =
      (containsWord ? 45 : 0) +
      (wordCount >= 5 ? 25 : wordCount >= 3 ? 12 : 0) +
      (hasCapital ? 10 : 0) +
      (hasPunctuation ? 10 : 0) +
      (followsExampleShape ? 10 : 0);

    const feedback = containsWord
      ? score >= 80
        ? 'Tốt. Câu có từ mục tiêu, đủ ngữ cảnh và trình bày ổn.'
        : 'Đã dùng đúng từ. Hãy thêm ngữ cảnh rõ hơn, viết đủ câu và kết thúc bằng dấu câu.'
      : `Câu cần có từ “${vocabulary.word}” hoặc dạng rất gần của từ đó.`;

    setSentenceResults((current) => ({
      ...current,
      [vocabulary.id]: { score: Math.min(score, 100), accepted: containsWord && score >= 60, feedback },
    }));
  }

  function logout() {
    clearStoredSession();
    router.replace('/login');
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở màn học...</p>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone lessonDetailStandalone topicLearnStandalone">
      <header className="studentUcTopbar">
        <div>
          <p className="eyebrow">Học từ vựng theo chủ đề</p>
          <h1>Màn học từ vựng</h1>
        </div>
        <div className="topbarActions">
          <ThemeToggleButton />
          <button className="secondaryButton" type="button" onClick={logout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <section className="topicLearnHero">
        <div>
          <Link className="backLink" href="/lessons">
            <ArrowLeft size={16} />
            Về danh sách chủ đề
          </Link>
          <p className="eyebrow">{topicMeta?.categoryLabel ?? 'Vocabulary topic'}</p>
          <h2>{topicMeta ? `${topicMeta.englishLabel} - ${topicMeta.label}` : 'Đang tải chủ đề...'}</h2>
          <p>{topicMeta?.context ?? 'Học từ vựng theo hình ảnh, âm thanh và ngữ cảnh.'}</p>
        </div>
        <div className="topicLearnHeroStats">
          <span>{expandedVocabulary.length} từ</span>
          <span>{lesson?.progressPercent ?? lesson?.progress?.percentComplete ?? 0}% tiến độ</span>
          {lesson ? (
            <Link className="primaryButton" href={`/lessons/${lesson.id}/game`}>
              Chơi game chủ đề
              <Sparkles size={16} />
            </Link>
          ) : null}
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải dữ liệu học...</div> : null}

      {lesson ? (
        <>
          <section className="topicContextPanel">
            <div>
              <p className="eyebrow">Ngữ cảnh chủ đề</p>
              <h2>Học từ vựng trong chủ đề</h2>
              <p>{lesson.content}</p>
            </div>
            <SpeechButton className="primaryButton" text={lesson.content} label="Nghe ngữ cảnh" />
          </section>

          <section className="topicVocabularyBoard">
            {expandedVocabulary.map((item) => (
              <article className="topicVocabularyCard" key={item.id}>
                <TopicSmartImage
                  word={item.word}
                  meaning={item.meaning}
                  example={item.example}
                  src={item.imageUrl}
                  wordType={item.wordType}
                />
                <div className="topicVocabularyBody">
                  <div className="vocabHead">
                    <div>
                      <strong>{item.word}</strong>
                      <span>
                        {item.phonetic ?? '--'} {item.wordType ? `• ${item.wordType}` : ''}
                      </span>
                    </div>
                    <SpeechButton text={item.word} audioUrl={item.audioUrl} label="Nghe từ" />
                  </div>
                  <p>{item.meaning}</p>
                  {item.example ? (
                    <div className="vocabExample">
                      <span>{item.example}</span>
                      {item.exampleMeaning ? <small>{item.exampleMeaning}</small> : null}
                      <SpeechButton text={item.example} label="Nghe câu" />
                    </div>
                  ) : null}
                  <div className="inlineSentencePractice">
                    <label className="sentenceInputBox">
                      <span>Đặt câu với “{item.word}”</span>
                      <textarea
                        value={sentenceDrafts[item.id] ?? ''}
                        onChange={(event) =>
                          setSentenceDrafts((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder={`Ví dụ: ${item.example ?? `I can use ${item.word} in a sentence.`}`}
                        rows={3}
                      />
                    </label>

                    <div className="sentenceActionRow">
                      <button className="primaryButton" type="button" onClick={() => evaluateSentence(item)}>
                        Kiểm tra câu
                      </button>
                      <SpeechButton
                        className="secondaryButton"
                        text={sentenceDrafts[item.id] || item.example || item.word}
                        label="Nghe câu của tôi"
                      />
                    </div>

                    {sentenceResults[item.id] ? (
                      <div className={`sentenceFeedback ${sentenceResults[item.id].accepted ? 'accepted' : ''}`}>
                        <strong>{sentenceResults[item.id].score}%</strong>
                        <span>{sentenceResults[item.id].feedback}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>

        </>
      ) : null}
    </main>
  );
}
