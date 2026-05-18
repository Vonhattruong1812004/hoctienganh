'use client';

import { ArrowLeft, CheckCircle2, Gamepad2, LogOut, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../../components/theme-toggle';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';
import { getToeicGrammarEnhancement, getToeicGrammarTopic } from '../../../lib/toeic-grammar-library';

export default function GrammarTopicPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const topicId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const topic = useMemo(() => (topicId ? getToeicGrammarTopic(topicId) : null), [topicId]);
  const enhancement = useMemo(() => (topicId ? getToeicGrammarEnhancement(topicId) : null), [topicId]);
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [round, setRound] = useState(1);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  const answeredCount = topic?.questions.filter((question) => answers[question.id]).length ?? 0;
  const correctCount =
    topic?.questions.filter((question) => answers[question.id] && answers[question.id] === question.answer).length ?? 0;
  const score = topic?.questions.length ? Math.round((correctCount / topic.questions.length) * 100) : 0;
  const completed = Boolean(topic && answeredCount === topic.questions.length);

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  if (!topic) {
    return (
      <main className="studentUcStandalone">
        <Link className="secondaryButton" href="/grammar">
          <ArrowLeft size={16} />
          Về danh sách ngữ pháp
        </Link>
        <div className="errorBox dashboardMessage">Không tìm thấy topic ngữ pháp.</div>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone grammarTopicPage">
      <header className="studentUcTopbar">
        <Link className="secondaryButton" href="/grammar">
          <ArrowLeft size={16} />
          Về danh sách ngữ pháp
        </Link>
        <div>
          <p className="eyebrow">TOEIC Grammar</p>
          <h1>{topic.vietnameseTitle}</h1>
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

      <section className="grammarTopicHero">
        <div>
          <p className="eyebrow">{topic.group}</p>
          <h2>{topic.title}</h2>
          <p>{topic.summary}</p>
          <div className="grammarTopicMeta">
            <span>{topic.level}</span>
            {topic.partFocus.map((part) => (
              <span key={part}>{part}</span>
            ))}
          </div>
        </div>
        <div className="grammarScoreCard">
          <span>Game luyện tập</span>
          <strong>{score}%</strong>
          <small>
            {correctCount}/{topic.questions.length} câu đúng
          </small>
        </div>
      </section>

      <section className="grammarStudyGrid">
        <article className="grammarStudyPanel">
          <p className="eyebrow">Công thức</p>
          <h2>Mẫu câu cần nhớ</h2>
          <div className="grammarPatternList">
            {topic.patterns.map((pattern) => (
              <span key={pattern}>{pattern}</span>
            ))}
          </div>
        </article>

        <article className="grammarStudyPanel">
          <p className="eyebrow">Quy tắc</p>
          <h2>Cách xử lý trong TOEIC</h2>
          <ul className="grammarRuleList">
            {topic.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grammarStudyGrid">
        <article className="grammarStudyPanel">
          <p className="eyebrow">Ví dụ công sở</p>
          <h2>Học trong ngữ cảnh TOEIC</h2>
          <div className="grammarExampleList">
            {topic.examples.map((example) => (
              <div className="grammarExampleCard" key={example.sentence}>
                <strong>{example.sentence}</strong>
                <span>{example.meaning}</span>
                <small>{example.note}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="grammarStudyPanel trap">
          <p className="eyebrow">Bẫy thường gặp</p>
          <h2>Điểm dễ mất điểm</h2>
          <ul className="grammarRuleList">
            {topic.toeicTraps.map((trap) => (
              <li key={trap}>{trap}</li>
            ))}
          </ul>
        </article>
      </section>

      {enhancement ? (
        <section className="grammarDeepDiveGrid">
          <article className="grammarStudyPanel grammarDeepDivePanel">
            <p className="eyebrow">Dấu hiệu TOEIC</p>
            <h2>Nhận diện nhanh trong đề</h2>
            <ul className="grammarRuleList">
              {enhancement.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </article>

          <article className="grammarStudyPanel grammarDeepDivePanel">
            <p className="eyebrow">Quy trình chọn đáp án</p>
            <h2>Làm theo từng bước</h2>
            <ol className="grammarStepList">
              {enhancement.decisionSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="grammarStudyPanel grammarDeepDivePanel trap">
            <p className="eyebrow">Lỗi sai hay gặp</p>
            <h2>Tránh mất điểm</h2>
            <ul className="grammarRuleList">
              {enhancement.commonMistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </article>

          <article className="grammarStudyPanel grammarDeepDivePanel">
            <p className="eyebrow">Mẫu câu công sở</p>
            <h2>Áp dụng vào TOEIC</h2>
            <div className="grammarPatternList">
              {enhancement.businessFrames.map((frame) => (
                <span key={frame}>{frame}</span>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <section className="grammarGamePanel" key={round}>
        <div className="grammarGameHead">
          <div>
            <p className="eyebrow">Game luyện ngữ pháp</p>
            <h2>
              <Gamepad2 size={24} />
              Chọn đáp án đúng kiểu TOEIC Part 5/6
            </h2>
            <p>Trả lời xong sẽ thấy giải thích ngay để học viên hiểu vì sao đúng, không chỉ đoán đáp án.</p>
          </div>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              setAnswers({});
              setRound((current) => current + 1);
            }}
          >
            <RefreshCw size={16} />
            Chơi lại
          </button>
        </div>

        <div className="grammarProgressLine">
          <span style={{ width: `${Math.round((answeredCount / topic.questions.length) * 100)}%` }} />
        </div>

        <div className="grammarQuestionList">
          {topic.questions.map((question, index) => {
            const selected = answers[question.id];
            const isCorrect = selected === question.answer;
            return (
              <article className={`grammarQuestionCard ${selected ? (isCorrect ? 'correct' : 'wrong') : ''}`} key={question.id}>
                <div className="grammarQuestionPrompt">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{question.prompt}</strong>
                </div>
                <div className="grammarChoiceGrid">
                  {question.choices.map((choice) => (
                    <button
                      className={selected === choice ? 'selected' : ''}
                      type="button"
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: choice }))}
                      key={choice}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {selected ? (
                  <div className="grammarFeedback">
                    {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>
                      {isCorrect ? 'Đúng.' : `Chưa đúng. Đáp án đúng: ${question.answer}.`} {question.explanation}
                    </span>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {completed ? (
          <div className={`grammarGameResult ${score >= 80 ? 'passed' : ''}`}>
            <Sparkles size={20} />
            <strong>{score >= 80 ? 'Đạt mục tiêu TOEIC topic này.' : 'Cần ôn lại quy tắc rồi chơi lại.'}</strong>
            <span>
              Điểm hiện tại: {score}% • {correctCount}/{topic.questions.length} câu đúng
            </span>
          </div>
        ) : null}
      </section>
    </main>
  );
}
