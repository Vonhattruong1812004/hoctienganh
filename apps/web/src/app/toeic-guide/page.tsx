'use client';

import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  LogOut,
  Mic2,
  PenLine,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import { getToeicGuideTest, toeicGuideSources, toeicGuideTests, type ToeicGuidePart } from '../../lib/toeic-guide-library';

const testIcons = {
  'listening-reading': Headphones,
  'speaking-writing': Mic2,
} as const;

function sectionIcon(section: string) {
  if (section === 'Listening') return Headphones;
  if (section === 'Speaking') return Mic2;
  if (section === 'Writing') return PenLine;
  return BookOpenCheck;
}

export default function ToeicGuidePage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<'listening-reading' | 'speaking-writing'>('listening-reading');
  const [selectedPartId, setSelectedPartId] = useState('');

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  const selectedTest = useMemo(() => getToeicGuideTest(selectedTestId), [selectedTestId]);
  const selectedPart = useMemo<ToeicGuidePart>(
    () => selectedTest.parts.find((part) => part.id === selectedPartId) ?? selectedTest.parts[0],
    [selectedPartId, selectedTest],
  );

  useEffect(() => {
    setSelectedPartId(selectedTest.parts[0]?.id ?? '');
  }, [selectedTest]);

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  const TestIcon = testIcons[selectedTest.id];
  const PartIcon = sectionIcon(selectedPart.section);

  return (
    <main className="studentUcStandalone toeicGuidePage">
      <header className="studentUcTopbar">
        <Link className="secondaryButton" href="/dashboard">
          <ArrowLeft size={16} />
          Về dashboard
        </Link>
        <div>
          <p className="eyebrow">Học viên</p>
          <h1>Giới thiệu bài thi TOEIC</h1>
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

      <section className="toeicGuideHero">
        <div>
          <p className="eyebrow">TOEIC Test Orientation</p>
          <h2>Nắm cấu trúc bài thi trước khi luyện từng kỹ năng.</h2>
          <p>
            UC này giúp học viên hiểu rõ 2 nhóm bài thi TOEIC: Listening & Reading và Speaking & Writing. Mỗi Part có
            format, cách làm, mẹo điểm cao, bẫy thường gặp và kế hoạch luyện cụ thể.
          </p>
        </div>
        <div className="toeicGuideHeroCard">
          <Sparkles size={28} />
          <strong>2 bài thi</strong>
          <span>Listening/Reading + Speaking/Writing</span>
        </div>
      </section>

      <section className="toeicTestSwitch" aria-label="Chọn loại bài thi TOEIC">
        {toeicGuideTests.map((test) => {
          const Icon = testIcons[test.id];
          return (
            <button
              className={selectedTest.id === test.id ? 'active' : ''}
              type="button"
              onClick={() => setSelectedTestId(test.id)}
              key={test.id}
            >
              <Icon size={22} />
              <span>{test.vietnameseTitle}</span>
              <strong>{test.title}</strong>
            </button>
          );
        })}
      </section>

      <section className="toeicOverviewPanel">
        <div>
          <p className="eyebrow">{selectedTest.title}</p>
          <h2>{selectedTest.vietnameseTitle}</h2>
          <p>{selectedTest.overview}</p>
          <small>{selectedTest.sourceNote}</small>
        </div>
        <div className="toeicOverviewStats">
          <span>
            <Clock3 size={18} />
            {selectedTest.total}
          </span>
          <span>
            <Target size={18} />
            Thang điểm {selectedTest.scoreScale}
          </span>
          <span>
            <TestIcon size={18} />
            {selectedTest.parts.length} Part/Task
          </span>
        </div>
      </section>

      <section className="toeicGuideLayout">
        <aside className="toeicPartRail" aria-label="Danh sách Part TOEIC">
          {selectedTest.parts.map((part) => {
            const Icon = sectionIcon(part.section);
            return (
              <button
                className={selectedPart.id === part.id ? 'active' : ''}
                type="button"
                onClick={() => setSelectedPartId(part.id)}
                key={part.id}
              >
                <Icon size={18} />
                <span>{part.partLabel}</span>
                <strong>{part.title}</strong>
                <small>
                  {part.section} • {part.questions}
                </small>
              </button>
            );
          })}
        </aside>

        <article className="toeicPartDetail">
          <div className="toeicPartHead">
            <span className="toeicPartIcon">
              <PartIcon size={28} />
            </span>
            <div>
              <p className="eyebrow">
                {selectedPart.section} • {selectedPart.partLabel}
              </p>
              <h2>{selectedPart.title}</h2>
              <p>{selectedPart.officialFormat}</p>
            </div>
          </div>

          <div className="toeicPartStats">
            <span>{selectedPart.questions}</span>
            <span>{selectedPart.time}</span>
            <span>{selectedPart.goal}</span>
          </div>

          <div className="toeicGuideColumns">
            <GuideBlock title="Cách làm bài" items={selectedPart.howToDo} tone="blue" />
            <GuideBlock title="Mẹo điểm cao" items={selectedPart.highScoreTips} tone="green" />
            <GuideBlock title="Bẫy cần tránh" items={selectedPart.traps} tone="amber" />
            <GuideBlock title="Kế hoạch luyện" items={selectedPart.practicePlan} tone="violet" />
          </div>
        </article>
      </section>

      <section className="toeicSourcePanel">
        <div>
          <p className="eyebrow">Nguồn dữ liệu</p>
          <h2>Dữ liệu được tổng hợp theo format chính thức</h2>
        </div>
        <div className="toeicSourceList">
          {toeicGuideSources.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              {source.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function GuideBlock({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <section className={`toeicGuideBlock ${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircle2 size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
