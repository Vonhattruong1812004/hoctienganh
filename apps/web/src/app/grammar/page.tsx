'use client';

import { ArrowLeft, BookOpenCheck, CheckCircle2, Filter, LogOut, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import { toeicGrammarGroups, toeicGrammarTopics } from '../../lib/toeic-grammar-library';

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function GrammarLibraryPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Tất cả');

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  const filteredTopics = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    return toeicGrammarTopics.filter((topic) => {
      const matchesGroup = group === 'Tất cả' || topic.group === group;
      const haystack = normalizeText(
        `${topic.title} ${topic.vietnameseTitle} ${topic.group} ${topic.summary} ${topic.partFocus.join(' ')}`,
      );
      return matchesGroup && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [group, query]);

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
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
        {filteredTopics.map((topic) => (
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
