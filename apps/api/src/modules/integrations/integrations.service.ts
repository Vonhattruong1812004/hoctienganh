import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { ExploreContentQueryDto } from './dto/explore-content.query';

type ContentProviderState = {
  code: string;
  name: string;
  category: 'TuVung' | 'NguPhap' | 'HinhAnh' | 'Audio' | 'Video' | 'TriThuc' | 'DaPhuongTien';
  enabled: boolean;
  ready: boolean;
  requiresKey: boolean;
  endpoint: string;
  note: string;
};

type ExternalVocabularyItem = {
  word: string;
  meaning: string;
  pronunciation: string | null;
  example: string | null;
  audioUrl: string | null;
  source: string;
  sourceUrl: string | null;
  score: number | null;
  tags: string[];
};

type ExternalGrammarSuggestion = {
  message: string;
  shortMessage: string | null;
  category: string;
  ruleId: string;
  context: string;
  replacements: string[];
  source: string;
};

type ExternalExampleSentence = {
  id: string;
  sentence: string;
  translation: string | null;
  language: string;
  translationLanguage: string | null;
  audioUrl: string | null;
  source: string;
  sourceUrl: string | null;
};

type ExternalImageAsset = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  source: string;
  creator: string | null;
  license: string | null;
  sourceUrl: string | null;
};

type SmartImageAsset = ExternalImageAsset & {
  relevanceScore: number;
  aiScore: number | null;
  metadataScore: number;
  accepted: boolean;
  reason: string;
  analysisProvider: 'openai-vision' | 'metadata-ranker';
  detectedTags: string[];
};

type ZooAsset = {
  key: string;
  name: string;
  englishWord: string;
  vietnameseName: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  source: string;
  creator: string | null;
  license: string | null;
  sourceUrl: string | null;
  fallbackIcon: string;
  color: string;
};

type ExternalAudioAsset = {
  title: string;
  audioUrl: string;
  source: string;
  creator: string | null;
  license: string | null;
  sourceUrl: string | null;
  description: string | null;
};

type ExternalVideoAsset = {
  title: string;
  videoUrl: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  source: string;
  creator: string | null;
  license: string | null;
  sourceUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
};

type ExternalKnowledgeCard = {
  title: string;
  extract: string;
  source: string;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
};

type ExternalThesaurusCard = {
  word: string;
  relation: 'Synonym' | 'Antonym' | 'Related';
  partOfSpeech: string | null;
  definition: string | null;
  examples: string[];
  source: string;
  sourceUrl: string | null;
};

type ProviderResult<T> = {
  items: T[];
  warnings: string[];
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type DatamuseWord = {
  word?: string;
  score?: number;
  tags?: string[];
  defs?: string[];
};

type FreeDictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{
      definition?: string;
      example?: string;
      synonyms?: string[];
    }>;
    synonyms?: string[];
  }>;
};

type MerriamWebsterEntry = {
  meta?: {
    id?: string;
    stems?: string[];
  };
  hwi?: {
    hw?: string;
    prs?: Array<{
      mw?: string;
      sound?: {
        audio?: string;
      };
    }>;
  };
  fl?: string;
  shortdef?: string[];
};

type MerriamWebsterThesaurusEntry = {
  meta?: {
    id?: string;
    stems?: string[];
    syns?: string[][];
    ants?: string[][];
  };
  hwi?: {
    hw?: string;
  };
  fl?: string;
  shortdef?: string[];
  def?: Array<{
    sseq?: Array<Array<Array<[string, { dt?: Array<[string, unknown]>; rel_list?: Array<Array<{ wd?: string }>>; syn_list?: Array<Array<{ wd?: string }>> } ]>>>;
  }>;
};

type LanguageToolResponse = {
  matches?: Array<{
    message?: string;
    shortMessage?: string;
    offset?: number;
    length?: number;
    replacements?: Array<{ value?: string }>;
    rule?: {
      id?: string;
      category?: {
        id?: string;
        name?: string;
      };
    };
    context?: {
      text?: string;
      offset?: number;
      length?: number;
    };
  }>;
};

type TatoebaTranslation = {
  id?: number;
  lang?: string;
  text?: string;
};

type TatoebaTranslationGroup = TatoebaTranslation[] | TatoebaTranslation;

type TatoebaSentenceResponse = {
  data?: Array<{
    id?: number;
    lang?: string;
    text?: string;
    audios?: Array<{
      id?: number;
    }>;
    translations?: TatoebaTranslationGroup[];
  }>;
};

type OpenverseMediaResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    thumbnail?: string;
    creator?: string;
    license?: string;
    source?: string;
    foreign_landing_url?: string;
  }>;
};

type PixabayResponse = {
  hits?: Array<{
    pageURL?: string;
    previewURL?: string;
    webformatURL?: string;
    largeImageURL?: string;
    user?: string;
    tags?: string;
  }>;
};

type PixabayVideoResponse = {
  hits?: Array<{
    pageURL?: string;
    type?: string;
    tags?: string;
    duration?: number;
    user?: string;
    userImageURL?: string;
    videos?: Record<
      'large' | 'medium' | 'small' | 'tiny',
      {
        url?: string;
        width?: number;
        height?: number;
        size?: number;
        thumbnail?: string;
      }
    >;
  }>;
};

type PexelsResponse = {
  photos?: Array<{
    alt?: string;
    url?: string;
    photographer?: string;
    photographer_url?: string;
    src?: {
      medium?: string;
      large?: string;
      original?: string;
    };
  }>;
};

type PexelsVideoResponse = {
  videos?: Array<{
    id?: number;
    width?: number;
    height?: number;
    url?: string;
    image?: string;
    duration?: number;
    user?: {
      id?: number;
      name?: string;
      url?: string;
    };
    video_files?: Array<{
      id?: number;
      quality?: string;
      file_type?: string;
      width?: number;
      height?: number;
      link?: string;
    }>;
  }>;
};

type OpenAiVisionRankingResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type AiImageScore = {
  index: number;
  score: number;
  isMatch: boolean;
  reason: string;
  tags?: string[];
};

type WikimediaCommonsResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          mime?: string;
          descriptionurl?: string;
          extmetadata?: Record<
            string,
            {
              value?: string;
            }
          >;
        }>;
      }
    >;
  };
};

type WikipediaOpenSearchResponse = [string, string[], string[], string[]];

type WikipediaSummaryResponse = {
  title?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
  thumbnail?: {
    source?: string;
  };
};

const visualTranslationRules: Array<{ patterns: string[]; terms: string[] }> = [
  { patterns: ['trai cam', 'qua cam', 'orange fruit', 'citrus orange'], terms: ['orange fruit', 'citrus fruit'] },
  { patterns: ['trai tao', 'qua tao', 'apple fruit'], terms: ['apple fruit'] },
  { patterns: ['trai chuoi', 'qua chuoi', 'banana fruit'], terms: ['banana fruit'] },
  { patterns: ['trai nho', 'qua nho', 'grape fruit'], terms: ['grapes fruit'] },
  { patterns: ['trai dau', 'dau tay', 'strawberry'], terms: ['strawberry fruit'] },
  { patterns: ['dua hau', 'watermelon'], terms: ['watermelon fruit'] },
  { patterns: ['trai xoai', 'qua xoai', 'mango'], terms: ['mango fruit'] },
  { patterns: ['trai thom', 'qua thom', 'dua thom', 'pineapple'], terms: ['pineapple fruit'] },
  { patterns: ['cai ghe', 'ghe ngoi', 'chair'], terms: ['chair furniture'] },
  { patterns: ['cai ban', 'ban hoc', 'ban lam viec', 'desk', 'table'], terms: ['desk table furniture'] },
  { patterns: ['quyen sach', 'sach giao khoa', 'book'], terms: ['book classroom object'] },
  { patterns: ['cay but', 'but bi', 'pen'], terms: ['pen stationery'] },
  { patterns: ['but chi', 'pencil'], terms: ['pencil stationery'] },
  { patterns: ['cuc tay', 'eraser'], terms: ['eraser stationery'] },
  { patterns: ['thuoc ke', 'ruler'], terms: ['ruler stationery'] },
  { patterns: ['cap sach', 'ba lo', 'backpack', 'school bag'], terms: ['school backpack'] },
  { patterns: ['dien thoai', 'phone', 'smartphone'], terms: ['smartphone device'] },
  { patterns: ['may tinh', 'laptop', 'computer'], terms: ['laptop computer'] },
  { patterns: ['may in', 'printer'], terms: ['office printer'] },
  { patterns: ['van phong', 'office'], terms: ['modern office workplace'] },
  { patterns: ['phong hop', 'meeting room'], terms: ['office meeting room'] },
  { patterns: ['hoa don', 'invoice'], terms: ['business invoice document'] },
  { patterns: ['hop dong', 'contract'], terms: ['business contract document'] },
  { patterns: ['dong vat', 'animal'], terms: ['animal wildlife'] },
  { patterns: ['con cho', 'dog'], terms: ['dog animal'] },
  { patterns: ['con meo', 'cat'], terms: ['cat animal'] },
  { patterns: ['chim canh cut', 'penguin'], terms: ['penguin animal'] },
  { patterns: ['con tho', 'rabbit'], terms: ['rabbit animal'] },
  { patterns: ['con rua', 'turtle'], terms: ['turtle animal'] },
  { patterns: ['con ca', 'fish'], terms: ['fish animal'] },
  { patterns: ['con heo', 'pig'], terms: ['pig animal'] },
  { patterns: ['sua', 'milk'], terms: ['glass of milk drink'] },
  { patterns: ['nuoc', 'water'], terms: ['glass of water drink'] },
  { patterns: ['banh mi', 'bread'], terms: ['bread food'] },
  { patterns: ['com', 'rice'], terms: ['bowl of rice food'] },
  { patterns: ['ca phe', 'coffee'], terms: ['coffee cup drink'] },
  { patterns: ['tra', 'tea'], terms: ['tea cup drink'] },
  { patterns: ['gia dinh', 'family'], terms: ['family parents children'] },
  { patterns: ['bo', 'cha', 'father'], terms: ['father family'] },
  { patterns: ['me', 'mother'], terms: ['mother family'] },
  { patterns: ['anh trai', 'brother'], terms: ['brother family'] },
  { patterns: ['chi gai', 'sister'], terms: ['sister family'] },
  { patterns: ['thuc day', 'get up', 'wake up'], terms: ['wake up morning bed'] },
  { patterns: ['danh rang', 'brush teeth'], terms: ['toothbrush toothpaste dental care'] },
  { patterns: ['di hoc', 'go to school'], terms: ['student backpack school'] },
  { patterns: ['di ngu', 'ngu', 'sleep'], terms: ['child sleeping bed'] },
  { patterns: ['hoc bai', 'study'], terms: ['student studying desk books'] },
];

