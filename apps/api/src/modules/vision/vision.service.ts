import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

type VisionUploadFile = {
  originalname?: string;
  mimetype?: string;
  buffer?: Buffer;
  size?: number;
};

type VisionMatch = {
  keywords: string[];
  detectedWord: string;
  meaning: string;
  phonetic: string;
  example: string;
  contentType: string;
  vocabularyIdea: string;
  confidence: number;
};

type OpenAiVisionResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type VisionAiResult = {
  detectedWord: string;
  meaning: string;
  phonetic: string;
  example: string;
  contentType: string;
  vocabularyIdea: string;
  confidence: number;
  alternatives: string[];
  explanation: string;
};

const VISION_LIBRARY: VisionMatch[] = [
  {
    keywords: ['book', 'sach', 'sách', 'notebook', 'textbook'],
    detectedWord: 'book',
    meaning: 'quyển sách',
    phonetic: '/bʊk/',
    example: 'This is a book.',
    contentType: 'HocLieu',
    vocabularyIdea: 'Bài học đồ vật trong lớp học',
    confidence: 97,
  },
  {
    keywords: ['pen', 'but', 'bút', 'pencil', 'marker'],
    detectedWord: 'pen',
    meaning: 'cây bút',
    phonetic: '/pen/',
    example: 'This is a pen.',
    contentType: 'DoVat',
    vocabularyIdea: 'Từ vựng đồ dùng học tập',
    confidence: 96,
  },
  {
    keywords: ['chair', 'ghe', 'ghế', 'seat', 'stool', 'armchair'],
    detectedWord: 'chair',
    meaning: 'cái ghế',
    phonetic: '/tʃer/',
    example: 'This is a chair.',
    contentType: 'NoiThat',
    vocabularyIdea: 'Từ vựng đồ vật trong phòng',
    confidence: 95,
  },
  {
    keywords: ['milk', 'sua', 'sữa'],
    detectedWord: 'milk',
    meaning: 'sữa',
    phonetic: '/mɪlk/',
    example: 'I like milk.',
    contentType: 'DoAn',
    vocabularyIdea: 'Từ vựng đồ ăn và đồ uống',
    confidence: 95,
  },
  {
    keywords: ['apple', 'tao', 'táo'],
    detectedWord: 'apple',
    meaning: 'quả táo',
    phonetic: '/ˈæp.əl/',
    example: 'I eat an apple.',
    contentType: 'DoAn',
    vocabularyIdea: 'Trái cây quen thuộc',
    confidence: 94,
  },
  {
    keywords: ['cat', 'meo', 'mèo'],
    detectedWord: 'cat',
    meaning: 'con mèo',
    phonetic: '/kæt/',
    example: 'The cat is cute.',
    contentType: 'ConVat',
    vocabularyIdea: 'Động vật gần gũi',
    confidence: 93,
  },
  {
    keywords: ['dog', 'cho', 'chó'],
    detectedWord: 'dog',
    meaning: 'con chó',
    phonetic: '/dɔːɡ/',
    example: 'The dog runs fast.',
    contentType: 'ConVat',
    vocabularyIdea: 'Động vật gần gũi',
    confidence: 93,
  },
  {
    keywords: ['water', 'nuoc', 'nước'],
    detectedWord: 'water',
    meaning: 'nước',
    phonetic: '/ˈwɔː.tər/',
    example: 'I drink water.',
    contentType: 'DoAn',
    vocabularyIdea: 'Từ vựng đồ uống',
    confidence: 92,
  },
  {
    keywords: ['table', 'ban', 'bàn', 'desk'],
    detectedWord: 'table',
    meaning: 'cái bàn',
    phonetic: '/ˈteɪ.bəl/',
    example: 'The book is on the table.',
    contentType: 'NoiThat',
    vocabularyIdea: 'Từ vựng đồ vật trong phòng',
    confidence: 93,
  },
  {
    keywords: ['bag', 'backpack', 'cap sach', 'cặp sách', 'balo'],
    detectedWord: 'backpack',
    meaning: 'ba lô',
    phonetic: '/ˈbæk.pæk/',
    example: 'My backpack is blue.',
    contentType: 'HocLieu',
    vocabularyIdea: 'Từ vựng đồ dùng học tập',
    confidence: 92,
  },
  {
    keywords: ['phone', 'dien thoai', 'điện thoại', 'mobile'],
    detectedWord: 'phone',
    meaning: 'điện thoại',
    phonetic: '/foʊn/',
    example: 'This is my phone.',
    contentType: 'DoVat',
    vocabularyIdea: 'Từ vựng đồ vật hằng ngày',
    confidence: 91,
  },
];

