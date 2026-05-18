'use client';

import { ArrowLeft, BookOpenCheck, CheckSquare2, FileText, Headphones, LogOut, Mic2, PenLine, Play, Square } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { etsFullPartIds, getEtsDurationMinutes, getEtsPartsByIds, getEtsQuestionList, type EtsToeicType } from '../../lib/ets-attempt';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import { etsPracticeParts, etsPracticeTests } from '../../lib/ets-practice-library';

const speakingWritingParts = [
  { id: 'sw-1', label: 'Speaking 1-2', title: 'Read a text aloud', durationMinutes: 3, count: 2 },
  { id: 'sw-2', label: 'Speaking 3-4', title: 'Describe a picture', durationMinutes: 3, count: 2 },
  { id: 'sw-3', label: 'Speaking 5-7', title: 'Respond to questions', durationMinutes: 6, count: 3 },
  { id: 'sw-4', label: 'Speaking 8-10', title: 'Respond using information', durationMinutes: 7, count: 3 },
  { id: 'sw-5', label: 'Speaking 11', title: 'Express an opinion', durationMinutes: 5, count: 1 },
  { id: 'sw-6', label: 'Writing 1-5', title: 'Write a sentence based on a picture', durationMinutes: 8, count: 5 },
  { id: 'sw-7', label: 'Writing 6-7', title: 'Respond to a written request', durationMinutes: 20, count: 2 },
  { id: 'sw-8', label: 'Writing 8', title: 'Write an opinion essay', durationMinutes: 30, count: 1 },
];

export default function EtsPracticeSetupPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [testNumber, setTestNumber] = useState(1);
  const [toeicType, setToeicType] = useState<EtsToeicType>('lr');
  const [selectedParts, setSelectedParts] = useState<string[]>(etsFullPartIds);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  const chosenParts = useMemo(() => getEtsPartsByIds(selectedParts), [selectedParts]);
  const totalQuestions = useMemo(() => getEtsQuestionList(chosenParts).length, [chosenParts]);
  const totalMinutes = useMemo(() => getEtsDurationMinutes(chosenParts), [chosenParts]);
  const listeningCount = chosenParts.filter((part) => part.section === 'Listening').length;
  const readingCount = chosenParts.filter((part) => part.section === 'Reading').length;
  const canStart = toeicType === 'lr' && selectedParts.length > 0;
  const startHref = `/ets-practice/take?type=lr&test=${testNumber}&parts=${selectedParts.join(',')}`;

  function togglePart(partId: string) {
    setSelectedParts((current) => {
      if (current.includes(partId)) {
        const next = current.filter((id) => id !== partId);
        return next.length ? next : current;
      }
      return etsPracticeParts.filter((part) => [...current, partId].includes(part.id)).map((part) => part.id);
    });
  }

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  return (
    <main className="studentUcStandalone etsPracticePage etsPracticeSetupPage">
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

      <section className="etsPracticeHero etsSetupHero">
        <div>
          <p className="eyebrow">Chọn bài thi và Part</p>
          <h2>Vào phòng thi theo đúng phần bạn muốn luyện.</h2>
          <p>
            Chọn TOEIC Listening & Reading hoặc Speaking & Writing, tick các Part cần làm, hệ thống tự gom câu hỏi,
            audio, đề, answer sheet và thời gian đếm ngược trước khi chuyển sang màn làm bài.
          </p>
        </div>
        <div className="etsTimerCard">
          <FileText size={30} />
          <strong>{totalMinutes}</strong>
          <span>phút • {totalQuestions} câu đã chọn</span>
        </div>
      </section>

      <section className="etsPracticeControls etsSetupControls" aria-label="Chọn đề TOEIC">
        <label>
          <span>Bộ đề</span>
          <select value={testNumber} onChange={(event) => setTestNumber(Number(event.target.value))}>
            {etsPracticeTests.map((test) => (
              <option value={test.testNumber} key={test.id}>
                {test.title}
              </option>
            ))}
          </select>
        </label>

        <div className="etsModeSwitch">
          <button
            className={toeicType === 'lr' ? 'active' : ''}
            type="button"
            onClick={() => {
              setToeicType('lr');
              setSelectedParts(etsFullPartIds);
            }}
          >
            <Headphones size={17} />
            Listening & Reading
          </button>
          <button className={toeicType === 'sw' ? 'active' : ''} type="button" onClick={() => setToeicType('sw')}>
            <Mic2 size={17} />
            Speaking & Writing
          </button>
        </div>

        <div className="etsTimerActions">
          <button type="button" onClick={() => setSelectedParts(etsFullPartIds)} disabled={toeicType !== 'lr'}>
            <CheckSquare2 size={16} />
            Chọn full LR
          </button>
          {canStart ? (
            <Link className="primaryButton etsStartLink" href={startHref}>
              <Play size={17} />
              Làm bài
            </Link>
          ) : (
            <button type="button" disabled>
              <Play size={17} />
              Làm bài
            </button>
          )}
        </div>
      </section>

      {toeicType === 'lr' ? (
        <section className="etsPartPickerPanel">
          <div className="etsPanelHeading">
            <BookOpenCheck size={20} />
            <strong>TOEIC Listening & Reading</strong>
            <span>
              {listeningCount} Part nghe • {readingCount} Part đọc • thời gian tự tính theo phần đã chọn.
            </span>
          </div>

          <div className="etsPartPickerGrid">
            {etsPracticeParts.map((part) => {
              const active = selectedParts.includes(part.id);
              return (
                <button className={active ? 'active' : ''} type="button" onClick={() => togglePart(part.id)} key={part.id}>
                  <span>{active ? <CheckSquare2 size={18} /> : <Square size={18} />}</span>
                  <small>{part.section}</small>
                  <strong>
                    {part.label}: {part.title}
                  </strong>
                  <em>
                    Câu {part.from}-{part.to} • {part.durationMinutes} phút
                  </em>
                  <p>{part.direction}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="etsPartPickerPanel">
          <div className="etsPanelHeading">
            <PenLine size={20} />
            <strong>TOEIC Speaking & Writing</strong>
            <span>
              Cấu trúc bài đã hiển thị để người học hiểu luồng thi. Phần này cần bộ đề/audio chấm nói viết riêng trước
              khi bật làm bài thật.
            </span>
          </div>
          <div className="etsPartPickerGrid sw">
            {speakingWritingParts.map((part) => (
              <article key={part.id}>
                <small>{part.label}</small>
                <strong>{part.title}</strong>
                <em>
                  {part.count} nhiệm vụ • {part.durationMinutes} phút
                </em>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
