import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type VisionUploadFile = {
  originalname?: string;
  mimetype?: string;
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

const VISION_LIBRARY: VisionMatch[] = [
  {
    keywords: ['book', 'sach'],
    detectedWord: 'book',
    meaning: 'quyển sách',
    phonetic: '/bʊk/',
    example: 'This is a book.',
    contentType: 'HocLieu',
    vocabularyIdea: 'Bài học đồ vật trong lớp học',
    confidence: 97,
  },
  {
    keywords: ['pen', 'but'],
    detectedWord: 'pen',
    meaning: 'cây bút',
    phonetic: '/pen/',
    example: 'This is a pen.',
    contentType: 'DoVat',
    vocabularyIdea: 'Từ vựng đồ dùng học tập',
    confidence: 96,
  },
  {
    keywords: ['chair', 'ghe'],
    detectedWord: 'chair',
    meaning: 'cái ghế',
    phonetic: '/tʃer/',
    example: 'This is a chair.',
    contentType: 'NoiThat',
    vocabularyIdea: 'Từ vựng đồ vật trong phòng',
    confidence: 95,
  },
  {
    keywords: ['milk', 'sua'],
    detectedWord: 'milk',
    meaning: 'sữa',
    phonetic: '/mɪlk/',
    example: 'I like milk.',
    contentType: 'DoAn',
    vocabularyIdea: 'Từ vựng đồ ăn và đồ uống',
    confidence: 95,
  },
  {
    keywords: ['apple', 'tao'],
    detectedWord: 'apple',
    meaning: 'quả táo',
    phonetic: '/ˈæp.əl/',
    example: 'I eat an apple.',
    contentType: 'DoAn',
    vocabularyIdea: 'Trái cây quen thuộc',
    confidence: 94,
  },
  {
    keywords: ['cat', 'meo'],
    detectedWord: 'cat',
    meaning: 'con mèo',
    phonetic: '/kæt/',
    example: 'The cat is cute.',
    contentType: 'ConVat',
    vocabularyIdea: 'Động vật gần gũi',
    confidence: 93,
  },
  {
    keywords: ['dog', 'cho'],
    detectedWord: 'dog',
    meaning: 'con chó',
    phonetic: '/dɔːɡ/',
    example: 'The dog runs fast.',
    contentType: 'ConVat',
    vocabularyIdea: 'Động vật gần gũi',
    confidence: 93,
  },
  {
    keywords: ['water', 'nuoc'],
    detectedWord: 'water',
    meaning: 'nước',
    phonetic: '/ˈwɔː.tər/',
    example: 'I drink water.',
    contentType: 'DoAn',
    vocabularyIdea: 'Từ vựng đồ uống',
    confidence: 92,
  },
];

@Injectable()
export class VisionService {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(userId: string, file: VisionUploadFile, hint?: string) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên một hình ảnh.');
    }

    const context = `${hint ?? ''} ${file.originalname ?? ''} ${file.mimetype ?? ''}`.toLowerCase();
    const match =
      VISION_LIBRARY.find((item) => item.keywords.some((keyword) => context.includes(keyword))) ??
      VISION_LIBRARY[0];

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
        ${match.detectedWord},
        ${match.meaning},
        ${match.phonetic},
        ${match.example},
        ${match.vocabularyIdea},
        ${match.confidence},
        ${match.contentType},
        'DemoVision'
      )
    `;

    const history = await this.getHistory(userId);
    return {
      imageUrl,
      detectedWord: match.detectedWord,
      meaning: match.meaning,
      phonetic: match.phonetic,
      example: match.example,
      contentType: match.contentType,
      vocabularyIdea: match.vocabularyIdea,
      confidence: match.confidence,
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
}