@Injectable()
export class VisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async analyze(userId: string, file: VisionUploadFile, hint?: string) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên một hình ảnh.');
    }

    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Tập tin tải lên phải là hình ảnh.');
    }

    if (file.size && file.size > 8 * 1024 * 1024) {
      throw new BadRequestException('Ảnh quá lớn. Vui lòng dùng ảnh dưới 8MB.');
    }

    const context = this.normalize(`${hint ?? ''} ${file.originalname ?? ''} ${file.mimetype ?? ''}`);
    const hintedMatch = VISION_LIBRARY.find((item) => item.keywords.some((keyword) => context.includes(this.normalize(keyword))));
    const openAiReady = Boolean(this.config.get<string>('OPENAI_API_KEY') && file.buffer?.length);
    let result: VisionAiResult;
    let provider = 'HintVision';

    if (openAiReady) {
      try {
        result = await this.analyzeWithOpenAi(file, hint);
        provider = 'OpenAIVision';
      } catch (error) {
        result = this.buildFallbackResult(
          hintedMatch,
          error instanceof Error ? `AI chưa phản hồi ổn định: ${error.message}` : 'AI chưa phản hồi ổn định.',
        );
        provider = hintedMatch ? 'HintVision' : 'NeedsHint';
      }
    } else {
      result = this.buildFallbackResult(
        hintedMatch,
        this.config.get<string>('OPENAI_API_KEY')
          ? 'Ảnh không có buffer để gửi AI, hệ thống dùng gợi ý/tên file.'
          : 'Chưa cấu hình OPENAI_API_KEY nên hệ thống không đoán bừa từ ảnh. Hãy nhập gợi ý hoặc bật AI vision.',
      );
      provider = hintedMatch ? 'HintVision' : 'NeedsHint';
    }

    const libraryMatch = VISION_LIBRARY.find((item) => item.detectedWord === result.detectedWord);
    if (libraryMatch) {
      result = {
        ...result,
        meaning: result.meaning || libraryMatch.meaning,
        phonetic: result.phonetic || libraryMatch.phonetic,
        example: result.example || libraryMatch.example,
        contentType: result.contentType || libraryMatch.contentType,
        vocabularyIdea: result.vocabularyIdea || libraryMatch.vocabularyIdea,
      };
    }
    result = {
      ...result,
      contentType: this.normalizeContentType(result.contentType),
    };

    const imageUrl = `/uploads/vision/${file.originalname ?? 'upload-image'}`;

    await this.prisma.$executeRaw`
      INSERT INTO phantichhinhanh (
        "maNguoiDung", "tenTapTin", "duongDanAnh", "tuKhoaNhap",
        "tuKhoaNhanRa", "nghiaTiengViet", "phienAm", "cauViDu",
        "yTuongTuVung", "doTinCay", "loaiNoiDung", "nguonNhanDang"
      )
      VALUES (
        ${userId}::uuid,
        ${file.originalname ?? null},
        ${imageUrl},
        ${hint ?? null},
        ${result.detectedWord},
        ${result.meaning},
        ${result.phonetic},
        ${result.example},
        ${result.vocabularyIdea},
        ${result.confidence},
        ${result.contentType},
        ${provider}
      )
    `;

    const history = await this.getHistory(userId);
    return {
      imageUrl,
      detectedWord: result.detectedWord,
      meaning: result.meaning,
      phonetic: result.phonetic,
      example: result.example,
      contentType: result.contentType,
      vocabularyIdea: result.vocabularyIdea,
      confidence: result.confidence,
      alternatives: result.alternatives,
      explanation: result.explanation,
      provider,
      history,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.$queryRaw`
      SELECT
        pt."maPhanTich" AS id,
        pt."tenTapTin" AS "imageName",
        pt."duongDanAnh" AS "imageUrl",
        pt."tuKhoaNhap" AS "inputKeyword",
        pt."tuKhoaNhanRa" AS "detectedWord",
        pt."nghiaTiengViet" AS meaning,
        pt."phienAm" AS phonetic,
        pt."cauViDu" AS example,
        pt."yTuongTuVung" AS "vocabularyIdea",
        pt."doTinCay" AS confidence,
        pt."loaiNoiDung" AS "contentType",
        pt."nguonNhanDang" AS provider,
        pt."ngayPhanTich" AS "analyzedAt"
      FROM phantichhinhanh pt
      WHERE pt."maNguoiDung" = ${userId}::uuid
      ORDER BY pt."ngayPhanTich" DESC
      LIMIT 10
    `;
  }

  private buildFallbackResult(match: VisionMatch | undefined, explanation: string): VisionAiResult {
    if (match) {
      return {
        detectedWord: match.detectedWord,
        meaning: match.meaning,
        phonetic: match.phonetic,
        example: match.example,
        contentType: match.contentType,
        vocabularyIdea: match.vocabularyIdea,
        confidence: match.confidence,
        alternatives: [],
        explanation: 'Hệ thống nhận diện theo gợi ý/tên file và thư viện từ vựng đã cấu hình.',
      };
    }

    return {
      detectedWord: 'unknown object',
      meaning: 'chưa xác định',
      phonetic: '/ʌnˈnoʊn ˈɑːb.dʒekt/',
      example: 'I can describe this object.',
      contentType: 'CanGoiY',
      vocabularyIdea: 'Nhập gợi ý như chair, table, milk hoặc bật OpenAI Vision để nhận diện ảnh thật.',
      confidence: 34,
      alternatives: ['chair', 'table', 'book', 'backpack'],
      explanation,
    };
  }

  private async analyzeWithOpenAi(file: VisionUploadFile, hint?: string): Promise<VisionAiResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey || !file.buffer?.length) {
      throw new Error('Thiếu OPENAI_API_KEY hoặc dữ liệu ảnh.');
    }

    const mimeType = file.mimetype || 'image/jpeg';
    const model = this.config.get<string>('OPENAI_VISION_MODEL') ?? 'gpt-4.1-mini';
    const dataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
    const payload = {
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Bạn là AI nhận diện đồ vật cho app học tiếng Anh thiếu nhi. ` +
                `Hãy nhìn ảnh thật cẩn thận, nhận diện đồ vật chính, ưu tiên đồ vật gần trung tâm ảnh. ` +
                `Không được mặc định là book nếu ảnh không phải sách. Nếu là ghế, trả detectedWord là "chair". ` +
                `Gợi ý người dùng: ${hint || 'không có'}.\n` +
                `Trả về JSON thuần, không markdown: {"detectedWord":"chair","meaning":"cái ghế","phonetic":"/tʃer/","example":"This is a chair.","contentType":"NoiThat","vocabularyIdea":"Từ vựng đồ vật trong phòng","confidence":0-100,"alternatives":["..."],"explanation":"ngắn gọn tiếng Việt"}`
            },
            {
              type: 'input_image',
              image_url: dataUrl,
              detail: 'low',
            },
          ],
        },
      ],
      temperature: 0.05,
      max_output_tokens: 700,
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `OpenAI Vision lỗi ${response.status}`);
    }

    const body = (await response.json()) as OpenAiVisionResponse;
    const outputText = this.extractOpenAiOutputText(body);
    const parsed = JSON.parse(outputText) as Partial<VisionAiResult>;

    const detectedWord = this.cleanText(parsed.detectedWord ?? 'unknown object').toLowerCase();
    return {
      detectedWord,
      meaning: this.cleanText(parsed.meaning ?? 'chưa xác định'),
      phonetic: this.cleanText(parsed.phonetic ?? ''),
      example: this.cleanText(parsed.example ?? `This is a ${detectedWord}.`),
      contentType: this.cleanText(parsed.contentType ?? 'DoVat'),
      vocabularyIdea: this.cleanText(parsed.vocabularyIdea ?? 'Từ vựng đồ vật hằng ngày'),
      confidence: this.clampConfidence(Number(parsed.confidence ?? 70)),
      alternatives: Array.isArray(parsed.alternatives)
        ? parsed.alternatives.map((item) => this.cleanText(String(item))).filter(Boolean).slice(0, 5)
        : [],
      explanation: this.cleanText(parsed.explanation ?? 'AI đã phân tích ảnh và chọn đồ vật nổi bật nhất.'),
    };
  }

  private extractOpenAiOutputText(response: OpenAiVisionResponse) {
    if (response.output_text) return this.stripJsonFence(response.output_text);

    const text = response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? '')
      .find((content) => content.trim().length > 0);

    if (!text) {
      throw new Error('OpenAI không trả về kết quả nhận diện.');
    }

    return this.stripJsonFence(text);
  }

  private stripJsonFence(value: string) {
    return value.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  private cleanText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeContentType(value: string) {
    const normalized = this.normalize(value);
    const allowed = new Set(['DoVat', 'ConVat', 'DoAn', 'NoiThat', 'HocLieu', 'Khac']);
    const aliases: Record<string, string> = {
      dovat: 'DoVat',
      object: 'DoVat',
      thing: 'DoVat',
      convat: 'ConVat',
      animal: 'ConVat',
      doan: 'DoAn',
      food: 'DoAn',
      drink: 'DoAn',
      noithat: 'NoiThat',
      furniture: 'NoiThat',
      hoclieu: 'HocLieu',
      school: 'HocLieu',
      learning: 'HocLieu',
      candinhdanh: 'Khac',
      cangoiy: 'Khac',
      unknown: 'Khac',
      other: 'Khac',
      khac: 'Khac',
    };
    const direct = allowed.has(value) ? value : null;
    return direct ?? aliases[normalized.replace(/[^a-z]/g, '')] ?? 'Khac';
  }

  private clampConfidence(value: number) {
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  }
}
