'use client';

import type { ContentHubExploreResponse, ContentProviderState } from '@english-learning/shared';
import {
  ArrowLeftRight,
  BookOpen,
  Globe2,
  Image as ImageIcon,
  PencilLine,
  PlayCircle,
  Quote,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError, apiGet } from '../lib/api';
import { SpeechButton } from './speech-button';

type ContentHubPanelProps = {
  token?: string | null;
};

function getProviderTone(provider: ContentProviderState) {
  if (!provider.ready) return 'waiting';
  if (provider.category === 'TuVung') return 'vocab';
  if (provider.category === 'NguPhap') return 'grammar';
  if (provider.category === 'TriThuc') return 'knowledge';
  if (provider.category === 'Audio') return 'audio';
  return 'media';
}

export function ContentHubPanel({ token }: ContentHubPanelProps) {
  const [providers, setProviders] = useState<ContentProviderState[]>([]);
  const [query, setQuery] = useState('apple');
  const [text, setText] = useState('I has a apple in my bag.');
  const [result, setResult] = useState<ContentHubExploreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const readyCount = useMemo(() => providers.filter((provider) => provider.ready).length, [providers]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    async function loadSources() {
      try {
        const response = await apiGet<ContentProviderState[]>('/integrations/sources', token);
        if (active) setProviders(response);
      } catch {
        if (active) setProviders([]);
      }
    }

    void loadSources();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleExplore() {
    if (!token) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Hãy nhập từ khóa để khai thác kho nội dung.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: trimmedQuery,
        text: text.trim() || trimmedQuery,
        limit: '8',
      });
      const response = await apiGet<ContentHubExploreResponse>(`/integrations/explore?${params.toString()}`, token);
      setResult(response);
      if (response.providers.length) setProviders(response.providers);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không khai thác được nguồn nội dung ngoài.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="playground-content-hub" className="contentHubPanel panel">
      <div className="sectionTitle contentHubTitle">
        <div>
          <p className="eyebrow">Nguồn nội dung mở rộng</p>
          <h2>Kho API cho từ vựng, ngữ pháp, thesaurus, hình ảnh, audio và video</h2>
          <span>Gom dữ liệu từ nhiều nguồn, chuẩn hóa lại để dùng cho bài học, trò chơi, AI Vision và pet.</span>
        </div>
        <span className="inlineBadge">
          <Globe2 size={16} />
          {readyCount}/{providers.length || 0} nguồn sẵn sàng
        </span>
      </div>

      <div className="contentProviderRail">
        {(providers.length ? providers : []).map((provider) => (
          <span className={`contentProviderChip ${getProviderTone(provider)}`} key={provider.code} title={provider.note}>
            {provider.ready ? 'Online' : 'Chờ key'} · {provider.name}
          </span>
        ))}
      </div>

      <div className="contentHubSearch">
        <label className="field">
          <span>Từ khóa / chủ đề</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: family, school, food..." />
        </label>
        <label className="field">
          <span>Câu để kiểm tra ngữ pháp</span>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ví dụ: I has a apple." />
        </label>
        <button className="primaryButton contentHubButton" type="button" onClick={handleExplore} disabled={loading}>
          <Search size={17} />
          {loading ? 'Đang khai thác...' : 'Khai thác ngay'}
        </button>
      </div>

      {error ? <div className="errorBox">{error}</div> : null}

      {!result ? (
        <div className="contentHubEmpty">
          <Sparkles size={20} />
          <div>
            <strong>Sẵn sàng mở rộng bài học.</strong>
            <span>Nhập một từ khóa, hệ thống sẽ gom từ liên quan, thesaurus, lỗi ngữ pháp, ảnh minh họa, audio và video luyện nghe.</span>
          </div>
        </div>
      ) : (
        <div className="contentHubResult">
          <div className="contentHubStats">
            <span>{result.stats.vocabulary} từ vựng</span>
            <span>{result.stats.grammar} góp ý ngữ pháp</span>
            <span>{result.stats.examples} câu ví dụ</span>
            <span>{result.stats.images} ảnh</span>
            <span>{result.stats.audio} audio</span>
            <span>{result.stats.videos} video</span>
            <span>{result.stats.knowledge} tri thức</span>
            <span>{result.stats.thesaurus} từ gần nghĩa</span>
          </div>

          {result.warnings.length ? (
            <div className="contentWarning">
              {result.warnings.slice(0, 3).map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
          ) : null}

          <div className="contentHubGrid">
            <article className="contentHubColumn">
              <div className="contentHubColumnHead">
                <BookOpen size={18} />
                <strong>Từ vựng gợi ý</strong>
              </div>
              <div className="contentHubList">
                {result.vocabulary.slice(0, 8).map((item) => (
                  <div className="contentHubCard" key={`${item.source}-${item.word}-${item.meaning}`}>
                    <div>
                      <strong>{item.word}</strong>
                      <span>{item.meaning}</span>
                    </div>
                    <small>{item.source}</small>
                    {item.pronunciation ? <em>{item.pronunciation}</em> : null}
                    {item.audioUrl ? <SpeechButton text={item.word} audioUrl={item.audioUrl} label="Nghe" /> : null}
                  </div>
                ))}
                {!result.vocabulary.length ? <div className="subtleBox">Chưa có từ vựng từ nguồn ngoài.</div> : null}
              </div>
            </article>

            <article className="contentHubColumn">
              <div className="contentHubColumnHead">
                <PencilLine size={18} />
                <strong>Ngữ pháp</strong>
              </div>
              <div className="contentHubList">
                {result.grammar.slice(0, 6).map((item) => (
                  <div className="contentHubCard grammar" key={`${item.ruleId}-${item.message}`}>
                    <div>
                      <strong>{item.shortMessage || item.category}</strong>
                      <span>{item.message}</span>
                    </div>
                    <small>{item.source} · {item.ruleId}</small>
                    {item.replacements.length ? <em>Gợi ý: {item.replacements.join(', ')}</em> : null}
                  </div>
                ))}
                {!result.grammar.length ? <div className="subtleBox">Câu đang ổn hoặc chưa có góp ý.</div> : null}
              </div>
            </article>
          </div>

          <article className="contentHubExamples">
            <div className="contentHubColumnHead">
              <Quote size={18} />
              <strong>Câu ví dụ theo ngữ cảnh</strong>
            </div>
            <div className="contentExampleGrid">
              {result.examples.slice(0, 6).map((item) => (
                <div className="contentExampleCard" key={`${item.source}-${item.id}`}>
                  <p>{item.sentence}</p>
                  {item.translation ? <span>{item.translation}</span> : null}
                  <div className="contentExampleActions">
                    {item.audioUrl ? <SpeechButton text={item.sentence} audioUrl={item.audioUrl} label="Nghe câu" /> : <SpeechButton text={item.sentence} label="Đọc câu" />}
                    <a href={item.sourceUrl ?? '#'} target="_blank" rel="noreferrer">
                      {item.source}
                    </a>
                  </div>
                </div>
              ))}
              {!result.examples.length ? <div className="subtleBox">Chưa có câu ví dụ phù hợp.</div> : null}
            </div>
          </article>

          <article className="contentHubThesaurus">
            <div className="contentHubColumnHead">
              <ArrowLeftRight size={18} />
              <strong>Từ gần nghĩa, trái nghĩa và liên quan</strong>
            </div>
            <div className="contentThesaurusGrid">
              {result.thesaurus.slice(0, 10).map((item) => (
                <div className={`contentThesaurusCard ${item.relation.toLowerCase()}`} key={`${item.source}-${item.relation}-${item.word}`}>
                  <div className="contentThesaurusTop">
                    <span className={`contentThesaurusBadge ${item.relation.toLowerCase()}`}>{item.relation}</span>
                    {item.partOfSpeech ? <small>{item.partOfSpeech}</small> : null}
                  </div>
                  <strong>{item.word}</strong>
                  {item.definition ? <p>{item.definition}</p> : null}
                  {item.examples.length ? (
                    <div className="contentThesaurusExamples">
                      {item.examples.slice(0, 4).map((example) => (
                        <span key={`${item.word}-${example}`}>{example}</span>
                      ))}
                    </div>
                  ) : null}
                  <small>{item.source}</small>
                </div>
              ))}
              {!result.thesaurus.length ? <div className="subtleBox">Chưa có dữ liệu thesaurus.</div> : null}
            </div>
          </article>

          <div className="contentMediaGrid">
            <article className="contentHubColumn media">
              <div className="contentHubColumnHead">
                <ImageIcon size={18} />
                <strong>Ảnh minh họa</strong>
              </div>
              <div className="contentImageGrid">
                {result.images.slice(0, 8).map((item) => (
                  <a className="contentImageCard" href={item.sourceUrl ?? item.imageUrl} key={`${item.source}-${item.imageUrl}`} target="_blank" rel="noreferrer">
                    <img src={item.thumbnailUrl ?? item.imageUrl} alt={item.title} />
                    <span>{item.source}</span>
                  </a>
                ))}
                {!result.images.length ? <div className="subtleBox">Chưa có ảnh minh họa.</div> : null}
              </div>
            </article>

            <article className="contentHubColumn audio">
              <div className="contentHubColumnHead">
                <Volume2 size={18} />
                <strong>Audio luyện nghe</strong>
              </div>
              <div className="contentHubList">
                {result.audio.slice(0, 6).map((item) => (
                  <div className="contentHubCard" key={`${item.source}-${item.audioUrl}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.description ?? item.source}</span>
                    </div>
                    <small>{item.source}{item.license ? ` · ${item.license}` : ''}</small>
                    <SpeechButton text={item.title} audioUrl={item.audioUrl} label="Phát audio" />
                  </div>
                ))}
                {!result.audio.length ? <div className="subtleBox">Chưa có audio phù hợp.</div> : null}
              </div>
            </article>
          </div>

          <article className="contentHubVideo">
            <div className="contentHubColumnHead">
              <PlayCircle size={18} />
              <strong>Video minh họa</strong>
            </div>
            <div className="contentVideoGrid">
              {result.videos.slice(0, 4).map((item) => (
                <div className="contentVideoCard" key={`${item.source}-${item.videoUrl}`}>
                  <video controls preload="metadata" playsInline poster={item.previewUrl ?? undefined}>
                    <source src={item.videoUrl} type="video/mp4" />
                  </video>
                  <div className="contentVideoMeta">
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.creator ? `${item.creator} · ` : ''}
                        {item.duration ? `${item.duration}s` : 'Video'}
                      </span>
                    </div>
                    <small>
                      {item.source}
                      {item.license ? ` · ${item.license}` : ''}
                    </small>
                  </div>
                </div>
              ))}
              {!result.videos.length ? <div className="subtleBox">Chưa có video phù hợp.</div> : null}
            </div>
          </article>

          <article className="contentHubKnowledge">
            <div className="contentHubColumnHead">
              <Globe2 size={18} />
              <strong>Tri thức nền tảng</strong>
            </div>
            <div className="contentKnowledgeGrid">
              {result.knowledge.slice(0, 4).map((item) => (
                <div className="contentKnowledgeCard" key={`${item.source}-${item.title}`}>
                  {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} /> : null}
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.extract}</p>
                    <a href={item.sourceUrl ?? '#'} target="_blank" rel="noreferrer">
                      {item.source}
                    </a>
                  </div>
                </div>
              ))}
              {!result.knowledge.length ? <div className="subtleBox">Chưa có thẻ tri thức.</div> : null}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