@Injectable()
export class IntegrationsService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheTtlMs = 10 * 60 * 1000;
  private readonly timeoutMs = 6500;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getSources(): ContentProviderState[] {
    const merriamWebsterReady = Boolean(this.getMerriamWebsterKey());
    const pixabayReady = Boolean(this.config.get<string>('PIXABAY_API_KEY'));
    const pexelsReady = Boolean(this.config.get<string>('PEXELS_API_KEY'));
    const openAiReady = Boolean(this.config.get<string>('OPENAI_API_KEY'));

    return [
      {
        code: 'datamuse',
        name: 'Datamuse Word API',
        category: 'TuVung',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://api.datamuse.com/words',
        note: 'Gợi ý từ liên quan, đồng nghĩa, chủ đề và metadata từ vựng.',
      },
      {
        code: 'free-dictionary',
        name: 'Free Dictionary API',
        category: 'TuVung',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://api.dictionaryapi.dev/api/v2/entries/en',
        note: 'Lấy định nghĩa, ví dụ, phiên âm và audio miễn phí không cần API key.',
      },
      {
        code: 'merriam-webster-learners',
        name: "Merriam-Webster Learner's Dictionary",
        category: 'TuVung',
        enabled: merriamWebsterReady,
        ready: merriamWebsterReady,
        requiresKey: true,
        endpoint: 'https://www.dictionaryapi.com/api/v3/references/learners/json',
        note: merriamWebsterReady
          ? 'Đã sẵn sàng lấy định nghĩa, ví dụ, phiên âm và audio phát âm.'
          : 'Thêm MERRIAM_WEBSTER_LEARNERS_KEY để bật định nghĩa và audio chuẩn.',
      },
      {
        code: 'merriam-webster-thesaurus',
        name: 'Merriam-Webster Thesaurus',
        category: 'TuVung',
        enabled: merriamWebsterReady,
        ready: merriamWebsterReady,
        requiresKey: true,
        endpoint: 'https://www.dictionaryapi.com/api/v3/references/thesaurus/json',
        note: merriamWebsterReady
          ? 'Đã sẵn sàng lấy đồng nghĩa, trái nghĩa và từ liên quan.'
          : 'Thêm MERRIAM_WEBSTER_LEARNERS_KEY để bật thesaurus chuẩn.',
      },
      {
        code: 'languagetool',
        name: 'LanguageTool API',
        category: 'NguPhap',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://api.languagetool.org/v2/check',
        note: 'Kiểm tra ngữ pháp, chính tả, phong cách viết cho câu tiếng Anh.',
      },
      {
        code: 'tatoeba',
        name: 'Tatoeba Sentences',
        category: 'TriThuc',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://api.tatoeba.org/v1/sentences',
        note: 'Tìm câu ví dụ thật theo từ khóa, có thể kèm bản dịch tiếng Việt.',
      },
      {
        code: 'openverse-images',
        name: 'Openverse Images',
        category: 'HinhAnh',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://api.openverse.org/v1/images',
        note: 'Tìm ảnh mở, có thông tin giấy phép và tác giả để minh họa bài học.',
      },
      {
        code: 'openverse-audio',
        name: 'Openverse Audio',
        category: 'Audio',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://api.openverse.org/v1/audio',
        note: 'Tìm audio mở để làm tài nguyên nghe mở rộng.',
      },
      {
        code: 'wikipedia-summary',
        name: 'Wikipedia Summary',
        category: 'TriThuc',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://en.wikipedia.org/api/rest_v1/page/summary',
        note: 'Tạo thẻ tri thức ngắn để biến từ vựng thành ngữ cảnh học thật.',
      },
      {
        code: 'wikimedia-commons',
        name: 'Wikimedia Commons',
        category: 'DaPhuongTien',
        enabled: true,
        ready: true,
        requiresKey: false,
        endpoint: 'https://commons.wikimedia.org/w/api.php',
        note: 'Bổ sung ảnh và audio mở, có tác giả và giấy phép.',
      },
      {
        code: 'pixabay',
        name: 'Pixabay API',
        category: 'HinhAnh',
        enabled: pixabayReady,
        ready: pixabayReady,
        requiresKey: true,
        endpoint: 'https://pixabay.com/api',
        note: pixabayReady ? 'Đã sẵn sàng lấy ảnh và video minh họa.' : 'Thêm PIXABAY_API_KEY để bật kho ảnh/video Pixabay.',
      },
      {
        code: 'pixabay-videos',
        name: 'Pixabay Videos',
        category: 'Video',
        enabled: pixabayReady,
        ready: pixabayReady,
        requiresKey: true,
        endpoint: 'https://pixabay.com/api/videos/',
        note: pixabayReady ? 'Đã sẵn sàng lấy video stock minh họa từ Pixabay.' : 'Thêm PIXABAY_API_KEY để bật video Pixabay.',
      },
      {
        code: 'pexels',
        name: 'Pexels API',
        category: 'HinhAnh',
        enabled: pexelsReady,
        ready: pexelsReady,
        requiresKey: true,
        endpoint: 'https://api.pexels.com/v1/search',
        note: pexelsReady ? 'Đã sẵn sàng lấy ảnh chất lượng cao.' : 'Thêm PEXELS_API_KEY để bật ảnh Pexels.',
      },
      {
        code: 'pexels-videos',
        name: 'Pexels Videos',
        category: 'Video',
        enabled: pexelsReady,
        ready: pexelsReady,
        requiresKey: true,
        endpoint: 'https://api.pexels.com/v1/videos/search',
        note: pexelsReady ? 'Đã sẵn sàng lấy video minh họa chất lượng cao.' : 'Thêm PEXELS_API_KEY để bật video Pexels.',
      },
      {
        code: 'openai-vision-ranker',
        name: 'OpenAI Vision Image Ranker',
        category: 'HinhAnh',
        enabled: openAiReady,
        ready: openAiReady,
        requiresKey: true,
        endpoint: 'https://api.openai.com/v1/responses',
        note: openAiReady
          ? 'Đã sẵn sàng phân tích ảnh ứng viên và chọn ảnh đúng ngữ cảnh bài học.'
          : 'Thêm OPENAI_API_KEY để bật AI phân tích ảnh trước khi chọn minh họa.',
      },
    ];
  }

  async getZooAssets(limit = 10) {
    const normalizedLimit = Math.min(Math.max(Number(limit || 10), 4), 16);
    const zooSeeds = [
      {
        key: 'penguin',
        name: 'Pingu',
        englishWord: 'penguin',
        vietnameseName: 'chim cánh cụt',
        query: 'cute cartoon penguin illustration',
        fallbackIcon: '🐧',
        color: '#22d3ee',
      },
      {
        key: 'rabbit',
        name: 'Bun Bun',
        englishWord: 'rabbit',
        vietnameseName: 'thỏ',
        query: 'cute chibi rabbit illustration',
        fallbackIcon: '🐰',
        color: '#f9a8d4',
      },
      {
        key: 'turtle',
        name: 'Toto',
        englishWord: 'turtle',
        vietnameseName: 'rùa',
        query: 'cute cartoon turtle illustration',
        fallbackIcon: '🐢',
        color: '#22c55e',
      },
      {
        key: 'pig',
        name: 'Pipo',
        englishWord: 'pig',
        vietnameseName: 'heo',
        query: 'cute chibi pig illustration',
        fallbackIcon: '🐷',
        color: '#fb7185',
      },
      {
        key: 'fox',
        name: 'Foxy',
        englishWord: 'fox',
        vietnameseName: 'cáo',
        query: 'cute cartoon fox illustration',
        fallbackIcon: '🦊',
        color: '#f97316',
      },
      {
        key: 'cat',
        name: 'Mimi',
        englishWord: 'cat',
        vietnameseName: 'mèo',
        query: 'cute chibi cat illustration',
        fallbackIcon: '🐱',
        color: '#facc15',
      },
      {
        key: 'fish',
        name: 'Bubbles',
        englishWord: 'fish',
        vietnameseName: 'cá',
        query: 'cute cartoon fish illustration',
        fallbackIcon: '🐠',
        color: '#38bdf8',
      },
      {
        key: 'panda',
        name: 'Panda',
        englishWord: 'panda',
        vietnameseName: 'gấu trúc',
        query: 'cute chibi panda illustration',
        fallbackIcon: '🐼',
        color: '#94a3b8',
      },
    ];

    const selectedSeeds = zooSeeds.slice(0, Math.min(zooSeeds.length, normalizedLimit));
    const cacheKey = `zoo-assets:${normalizedLimit}`;
    const animals = await this.cached(cacheKey, async () => {
      const rows = await Promise.all(
        selectedSeeds.map(async (seed) => {
          const provider = await this.safeProvider('Openverse Zoo Images', true, () => this.searchOpenverseImages(seed.query, 2));
          const image = provider.items.find((item) => item.thumbnailUrl || item.imageUrl) ?? null;

          return {
            key: seed.key,
            name: seed.name,
            englishWord: seed.englishWord,
            vietnameseName: seed.vietnameseName,
            imageUrl: image?.imageUrl ?? null,
            thumbnailUrl: image?.thumbnailUrl ?? image?.imageUrl ?? null,
            source: image?.source ?? 'CSS fallback',
            creator: image?.creator ?? null,
            license: image?.license ?? null,
            sourceUrl: image?.sourceUrl ?? null,
            fallbackIcon: seed.fallbackIcon,
            color: seed.color,
          } satisfies ZooAsset;
        }),
      );

      return rows;
    });

    return {
      theme: 'EnglishPro Zoo',
      generatedAt: new Date().toISOString(),
      providers: [
        {
          name: 'Openverse Zoo Images',
          ready: true,
          note: 'Tìm ảnh minh họa động vật cute/cartoon/chibi từ nguồn mở, có thông tin tác giả và giấy phép.',
        },
        {
          name: 'CSS Motion Zoo',
          ready: true,
          note: 'Fallback luôn chạy bằng pet CSS/emoji khi API ảnh ngoài chậm hoặc không trả dữ liệu phù hợp.',
        },
      ],
      animals,
    };
  }

  async getPublicImages(query: string, limit = 6) {
    const normalizedQuery = this.clean(query);
    const normalizedLimit = Math.min(Math.max(Number(limit || 6), 1), 12);

    if (normalizedQuery.length < 2) {
      throw new BadRequestException('Từ khóa tìm ảnh cần ít nhất 2 ký tự.');
    }

    const visualQueries = this.buildVisualSearchQueries(normalizedQuery, '', '');
    const stopWords = new Set(['english', 'vocabulary', 'illustration', 'lesson', 'learning', 'children']);
    const compactQuery = normalizedQuery
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z-]/gi, '').toLowerCase())
      .filter((word) => word.length > 1 && !stopWords.has(word))
      .slice(0, 2)
      .join(' ');
    const firstKeyword = compactQuery.split(/\s+/)[0] ?? '';
    const candidateQueries = Array.from(new Set([...visualQueries, normalizedQuery, compactQuery, firstKeyword].filter(Boolean)));
    let images: ProviderResult<ExternalImageAsset> | null = null;
    let usedQuery = normalizedQuery;

    for (const candidateQuery of candidateQueries) {
      images = await this.searchImages(candidateQuery, normalizedLimit);
      usedQuery = candidateQuery;

      if (images.items.length > 0) {
        break;
      }
    }

    return {
      query: normalizedQuery,
      usedQuery,
      candidateQueries,
      visualHints: this.getVisualKeywordHints(normalizedQuery),
      generatedAt: new Date().toISOString(),
      providers: [
        {
          name: 'Openverse',
          ready: true,
          note: 'Tìm ảnh mở, có nguồn/tác giả/giấy phép để dùng minh họa học tập.',
        },
        {
          name: 'Wikimedia Commons',
          ready: true,
          note: 'Bổ sung ảnh minh họa từ kho media mở của Wikimedia.',
        },
        {
          name: 'Pixabay/Pexels',
          ready: Boolean(this.config.get<string>('PIXABAY_API_KEY') || this.config.get<string>('PEXELS_API_KEY')),
          note: 'Tự bật khi cấu hình API key để mở rộng kho ảnh chất lượng cao.',
        },
      ],
      images: images?.items ?? [],
      warnings: [
        ...(usedQuery !== normalizedQuery ? [`Đã mở rộng/tối giản từ khóa sang "${usedQuery}" để tìm được ảnh phù hợp hơn.`] : []),
        ...(images?.warnings ?? []),
      ],
    };
  }

  async getSmartImages(query: string, meaning = '', context = '', limit = 6) {
    const normalizedQuery = this.clean(query);
    const normalizedMeaning = this.clean(meaning);
    const normalizedContext = this.clean(context);
    const normalizedLimit = Math.min(Math.max(Number(limit || 6), 1), 10);

    if (normalizedQuery.length < 2) {
      throw new BadRequestException('Từ khóa tìm ảnh cần ít nhất 2 ký tự.');
    }

    const candidateQueries = this.buildVisualSearchQueries(normalizedQuery, normalizedMeaning, normalizedContext);
    let searchResult: ProviderResult<ExternalImageAsset> = { items: [], warnings: [] };

    for (const candidateQuery of candidateQueries) {
      const result = await this.searchImages(candidateQuery, Math.min(normalizedLimit * 3, 18));
      searchResult = {
        items: [...searchResult.items, ...result.items],
        warnings: [...searchResult.warnings, ...result.warnings],
      };
    }

    const uniqueCandidates = this.uniqueImages(searchResult.items).slice(0, Math.min(normalizedLimit * 2, 10));
    const metadataRanked = uniqueCandidates.map((item) => ({
      ...item,
      metadataScore: this.scoreImageMetadata(item, normalizedQuery, normalizedMeaning, normalizedContext),
    }));
    const openAiReady = Boolean(this.config.get<string>('OPENAI_API_KEY'));
    const warnings = [...searchResult.warnings];
    let aiScores = new Map<number, AiImageScore>();
    let analysisProvider: SmartImageAsset['analysisProvider'] = 'metadata-ranker';

    if (openAiReady && metadataRanked.length) {
      try {
        const aiResult = await this.rankImagesWithOpenAi(
          metadataRanked.slice(0, Math.min(metadataRanked.length, 6)),
          normalizedQuery,
          normalizedMeaning,
          normalizedContext,
        );
        aiScores = new Map(aiResult.map((item) => [item.index, item]));
        analysisProvider = 'openai-vision';
      } catch (error) {
        warnings.push(
          `AI phân tích ảnh chưa phản hồi ổn định, dùng bộ chấm metadata: ${
            error instanceof Error ? error.message : 'không xác định'
          }.`,
        );
      }
    } else if (!openAiReady) {
      warnings.push('Chưa cấu hình OPENAI_API_KEY nên hệ thống đang dùng bộ chấm metadata thay cho AI vision.');
    }

    const ranked: SmartImageAsset[] = metadataRanked
      .map((item, index) => {
        const aiScore = aiScores.get(index);
        const aiValue = aiScore ? this.clampScore(aiScore.score) : null;
        const metadataValue = this.clampScore(item.metadataScore);
        const relevanceScore =
          aiValue === null ? metadataValue : Math.round(aiValue * 0.72 + metadataValue * 0.28);

        return {
          ...item,
          aiScore: aiValue,
          metadataScore: metadataValue,
          relevanceScore,
          accepted: aiScore ? aiScore.isMatch && relevanceScore >= 58 : relevanceScore >= 62,
          reason:
            aiScore?.reason ??
            `Ảnh được chọn theo điểm metadata ${metadataValue}/100 dựa trên tiêu đề, nguồn và ngữ cảnh tìm kiếm.`,
          analysisProvider,
          detectedTags: aiScore?.tags ?? this.extractVisualTerms(`${item.title} ${item.source}`).slice(0, 6),
        };
      })
      .sort((left, right) => Number(right.accepted) - Number(left.accepted) || right.relevanceScore - left.relevanceScore)
      .slice(0, normalizedLimit);

    return {
      query: normalizedQuery,
      meaning: normalizedMeaning,
      context: normalizedContext,
      usedQuery: candidateQueries.join(' | '),
      candidateQueries,
      visualHints: this.getVisualKeywordHints(normalizedQuery, normalizedMeaning, normalizedContext),
      generatedAt: new Date().toISOString(),
      analysisProvider,
      providers: [
        {
          name: 'Openverse/Wikimedia/Pixabay/Pexels',
          ready: true,
          note: 'Gom nhiều ảnh ứng viên từ nguồn mở và nguồn ảnh chất lượng cao nếu có API key.',
        },
        {
          name: 'OpenAI Vision Ranker',
          ready: openAiReady,
          note: openAiReady
            ? 'AI đang chấm ảnh theo từ vựng, nghĩa tiếng Việt và ví dụ trong bài.'
            : 'Thêm OPENAI_API_KEY để AI nhìn ảnh và chọn ảnh phù hợp nhất.',
        },
      ],
      images: ranked,
      warnings,
    };
  }

  async explore(userId: string, dto: ExploreContentQueryDto) {
    const query = this.clean(dto.q);
    const text = this.clean(dto.text ?? dto.q);
    const limit = Math.min(Math.max(Number(dto.limit ?? 8), 1), 20);

    if (!query) {
      throw new BadRequestException('Cần nhập từ khóa để khai thác nguồn nội dung ngoài.');
    }

    const visualQuery = this.buildVisualSearchQueries(query, '', '').at(0) ?? query;
    const [vocabulary, grammar, examples, images, audio, videos, knowledge, thesaurus] = await Promise.all([
      this.searchVocabulary(query, limit),
      this.searchGrammar(text),
      this.searchExamples(query, limit),
      this.searchImages(visualQuery, limit),
      this.searchAudio(query, limit),
      this.searchVideos(query, limit),
      this.searchKnowledge(query),
      this.searchThesaurus(query, limit),
    ]);

    const warnings = [
      ...vocabulary.warnings,
      ...grammar.warnings,
      ...examples.warnings,
      ...images.warnings,
      ...audio.warnings,
      ...videos.warnings,
      ...knowledge.warnings,
      ...thesaurus.warnings,
    ];

    await this.recordActivity(userId, query, {
      vocabulary: vocabulary.items.length,
      grammar: grammar.items.length,
      examples: examples.items.length,
      images: images.items.length,
      audio: audio.items.length,
      videos: videos.items.length,
      knowledge: knowledge.items.length,
      thesaurus: thesaurus.items.length,
    });

    return {
      query,
      visualQuery,
      text,
      providers: this.getSources(),
      vocabulary: vocabulary.items,
      grammar: grammar.items,
      examples: examples.items,
      images: images.items,
      audio: audio.items,
      videos: videos.items,
      knowledge: knowledge.items,
      thesaurus: thesaurus.items,
      warnings,
      stats: {
        vocabulary: vocabulary.items.length,
        grammar: grammar.items.length,
        examples: examples.items.length,
        images: images.items.length,
        audio: audio.items.length,
        videos: videos.items.length,
        knowledge: knowledge.items.length,
        thesaurus: thesaurus.items.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async searchVocabulary(query: string, limit: number): Promise<ProviderResult<ExternalVocabularyItem>> {
    const cacheKey = `vocabulary:${query}:${limit}`;
    return this.cached(cacheKey, async () => {
      const [datamuse, freeDictionary, merriamWebster] = await Promise.all([
        this.safeProvider('Datamuse', true, () => this.searchDatamuse(query, limit)),
        this.safeProvider('Free Dictionary', true, () => this.searchFreeDictionary(query, limit)),
        this.safeProvider('Merriam-Webster', Boolean(this.getMerriamWebsterKey()), () =>
          this.searchMerriamWebster(query, limit),
        ),
      ]);

      return this.mergeResults(freeDictionary, datamuse, merriamWebster);
    });
  }

  private async searchThesaurus(query: string, limit: number): Promise<ProviderResult<ExternalThesaurusCard>> {
    const cacheKey = `thesaurus:${query}:${limit}`;
    return this.cached(cacheKey, async () => {
      const [merriamWebster, datamuse] = await Promise.all([
        this.safeProvider('Merriam-Webster Thesaurus', Boolean(this.getMerriamWebsterKey()), () =>
          this.searchMerriamWebsterThesaurus(query, limit),
        ),
        this.safeProvider('Datamuse Relations', true, () => this.searchDatamuseThesaurus(query, limit)),
      ]);

      return this.mergeResults(merriamWebster, datamuse);
    });
  }

  private async searchGrammar(text: string): Promise<ProviderResult<ExternalGrammarSuggestion>> {
    const cacheKey = `grammar:${text}`;
    return this.cached(cacheKey, async () =>
      this.safeProvider('LanguageTool', text.length > 1, async () => {
        const body = new URLSearchParams({
          text,
          language: 'en-US',
          enabledOnly: 'false',
        });

        const response = await this.fetchJson<LanguageToolResponse>('https://api.languagetool.org/v2/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        });

        return (response.matches ?? []).slice(0, 8).map((match) => ({
          message: match.message ?? 'Gợi ý chỉnh sửa câu.',
          shortMessage: match.shortMessage ?? null,
          category: match.rule?.category?.name ?? match.rule?.category?.id ?? 'Grammar',
          ruleId: match.rule?.id ?? 'unknown-rule',
          context: match.context?.text ?? text,
          replacements: (match.replacements ?? [])
            .map((replacement) => replacement.value)
            .filter((value): value is string => Boolean(value))
            .slice(0, 5),
          source: 'LanguageTool',
        }));
      }),
    );
  }

  private async searchExamples(query: string, limit: number): Promise<ProviderResult<ExternalExampleSentence>> {
    const cacheKey = `examples:${query}:${limit}`;
    return this.cached(cacheKey, async () =>
      this.safeProvider('Tatoeba Sentences', true, async () => {
        const url = new URL('https://api.tatoeba.org/v1/sentences');
        url.searchParams.set('lang', 'eng');
        url.searchParams.set('q', query);
        url.searchParams.set('is_unapproved', 'no');
        url.searchParams.set('trans:lang', 'vie');
        url.searchParams.set('showtrans:lang', 'vie');
        url.searchParams.set('limit', String(Math.min(limit, 8)));

        const response = await this.fetchJson<TatoebaSentenceResponse>(url.toString());
        return (response.data ?? [])
          .filter((item) => item.id && item.text)
          .map((item) => {
            const translations = this.flattenTatoebaTranslations(item.translations);
            const vietnameseTranslation = translations.find((translation) => translation.lang === 'vie') ?? translations[0] ?? null;
            const audioId = item.audios?.find((audio) => audio.id)?.id ?? null;

            return {
              id: String(item.id),
              sentence: item.text as string,
              translation: vietnameseTranslation?.text ?? null,
              language: item.lang ?? 'eng',
              translationLanguage: vietnameseTranslation?.lang ?? null,
              audioUrl: audioId ? `https://api.tatoeba.org/v1/audios/${audioId}/file` : null,
              source: 'Tatoeba',
              sourceUrl: `https://tatoeba.org/en/sentences/show/${item.id}`,
            };
          });
      }),
    );
  }

  private async searchImages(query: string, limit: number): Promise<ProviderResult<ExternalImageAsset>> {
    const cacheKey = `images:${query}:${limit}`;
    return this.cached(cacheKey, async () => {
      const [openverse, commons, pixabay, pexels] = await Promise.all([
        this.safeProvider('Openverse Images', true, () => this.searchOpenverseImages(query, limit)),
        this.safeProvider('Wikimedia Commons Images', true, () => this.searchWikimediaCommonsMedia(query, limit, 'image')),
        this.safeProvider('Pixabay', Boolean(this.config.get<string>('PIXABAY_API_KEY')), () =>
          this.searchPixabayImages(query, limit),
        ),
        this.safeProvider('Pexels', Boolean(this.config.get<string>('PEXELS_API_KEY')), () => this.searchPexelsImages(query, limit)),
      ]);

      return this.mergeResults(openverse, commons, pixabay, pexels);
    });
  }

  private buildVisualSearchQueries(query: string, meaning: string, context: string) {
    const raw = this.toPlainSearchText(`${query} ${meaning} ${context}`);
    const translatedHints = this.getVisualKeywordHints(query, meaning, context);
    const hasRoutine = this.hasAnyVisualPattern(raw, [
      'brush',
      'teeth',
      'tooth',
      'get up',
      'wake',
      'sleep',
      'school',
      'study',
      'daily',
      'routine',
    ]);
    const hasAnimal = this.hasAnyVisualPattern(raw, ['dog', 'cat', 'rabbit', 'turtle', 'fish', 'penguin', 'animal', 'pet']);
    const hasColor = this.hasAnyVisualPattern(raw, ['red', 'blue', 'yellow', 'green', 'circle', 'square', 'color', 'shape']);
    const hasWeather = this.hasAnyVisualPattern(raw, ['sunny', 'rainy', 'cloudy', 'windy', 'weather']);
    const hasFamily = this.hasAnyVisualPattern(raw, [
      'family',
      'father',
      'mother',
      'brother',
      'sister',
      'parent',
      'grand',
      'gia dinh',
      'bo',
      'cha',
      'me',
      'anh',
      'chi',
      'em',
    ]);
    const hasFood = this.hasAnyVisualPattern(raw, [
      'food',
      'drink',
      'milk',
      'water',
      'rice',
      'bread',
      'apple',
      'banana',
      'orange',
      'fruit',
      'eat',
      'do an',
      'thuc an',
    ]);
    const hasClassroom = this.hasAnyVisualPattern(raw, [
      'book',
      'pen',
      'pencil',
      'ruler',
      'eraser',
      'classroom',
      'school object',
      'do vat',
      'lop hoc',
    ]);

    const baseTerms = (translatedHints.length ? translatedHints : this.extractVisualTerms(`${query} ${meaning}`))
      .slice(0, 5)
      .join(' ');
    const contextTerms = this.extractVisualTerms(context).slice(0, 6).join(' ');
    const queries: string[] = [];

    if (translatedHints.length) {
      const hintTerms = translatedHints.slice(0, 4).join(' ');
      queries.push(
        hintTerms,
        translatedHints[0],
        `${hintTerms} clear educational photo`.trim(),
        `${hintTerms} isolated object photo`.trim(),
        `${hintTerms} classroom vocabulary image`.trim(),
      );
    }

    if (/brush|teeth|tooth|rang|dental/.test(raw)) {
      queries.push('toothbrush toothpaste', 'brushing teeth child', 'toothbrush');
    }

    if (/get up|wake|waking|morning|thuc day/.test(raw)) {
      queries.push('wake up morning bed child', 'child waking up bed', 'morning routine child');
    }

    if (/go to school|school|di hoc|backpack/.test(raw)) {
      queries.push('student backpack school', 'children going to school', 'school classroom student');
    }

    if (/sleep|ngu|bed|night/.test(raw)) {
      queries.push('child sleeping bed', 'sleeping child night', 'bed pillow sleep');
    }

    if (/study|homework|hoc bai|book desk/.test(raw)) {
      queries.push('student studying desk books', 'child doing homework', 'study English book');
    }

    if (hasFamily) {
      queries.push('family parents children', 'family portrait parents child', 'father mother child family');
    }

    if (hasFood) {
      queries.push('milk food drink child', 'healthy food and drinks', 'children eating food');
    }

    if (hasClassroom) {
      queries.push('classroom objects book pencil', 'school supplies book pen', 'student desk book pencil');
    }

    if (hasRoutine) {
      queries.push(`${baseTerms} ${contextTerms} child student daily routine educational photo`.trim());
    }

    if (hasAnimal) {
      queries.push(`${baseTerms} ${contextTerms} animal pet clear educational photo`.trim());
    }

    if (hasColor) {
      queries.push(`${baseTerms} ${contextTerms} color shape object educational photo`.trim());
    }

    if (hasWeather) {
      queries.push(`${baseTerms} ${contextTerms} weather scene educational photo`.trim());
    }

    queries.push(
      `${baseTerms} ${contextTerms} clear educational vocabulary photo`.trim(),
      baseTerms,
      query,
    );

    return Array.from(new Set(queries.map((item) => item.replace(/\s+/g, ' ').trim()).filter((item) => item.length >= 2))).slice(
      0,
      6,
    );
  }

  private getVisualKeywordHints(...values: string[]) {
    const raw = this.toPlainSearchText(values.join(' '));
    const hints = visualTranslationRules.flatMap((rule) =>
      rule.patterns.some((pattern) => this.hasVisualPattern(raw, pattern)) ? rule.terms : [],
    );

    return Array.from(new Set(hints.flatMap((hint) => this.extractVisualTerms(hint)))).slice(0, 8);
  }

  private hasVisualPattern(raw: string, pattern: string) {
    const normalizedPattern = this.toPlainSearchText(pattern);
    if (!normalizedPattern) return false;
    const escaped = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(raw);
  }

  private hasAnyVisualPattern(raw: string, patterns: string[]) {
    return patterns.some((pattern) => this.hasVisualPattern(raw, pattern));
  }

  private toPlainSearchText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private uniqueImages(images: ExternalImageAsset[]) {
    const seen = new Set<string>();
    return images.filter((image) => {
      const key = image.thumbnailUrl ?? image.imageUrl;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private extractVisualTerms(value: string) {
    const stopWords = new Set([
      'english',
      'vocabulary',
      'illustration',
      'lesson',
      'learning',
      'children',
      'child',
      'photo',
      'image',
      'the',
      'and',
      'with',
      'this',
      'that',
      'my',
      'your',
      'for',
      'mau',
      'cau',
      'hoc',
      'nghia',
      'tieng',
      'viet',
    ]);

    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .split(/[^a-z0-9-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 1 && !stopWords.has(word));
  }

  private scoreImageMetadata(item: ExternalImageAsset, query: string, meaning: string, context: string) {
    const haystack = this.toPlainSearchText(`${item.title} ${item.source} ${item.creator ?? ''}`);
    const translatedHints = this.getVisualKeywordHints(query, meaning, context);
    const terms = translatedHints.length
      ? [...translatedHints, ...this.extractVisualTerms(`${query} ${meaning} ${context}`)]
      : this.extractVisualTerms(`${query} ${meaning} ${context}`);
    const uniqueTerms = Array.from(new Set(terms));
    let score = 32;

    for (const term of uniqueTerms) {
      if (haystack.includes(term)) {
        score += term.length > 4 ? 12 : 8;
      }
    }

    if (/svg|emoji|icon|logo|clipart|cartoon|sticker/.test(haystack)) score -= 26;
    if (/movie|licensed|toy|brand|youtube|channel|merchandise/.test(haystack)) score -= 18;
    if (/stock|photo|photograph|commons|flickr/.test(haystack)) score += 4;

    if (translatedHints.includes('orange') || translatedHints.includes('citrus')) {
      if (/orange|citrus|fruit|tangerine|mandarin/.test(haystack)) score += 34;
      if (/camshaft|cam gear|distributor cam|camera|webcam|mechanical|engine|gear|tricameral/.test(haystack)) score -= 60;
    }

    if (translatedHints.includes('chair')) {
      if (/chair|seat|furniture/.test(haystack)) score += 30;
      if (/chairman|chairperson|committee/.test(haystack)) score -= 35;
    }

    if (translatedHints.includes('book')) {
      if (/book|textbook|notebook|pages|library/.test(haystack)) score += 28;
      if (/booking|facebook|comic convention/.test(haystack)) score -= 32;
    }

    if (translatedHints.includes('pen')) {
      if (/pen|ballpoint|stationery|writing/.test(haystack)) score += 28;
      if (/peninsula|penguin|penitentiary/.test(haystack)) score -= 32;
    }

    if (translatedHints.some((term) => ['dog', 'cat', 'rabbit', 'turtle', 'fish', 'penguin', 'pig'].includes(term))) {
      if (/animal|wildlife|pet|zoo|species/.test(haystack)) score += 16;
      if (/logo|mascot|team|toy|costume/.test(haystack)) score -= 20;
    }

    const rawContext = this.toPlainSearchText(`${query} ${meaning} ${context}`);

    if (/brush|teeth|tooth/.test(rawContext)) {
      if (/tooth|teeth|dental|bathroom|brush/.test(haystack)) score += 28;
      if (/paint|makeup|hair|artist|wall/.test(haystack)) score -= 34;
      if (/toothbrush.*toothpaste|toothpaste.*toothbrush|dental care/.test(haystack)) score += 12;
    }

    if (/get up|wake|waking/.test(rawContext)) {
      if (/wake|waking|bed|morning|sleep/.test(haystack)) score += 24;
      if (/exercise|stand up|business/.test(haystack)) score -= 20;
    }

    if (/go to school|school/.test(rawContext)) {
      if (/school|student|backpack|classroom/.test(haystack)) score += 26;
      if (/office|university building/.test(haystack)) score -= 10;
    }

    if (/sleep/.test(rawContext)) {
      if (/sleep|bed|night|pillow/.test(haystack)) score += 26;
      if (/animal|sleeping bag/.test(haystack)) score -= 8;
    }

    if (/study/.test(rawContext)) {
      if (/study|student|book|desk|learn|homework/.test(haystack)) score += 26;
      if (/scientific study|research graph/.test(haystack)) score -= 14;
    }

    if (item.thumbnailUrl) score += 4;
    if (item.source === 'Wikimedia Commons') score += 3;
    if (item.source === 'Pexels' || item.source === 'Pixabay') score += 5;

    return this.clampScore(score);
  }

  private clampScore(score: number) {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private async rankImagesWithOpenAi(
    candidates: Array<ExternalImageAsset & { metadataScore: number }>,
    query: string,
    meaning: string,
    context: string,
  ): Promise<AiImageScore[]> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) return [];

    const model = this.config.get<string>('OPENAI_VISION_MODEL') ?? 'gpt-4.1-mini';
    const candidateText = candidates
      .map(
        (candidate, index) =>
          `${index}. title="${candidate.title}", source="${candidate.source}", metadataScore=${candidate.metadataScore}`,
      )
      .join('\n');

    const payload = {
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Bạn là bộ lọc ảnh cho app học tiếng Anh thiếu nhi. Chấm từng ảnh xem có phù hợp để minh họa từ vựng không.\n` +
                `Từ/cụm từ: ${query}\nNghĩa tiếng Việt: ${meaning || 'không có'}\nNgữ cảnh bài học: ${context || 'không có'}\n` +
                `Ứng viên:\n${candidateText}\n` +
                `Trả về JSON thuần, không markdown: {"items":[{"index":0,"score":0-100,"isMatch":true,"reason":"ngắn gọn tiếng Việt","tags":["..."]}]}. ` +
                `Phạt nặng ảnh sai nghĩa, ảnh chữ nhiều, ảnh trừu tượng, ảnh không phù hợp trẻ em.`,
            },
            ...candidates.map((candidate) => ({
              type: 'input_image',
              image_url: candidate.thumbnailUrl ?? candidate.imageUrl,
              detail: 'low',
            })),
          ],
        },
      ],
      temperature: 0.1,
      max_output_tokens: 900,
    };

    const response = await this.fetchJson<OpenAiVisionRankingResponse>('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const outputText = this.extractOpenAiOutputText(response);
    const parsed = JSON.parse(outputText) as { items?: AiImageScore[] };

    return (parsed.items ?? [])
      .filter((item) => Number.isInteger(item.index))
      .map((item) => ({
        index: item.index,
        score: this.clampScore(Number(item.score ?? 0)),
        isMatch: Boolean(item.isMatch),
        reason: this.clean(item.reason ?? 'AI đã phân tích ảnh.'),
        tags: Array.isArray(item.tags) ? item.tags.map((tag) => this.clean(String(tag))).filter(Boolean).slice(0, 6) : [],
      }));
  }

  private extractOpenAiOutputText(response: OpenAiVisionRankingResponse) {
    if (response.output_text) return response.output_text.trim();

    const text = response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? '')
      .find((content) => content.trim().length > 0);

    if (!text) {
      throw new Error('OpenAI không trả về nội dung phân tích ảnh.');
    }

    return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  }

  private async searchAudio(query: string, limit: number): Promise<ProviderResult<ExternalAudioAsset>> {
    const cacheKey = `audio:${query}:${limit}`;
    return this.cached(cacheKey, async () => {
      const [freeDictionary, merriamWebster, openverse, commons] = await Promise.all([
        this.safeProvider('Free Dictionary Audio', true, async () => {
          const vocabulary = await this.searchFreeDictionary(query, limit);
          return vocabulary
            .filter((item) => item.audioUrl)
            .map((item) => ({
              title: `${item.word}${item.pronunciation ? ` ${item.pronunciation}` : ''}`,
              audioUrl: item.audioUrl as string,
              source: 'Free Dictionary',
              creator: 'dictionaryapi.dev',
              license: 'Public API',
              sourceUrl: item.sourceUrl,
              description: item.meaning,
            }));
        }),
        this.safeProvider('Merriam-Webster Audio', Boolean(this.getMerriamWebsterKey()), async () => {
          const vocabulary = await this.searchMerriamWebster(query, limit);
          return vocabulary
            .filter((item) => item.audioUrl)
            .map((item) => ({
              title: `${item.word}${item.pronunciation ? ` ${item.pronunciation}` : ''}`,
              audioUrl: item.audioUrl as string,
              source: 'Merriam-Webster',
              creator: 'Merriam-Webster',
              license: 'Dictionary API license',
              sourceUrl: item.sourceUrl,
              description: item.meaning,
            }));
        }),
        this.safeProvider('Openverse Audio', true, () => this.searchOpenverseAudio(query, limit)),
        this.safeProvider('Wikimedia Commons Audio', true, () => this.searchWikimediaCommonsMedia(query, limit, 'audio')),
      ]);

      return this.mergeResults(freeDictionary, merriamWebster, openverse, commons);
    });
  }

  private async searchVideos(query: string, limit: number): Promise<ProviderResult<ExternalVideoAsset>> {
    const cacheKey = `videos:${query}:${limit}`;
    return this.cached(cacheKey, async () => {
      const [pexels, pixabay] = await Promise.all([
        this.safeProvider('Pexels Videos', Boolean(this.config.get<string>('PEXELS_API_KEY')), () =>
          this.searchPexelsVideos(query, limit),
        ),
        this.safeProvider('Pixabay Videos', Boolean(this.config.get<string>('PIXABAY_API_KEY')), () =>
          this.searchPixabayVideos(query, limit),
        ),
      ]);

      return this.mergeResults(pexels, pixabay);
    });
  }

  private async searchDatamuse(query: string, limit: number): Promise<ExternalVocabularyItem[]> {
    const url = new URL('https://api.datamuse.com/words');
    url.searchParams.set('ml', query);
    url.searchParams.set('max', String(limit));
    url.searchParams.set('md', 'dp');

    const words = await this.fetchJson<DatamuseWord[]>(url.toString());
    return words
      .filter((item) => item.word)
      .map((item) => ({
        word: item.word as string,
        meaning: this.formatDatamuseDefinition(item.defs?.[0]) ?? 'Từ liên quan theo ngữ nghĩa.',
        pronunciation: null,
        example: null,
        audioUrl: null,
        source: 'Datamuse',
        sourceUrl: 'https://www.datamuse.com/api/',
        score: typeof item.score === 'number' ? item.score : null,
        tags: item.tags ?? [],
      }));
  }

  private async searchFreeDictionary(query: string, limit: number): Promise<ExternalVocabularyItem[]> {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`;
    const entries = await this.fetchJson<FreeDictionaryEntry[]>(url);

    return entries.slice(0, limit).flatMap((entry) => {
      const audioUrl = this.normalizeExternalUrl(entry.phonetics?.find((phonetic) => phonetic.audio)?.audio ?? null);
      const pronunciation = entry.phonetic ?? entry.phonetics?.find((phonetic) => phonetic.text)?.text ?? null;

      return (entry.meanings ?? []).slice(0, 3).flatMap((meaning) =>
        (meaning.definitions ?? []).slice(0, 2).map((definition) => ({
          word: entry.word ?? query,
          meaning: definition.definition ?? 'Định nghĩa từ điển miễn phí.',
          pronunciation,
          example: definition.example ?? null,
          audioUrl,
          source: 'Free Dictionary',
          sourceUrl: 'https://dictionaryapi.dev/',
          score: null,
          tags: [meaning.partOfSpeech, ...(definition.synonyms ?? []).slice(0, 4)].filter((tag): tag is string => Boolean(tag)),
        })),
      );
    });
  }

  private async searchMerriamWebster(query: string, limit: number): Promise<ExternalVocabularyItem[]> {
    const key = this.getMerriamWebsterKey();
    if (!key) return [];

    const url = new URL(`https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(query)}`);
    url.searchParams.set('key', key);

    const entries = await this.fetchJson<Array<MerriamWebsterEntry | string>>(url.toString());
    return entries.slice(0, limit).map((entry) => {
      if (typeof entry === 'string') {
        return {
          word: entry,
          meaning: 'Gợi ý chính tả hoặc từ gần giống trong từ điển.',
          pronunciation: null,
          example: null,
          audioUrl: null,
          source: 'Merriam-Webster',
          sourceUrl: 'https://dictionaryapi.com/products/api-learners-dictionary',
          score: null,
          tags: ['spelling-suggestion'],
        };
      }

      const pronunciation = entry.hwi?.prs?.[0]?.mw ?? null;
      const audioCode = entry.hwi?.prs?.find((item) => item.sound?.audio)?.sound?.audio ?? null;
      const definition = entry.shortdef?.[0] ?? 'Định nghĩa từ điển học thuật.';

      return {
        word: (entry.hwi?.hw ?? entry.meta?.id ?? query).replaceAll('*', ''),
        meaning: definition,
        pronunciation,
        example: entry.shortdef?.[1] ?? null,
        audioUrl: audioCode ? this.buildMerriamWebsterAudioUrl(audioCode) : null,
        source: 'Merriam-Webster',
        sourceUrl: 'https://dictionaryapi.com/products/api-learners-dictionary',
        score: null,
        tags: [entry.fl ?? 'dictionary'].filter(Boolean),
      };
    });
  }

  private async searchMerriamWebsterThesaurus(query: string, limit: number): Promise<ExternalThesaurusCard[]> {
    const key = this.getMerriamWebsterKey();
    if (!key) return [];

    const url = new URL(`https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${encodeURIComponent(query)}`);
    url.searchParams.set('key', key);

    const entries = await this.fetchJson<Array<MerriamWebsterThesaurusEntry | string>>(url.toString());
    const cards: ExternalThesaurusCard[] = [];

    for (const entry of entries.slice(0, Math.max(1, limit))) {
      if (typeof entry === 'string') {
        cards.push({
          word: entry,
          relation: 'Related',
          partOfSpeech: null,
          definition: 'Gợi ý chính tả hoặc từ gần nghĩa trong thesaurus.',
          examples: [query],
          source: 'Merriam-Webster',
          sourceUrl: 'https://dictionaryapi.com/products/api-collegiate-thesaurus',
        });
        continue;
      }

      const baseWord = (entry.hwi?.hw ?? entry.meta?.id ?? query).replaceAll('*', '');
      const definition =
        entry.shortdef?.[0] ??
        this.extractMerriamThesaurusDefinition(entry) ??
        'Từ gần nghĩa được gợi ý bởi Merriam-Webster.';
      const sourceUrl = 'https://dictionaryapi.com/products/api-collegiate-thesaurus';
      const partOfSpeech = entry.fl ?? null;

      const relationGroups: Array<{ relation: ExternalThesaurusCard['relation']; words: string[] }> = [
        { relation: 'Synonym', words: (entry.meta?.syns ?? []).flat() },
        { relation: 'Antonym', words: (entry.meta?.ants ?? []).flat() },
        { relation: 'Related', words: this.extractMerriamThesaurusRelatedWords(entry) },
      ];

      for (const relationGroup of relationGroups) {
        const uniqueWords = Array.from(
          new Set(
            relationGroup.words
              .map((word) => this.clean(String(word)).replaceAll('*', ''))
              .filter((word) => Boolean(word) && word.toLowerCase() !== baseWord.toLowerCase()),
          ),
        ).slice(0, limit);

        for (const word of uniqueWords) {
          cards.push({
            word,
            relation: relationGroup.relation,
            partOfSpeech,
            definition,
            examples: [baseWord, ...uniqueWords.filter((candidate) => candidate !== word).slice(0, 3)].slice(0, 4),
            source: 'Merriam-Webster',
            sourceUrl,
          });

          if (cards.length >= limit) {
            return cards;
          }
        }
      }
    }

    return cards;
  }

  private async searchDatamuseThesaurus(query: string, limit: number): Promise<ExternalThesaurusCard[]> {
    const [synonyms, antonyms, related] = await Promise.all([
      this.safeProvider('Datamuse Synonyms', true, () => this.searchDatamuseRelation(query, 'rel_syn', 'Synonym', limit)),
      this.safeProvider('Datamuse Antonyms', true, () => this.searchDatamuseRelation(query, 'rel_ant', 'Antonym', limit)),
      this.safeProvider('Datamuse Related', true, () => this.searchDatamuseRelation(query, 'rel_trg', 'Related', limit)),
    ]);

    return this.mergeResults(synonyms, antonyms, related).items;
  }

  private async searchDatamuseRelation(
    query: string,
    relationKey: 'rel_syn' | 'rel_ant' | 'rel_trg',
    relation: ExternalThesaurusCard['relation'],
    limit: number,
  ): Promise<ExternalThesaurusCard[]> {
    const url = new URL('https://api.datamuse.com/words');
    url.searchParams.set(relationKey, query);
    url.searchParams.set('max', String(limit));
    url.searchParams.set('md', 'dp');

    const words = await this.fetchJson<DatamuseWord[]>(url.toString());
    return words
      .filter((item) => item.word)
      .map((item) => ({
        word: item.word as string,
        relation,
        partOfSpeech: this.extractDatamusePartOfSpeech(item.tags),
        definition: this.formatDatamuseDefinition(item.defs?.[0]) ?? this.datamuseRelationDescription(relation),
        examples: [query],
        source: 'Datamuse',
        sourceUrl: 'https://www.datamuse.com/api/',
      }))
      .slice(0, limit);
  }

  private async searchKnowledge(query: string): Promise<ProviderResult<ExternalKnowledgeCard>> {
    const cacheKey = `knowledge:${query}`;
    return this.cached(cacheKey, async () =>
      this.safeProvider('Wikipedia Summary', true, async () => {
        const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
        searchUrl.searchParams.set('action', 'opensearch');
        searchUrl.searchParams.set('search', query);
        searchUrl.searchParams.set('limit', '2');
        searchUrl.searchParams.set('namespace', '0');
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('origin', '*');

        const search = await this.fetchJson<WikipediaOpenSearchResponse>(searchUrl.toString());
        const titles = search[1]?.length ? search[1] : [query];

        const cards = await Promise.all(
          titles.slice(0, 2).map(async (title) => {
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
            const summary = await this.fetchJson<WikipediaSummaryResponse>(summaryUrl);
            if (!summary.extract) return null;

            return {
              title: summary.title ?? title,
              extract: summary.extract,
              source: 'Wikipedia',
              sourceUrl: summary.content_urls?.desktop?.page ?? null,
              thumbnailUrl: summary.thumbnail?.source ?? null,
            };
          }),
        );

        return cards.filter((card): card is ExternalKnowledgeCard => Boolean(card));
      }),
    );
  }

  private async searchOpenverseImages(query: string, limit: number): Promise<ExternalImageAsset[]> {
    const url = new URL('https://api.openverse.org/v1/images/');
    url.searchParams.set('q', query);
    url.searchParams.set('page_size', String(limit));
    url.searchParams.set('mature', 'false');

    const response = await this.fetchJson<OpenverseMediaResponse>(url.toString());
    return (response.results ?? [])
      .filter((item) => item.url)
      .map((item) => ({
        title: item.title ?? query,
        imageUrl: item.url as string,
        thumbnailUrl: item.thumbnail ?? item.url ?? null,
        source: 'Openverse',
        creator: item.creator ?? null,
        license: item.license ?? null,
        sourceUrl: item.foreign_landing_url ?? item.url ?? null,
      }));
  }

  private async searchWikimediaCommonsMedia(query: string, limit: number, mediaType: 'image'): Promise<ExternalImageAsset[]>;
  private async searchWikimediaCommonsMedia(query: string, limit: number, mediaType: 'audio'): Promise<ExternalAudioAsset[]>;
  private async searchWikimediaCommonsMedia(
    query: string,
    limit: number,
    mediaType: 'image' | 'audio',
  ): Promise<Array<ExternalImageAsset | ExternalAudioAsset>> {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrsearch', `${query} ${mediaType === 'audio' ? 'audio pronunciation' : ''}`.trim());
    url.searchParams.set('gsrnamespace', '6');
    url.searchParams.set('gsrlimit', String(Math.min(limit, 10)));
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|mime|extmetadata');
    url.searchParams.set('iiurlwidth', '520');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const response = await this.fetchJson<WikimediaCommonsResponse>(url.toString());
    const pages = Object.values(response.query?.pages ?? {});

    return pages.flatMap((page): Array<ExternalImageAsset | ExternalAudioAsset> => {
      const info = page.imageinfo?.[0];
      if (!info?.url) return [];

      const isAudio = info.mime?.startsWith('audio/');
      const isImage = info.mime?.startsWith('image/');
      if (mediaType === 'audio' && !isAudio) return [];
      if (mediaType === 'image' && !isImage) return [];

      const title = (page.title ?? query).replace(/^File:/, '');
      const creator = this.stripHtml(info.extmetadata?.Artist?.value ?? info.extmetadata?.Credit?.value ?? '') || null;
      const license = this.stripHtml(info.extmetadata?.LicenseShortName?.value ?? '') || null;
      const sourceUrl = info.descriptionurl ?? (this.stripHtml(info.extmetadata?.LicenseUrl?.value ?? '') || info.url);

      if (mediaType === 'audio') {
        return [
          {
            title,
            audioUrl: info.url,
            source: 'Wikimedia Commons',
            creator,
            license,
            sourceUrl,
            description: 'Audio mở từ Wikimedia Commons.',
          } as ExternalAudioAsset,
        ];
      }

      return [
        {
          title,
          imageUrl: info.url,
          thumbnailUrl: info.thumburl ?? info.url,
          source: 'Wikimedia Commons',
          creator,
          license,
          sourceUrl,
        } as ExternalImageAsset,
      ];
    });
  }

  private async searchPixabayImages(query: string, limit: number): Promise<ExternalImageAsset[]> {
    const key = this.config.get<string>('PIXABAY_API_KEY');
    if (!key) return [];

    const url = new URL('https://pixabay.com/api/');
    url.searchParams.set('key', key);
    url.searchParams.set('q', query);
    url.searchParams.set('image_type', 'photo');
    url.searchParams.set('safesearch', 'true');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('per_page', String(limit));

    const response = await this.fetchJson<PixabayResponse>(url.toString());
    return (response.hits ?? [])
      .filter((item) => item.webformatURL)
      .map((item) => ({
        title: item.tags ?? query,
        imageUrl: item.largeImageURL ?? (item.webformatURL as string),
        thumbnailUrl: item.previewURL ?? item.webformatURL ?? null,
        source: 'Pixabay',
        creator: item.user ?? null,
        license: 'Pixabay Content License',
        sourceUrl: item.pageURL ?? null,
      }));
  }

  private async searchPexelsImages(query: string, limit: number): Promise<ExternalImageAsset[]> {
    const key = this.config.get<string>('PEXELS_API_KEY');
    if (!key) return [];

    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(limit));

    const response = await this.fetchJson<PexelsResponse>(url.toString(), {
      headers: {
        Authorization: key,
      },
    });

    return (response.photos ?? [])
      .filter((item) => item.src?.medium)
      .map((item) => ({
        title: item.alt ?? query,
        imageUrl: item.src?.large ?? (item.src?.medium as string),
        thumbnailUrl: item.src?.medium ?? null,
        source: 'Pexels',
        creator: item.photographer ?? null,
        license: 'Pexels License',
        sourceUrl: item.url ?? item.photographer_url ?? null,
      }));
  }

  private async searchPexelsVideos(query: string, limit: number): Promise<ExternalVideoAsset[]> {
    const key = this.config.get<string>('PEXELS_API_KEY');
    if (!key) return [];

    const url = new URL('https://api.pexels.com/v1/videos/search');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(limit));

    const response = await this.fetchJson<PexelsVideoResponse>(url.toString(), {
      headers: {
        Authorization: key,
      },
    });

    return (response.videos ?? [])
      .filter((item) => item.video_files?.length)
      .map((item) => {
        const videoFiles = (item.video_files ?? [])
          .filter((file) => file.link && file.file_type === 'video/mp4')
          .sort((left, right) => (right.width ?? 0) - (left.width ?? 0));
        const primaryFile = videoFiles.find((file) => file.quality === 'hd') ?? videoFiles[0];

        return {
          title: query,
          videoUrl: primaryFile?.link ?? '',
          previewUrl: item.image ?? null,
          thumbnailUrl: item.image ?? null,
          source: 'Pexels',
          creator: item.user?.name ?? null,
          license: 'Pexels License',
          sourceUrl: item.url ?? item.user?.url ?? null,
          duration: typeof item.duration === 'number' ? item.duration : null,
          width: typeof item.width === 'number' ? item.width : null,
          height: typeof item.height === 'number' ? item.height : null,
        };
      })
      .filter((item) => Boolean(item.videoUrl));
  }

  private async searchPixabayVideos(query: string, limit: number): Promise<ExternalVideoAsset[]> {
    const key = this.config.get<string>('PIXABAY_API_KEY');
    if (!key) return [];

    const url = new URL('https://pixabay.com/api/videos/');
    url.searchParams.set('key', key);
    url.searchParams.set('q', query);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('safesearch', 'true');
    url.searchParams.set('video_type', 'all');
    url.searchParams.set('per_page', String(limit));

    const response = await this.fetchJson<PixabayVideoResponse>(url.toString());
    return (response.hits ?? [])
      .map((item) => {
        const video = item.videos?.medium ?? item.videos?.small ?? item.videos?.tiny ?? item.videos?.large;
        return {
          title: item.tags ?? query,
          videoUrl: video?.url ?? '',
          previewUrl: video?.thumbnail ?? item.userImageURL ?? null,
          thumbnailUrl: video?.thumbnail ?? item.userImageURL ?? null,
          source: 'Pixabay',
          creator: item.user ?? null,
          license: 'Pixabay Content License',
          sourceUrl: item.pageURL ?? null,
          duration: typeof item.duration === 'number' ? item.duration : null,
          width: typeof video?.width === 'number' ? video.width : null,
          height: typeof video?.height === 'number' ? video.height : null,
        };
      })
      .filter((item) => Boolean(item.videoUrl));
  }

  private async searchOpenverseAudio(query: string, limit: number): Promise<ExternalAudioAsset[]> {
    const url = new URL('https://api.openverse.org/v1/audio/');
    url.searchParams.set('q', query);
    url.searchParams.set('page_size', String(Math.min(limit, 8)));
    url.searchParams.set('mature', 'false');

    const response = await this.fetchJson<OpenverseMediaResponse>(url.toString());
    return (response.results ?? [])
      .filter((item) => item.url)
      .map((item) => ({
        title: item.title ?? query,
        audioUrl: item.url as string,
        source: 'Openverse',
        creator: item.creator ?? null,
        license: item.license ?? null,
        sourceUrl: item.foreign_landing_url ?? item.url ?? null,
        description: item.source ?? 'Audio mở từ Openverse.',
      }));
  }

  private async safeProvider<T>(
    label: string,
    enabled: boolean,
    loader: () => Promise<T[]>,
  ): Promise<ProviderResult<T>> {
    if (!enabled) {
      return { items: [], warnings: [] };
    }

    try {
      return { items: await loader(), warnings: [] };
    } catch (error) {
      return {
        items: [],
        warnings: [`${label} chưa phản hồi ổn định: ${error instanceof Error ? error.message : 'không xác định'}.`],
      };
    }
  }

  private mergeResults<T>(...results: ProviderResult<T>[]): ProviderResult<T> {
    return {
      items: results.flatMap((result) => result.items),
      warnings: results.flatMap((result) => result.warnings),
    };
  }

  private async cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const current = this.cache.get(key) as CacheEntry<T> | undefined;
    if (current && current.expiresAt > Date.now()) {
      return current.value;
    }

    const value = await loader();
    this.cache.set(key, {
      expiresAt: Date.now() + this.cacheTtlMs,
      value,
    });
    return value;
  }

  private async fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = new Headers(init.headers);
      if (!headers.has('User-Agent')) {
        headers.set('User-Agent', 'EnglishProLearningSystem/0.1 educational-image-integration');
      }
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(`${response.status} ${message}`.trim());
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildMerriamWebsterAudioUrl(audioCode: string) {
    const audio = audioCode.trim();
    if (!audio) return null;

    let directory = audio[0].toLowerCase();
    if (audio.startsWith('bix')) {
      directory = 'bix';
    } else if (audio.startsWith('gg')) {
      directory = 'gg';
    } else if (/^[^a-z]/i.test(audio)) {
      directory = 'number';
    }

    return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${directory}/${audio}.mp3`;
  }

  private normalizeExternalUrl(url?: string | null) {
    if (!url) return null;
    if (url.startsWith('//')) return `https:${url}`;
    return url;
  }

  private formatDatamuseDefinition(definition?: string) {
    if (!definition) return null;
    const [, ...parts] = definition.split('\t');
    return parts.join(' ').trim() || definition;
  }

  private stripHtml(value?: string | null) {
    if (!value) return '';
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/\{\/?[a-z]+\}/gi, '')
      .replace(/\{[^}]+\}/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getMerriamWebsterKey() {
    return (
      this.config.get<string>('MERRIAM_WEBSTER_LEARNERS_KEY') ??
      this.config.get<string>('MERRIAM_WEBSTER_API_KEY') ??
      this.config.get<string>('MW_LEARNERS_KEY') ??
      ''
    );
  }

  private clean(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private flattenTatoebaTranslations(translations: TatoebaTranslationGroup[] = []) {
    return translations
      .flatMap((translationGroup) => (Array.isArray(translationGroup) ? translationGroup : [translationGroup]))
      .filter(
        (translation): translation is TatoebaTranslation =>
          Boolean(translation?.text && translation.lang),
      );
  }

  private extractDatamusePartOfSpeech(tags?: string[]) {
    const part = (tags ?? []).find((tag) => ['n', 'v', 'adj', 'adv', 'pron', 'prep', 'conj', 'u'].includes(tag));
    if (!part) return null;

    const map: Record<string, string> = {
      n: 'Noun',
      v: 'Verb',
      adj: 'Adjective',
      adv: 'Adverb',
      pron: 'Pronoun',
      prep: 'Preposition',
      conj: 'Conjunction',
      u: 'Unknown',
    };

    return map[part] ?? part;
  }

  private datamuseRelationDescription(relation: ExternalThesaurusCard['relation']) {
    if (relation === 'Synonym') return 'Từ đồng nghĩa gợi ý từ Datamuse.';
    if (relation === 'Antonym') return 'Từ trái nghĩa gợi ý từ Datamuse.';
    return 'Từ liên quan gợi ý từ Datamuse.';
  }

  private extractMerriamThesaurusDefinition(entry: MerriamWebsterThesaurusEntry) {
    for (const block of entry.def ?? []) {
      for (const sequence of block.sseq ?? []) {
        for (const sense of sequence ?? []) {
          const senseBody = (sense?.[1] ?? {}) as {
            dt?: Array<[string, unknown]>;
          };
          const textEntry = senseBody.dt?.find((item) => item[0] === 'text')?.[1];
          if (typeof textEntry === 'string' && textEntry.trim()) {
            return this.stripHtml(textEntry);
          }
        }
      }
    }

    return null;
  }

  private extractMerriamThesaurusRelatedWords(entry: MerriamWebsterThesaurusEntry) {
    const words = new Set<string>();

    for (const block of entry.def ?? []) {
      for (const sequence of block.sseq ?? []) {
        for (const sense of sequence ?? []) {
          const senseBody = (sense?.[1] ?? {}) as {
            rel_list?: Array<Array<{ wd?: string }>>;
          };
          for (const relationGroup of senseBody.rel_list ?? []) {
            for (const relationWord of relationGroup ?? []) {
              if (relationWord.wd) {
                words.add(this.clean(relationWord.wd).replaceAll('*', ''));
              }
            }
          }
        }
      }
    }

    return Array.from(words);
  }

  private async recordActivity(
    userId: string,
    query: string,
    stats: {
      vocabulary: number;
      grammar: number;
      examples: number;
      images: number;
      audio: number;
      videos: number;
      knowledge: number;
      thesaurus: number;
    },
  ) {
    const description = `Tra cứu đa nguồn "${query}" - từ vựng ${stats.vocabulary}, ngữ pháp ${stats.grammar}, ví dụ ${stats.examples}, ảnh ${stats.images}, audio ${stats.audio}, video ${stats.videos}, tri thức ${stats.knowledge}, thesaurus ${stats.thesaurus}.`;

    try {
      await this.prisma.$executeRaw`
        INSERT INTO nhatkyhoatdong ("maNguoiDung", "hanhDong", "loaiDoiTuong", "maDoiTuong", "moTa")
        VALUES (${userId}::uuid, 'TichHopNoiDungNgoai', 'NguonNoiDungNgoai', NULL, ${description})
      `;
    } catch {
      // Ghi log chỉ là phụ trợ, không được làm hỏng trải nghiệm tra cứu nội dung.
    }
  }
}
