export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type ContentProviderState = {
  code: string;
  name: string;
  category: 'TuVung' | 'NguPhap' | 'HinhAnh' | 'Audio' | 'Video' | 'TriThuc' | 'DaPhuongTien';
  enabled: boolean;
  ready: boolean;
  requiresKey: boolean;
  endpoint: string;
  note: string;
};

export type ExternalVocabularyItem = {
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

export type ExternalGrammarSuggestion = {
  message: string;
  shortMessage: string | null;
  category: string;
  ruleId: string;
  context: string;
  replacements: string[];
  source: string;
};

export type ExternalExampleSentence = {
  id: string;
  sentence: string;
  translation: string | null;
  language: string;
  translationLanguage: string | null;
  audioUrl: string | null;
  source: string;
  sourceUrl: string | null;
};

export type ExternalImageAsset = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  source: string;
  creator: string | null;
  license: string | null;
  sourceUrl: string | null;
};

export type ZooAsset = {
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

export type ZooAssetsResponse = {
  theme: string;
  generatedAt: string;
  providers: Array<{
    name: string;
    ready: boolean;
    note: string;
  }>;
  animals: ZooAsset[];
};

export type ExternalAudioAsset = {
  title: string;
  audioUrl: string;
  source: string;
  creator: string | null;
  license: string | null;
  sourceUrl: string | null;
  description: string | null;
};

export type ExternalVideoAsset = {
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

export type ExternalKnowledgeCard = {
  title: string;
  extract: string;
  source: string;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
};

export type ExternalThesaurusCard = {
  word: string;
  relation: 'Synonym' | 'Antonym' | 'Related';
  partOfSpeech: string | null;
  definition: string | null;
  examples: string[];
  source: string;
  sourceUrl: string | null;
};

export type ContentHubExploreResponse = {
  query: string;
  text: string;
  providers: ContentProviderState[];
  vocabulary: ExternalVocabularyItem[];
  grammar: ExternalGrammarSuggestion[];
  examples: ExternalExampleSentence[];
  images: ExternalImageAsset[];
  audio: ExternalAudioAsset[];
  videos: ExternalVideoAsset[];
  knowledge: ExternalKnowledgeCard[];
  thesaurus: ExternalThesaurusCard[];
  warnings: string[];
  stats: {
    vocabulary: number;
    grammar: number;
    examples: number;
    images: number;
    audio: number;
    videos: number;
    knowledge: number;
    thesaurus: number;
  };
  generatedAt: string;
};
