export type EtsPracticePart = {
  id: string;
  label: string;
  section: 'Listening' | 'Reading';
  title: string;
  from: number;
  to: number;
  durationMinutes: number;
  direction: string;
  paperPageOffset: number;
  reviewFocus: string;
};

export type EtsPracticeTest = {
  id: string;
  testNumber: number;
  title: string;
  description: string;
};

export const etsPracticeParts: EtsPracticePart[] = [
  {
    id: 'part-1',
    label: 'Part 1',
    section: 'Listening',
    title: 'Photographs',
    from: 1,
    to: 6,
    durationMinutes: 4,
    direction:
      'Directions: For each question in this part, you will hear four statements about a picture in your test book. These statements will be spoken only one time and will not be printed in your test book. Select the statement that best describes what you see in the picture and mark the letter (A), (B), (C), or (D) on your answer sheet.',
    paperPageOffset: 0,
    reviewFocus: 'Quan sát ảnh, chủ thể, hành động, vị trí đồ vật và thì hiện tại tiếp diễn.',
  },
  {
    id: 'part-2',
    label: 'Part 2',
    section: 'Listening',
    title: 'Question-Response',
    from: 7,
    to: 31,
    durationMinutes: 9,
    direction:
      'Directions: You will hear a question or statement and three responses spoken in English. They will not be printed in your test book and will be spoken only one time. Select the best response to the question or statement and mark the letter (A), (B), or (C) on your answer sheet.',
    paperPageOffset: 2,
    reviewFocus: 'Từ hỏi, loại phản hồi phù hợp, bẫy lặp từ và câu trả lời gián tiếp.',
  },
  {
    id: 'part-3',
    label: 'Part 3',
    section: 'Listening',
    title: 'Conversations',
    from: 32,
    to: 70,
    durationMinutes: 17,
    direction:
      'Directions: You will hear some conversations between two or more people. You will be asked to answer three questions about what the speakers say in each conversation. Select the best response to each question and mark the letter (A), (B), (C), or (D) on your answer sheet. The conversations will not be printed in your test book and will be spoken only one time.',
    paperPageOffset: 5,
    reviewFocus: 'Mục đích hội thoại, chi tiết, hành động tiếp theo và suy luận theo ngữ cảnh.',
  },
  {
    id: 'part-4',
    label: 'Part 4',
    section: 'Listening',
    title: 'Talks',
    from: 71,
    to: 100,
    durationMinutes: 15,
    direction:
      'Directions: You will hear some talks given by a single speaker. You will be asked to answer three questions about what the speaker says in each talk. Select the best response to each question and mark the letter (A), (B), (C), or (D) on your answer sheet. The talks will not be printed in your test book and will be spoken only one time.',
    paperPageOffset: 10,
    reviewFocus: 'Loại bài nói, thông báo chính, con số/ngày giờ và yêu cầu hành động.',
  },
  {
    id: 'part-5',
    label: 'Part 5',
    section: 'Reading',
    title: 'Incomplete Sentences',
    from: 101,
    to: 130,
    durationMinutes: 12,
    direction:
      'Directions: A word or phrase is missing in each of the sentences below. Four answer choices are given below each sentence. Select the best answer to complete the sentence. Then mark the letter (A), (B), (C), or (D) on your answer sheet.',
    paperPageOffset: 0,
    reviewFocus: 'Từ loại, thì, bị động, giới từ, liên từ, mệnh đề và cấu trúc câu công sở.',
  },
  {
    id: 'part-6',
    label: 'Part 6',
    section: 'Reading',
    title: 'Text Completion',
    from: 131,
    to: 146,
    durationMinutes: 10,
    direction:
      'Directions: Read the texts that follow. A word, phrase, or sentence is missing in parts of each text. Four answer choices for each question are given below the text. Select the best answer to complete the text. Then mark the letter (A), (B), (C), or (D) on your answer sheet.',
    paperPageOffset: 7,
    reviewFocus: 'Liên kết đoạn văn, đại từ tham chiếu, từ nối, thì và câu chèn logic.',
  },
  {
    id: 'part-7',
    label: 'Part 7',
    section: 'Reading',
    title: 'Reading Comprehension',
    from: 147,
    to: 200,
    durationMinutes: 53,
    direction:
      'Directions: In this part, you will read a selection of texts, such as magazine and newspaper articles, e-mails, and instant messages. Each text or set of texts is followed by several questions. Select the best answer for each question and mark the letter (A), (B), (C), or (D) on your answer sheet.',
    paperPageOffset: 12,
    reviewFocus: 'Scanning keyword, câu hỏi chi tiết, suy luận, mục đích văn bản và nối thông tin nhiều đoạn.',
  },
];

export const etsPracticeTests: EtsPracticeTest[] = Array.from({ length: 10 }, (_, index) => {
  const testNumber = index + 1;
  return {
    id: `ets-2026-test-${testNumber}`,
    testNumber,
    title: `ETS 2026 Test ${testNumber}`,
    description: `Đề luyện TOEIC ETS 2026 số ${testNumber}: audio Listening local, đề LC/RC PDF, transcript và key để đối chiếu.`,
  };
});

export function etsAssetUrl(assetPath: string) {
  return `/api/ets-assets/${assetPath.split('/').map(encodeURIComponent).join('/')}`;
}

export function getEtsPracticeTest(testNumber: number) {
  return etsPracticeTests.find((test) => test.testNumber === testNumber) ?? etsPracticeTests[0];
}

export function questionNumbers(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

export function getPartByQuestion(questionNumber: number) {
  return etsPracticeParts.find((part) => questionNumber >= part.from && questionNumber <= part.to) ?? etsPracticeParts[0];
}

function audioFileName(testNumber: number, label: string) {
  return `AUDIO/Test ${testNumber}/E26-T${String(testNumber).padStart(2, '0')}-${label}.mp3`;
}

export function etsAudioTracksForPart(testNumber: number, part: EtsPracticePart) {
  if (part.id === 'part-1' || part.id === 'part-2') {
    return questionNumbers(part.from, part.to).map((question) => ({
      label: `Câu ${question}`,
      from: question,
      to: question,
      url: etsAssetUrl(audioFileName(testNumber, String(question).padStart(2, '0'))),
    }));
  }

  const tracks = [];
  for (let question = part.from; question <= part.to; question += 3) {
    const end = Math.min(question + 2, part.to);
    const label = `${String(question).padStart(2, '0')}-${String(end).padStart(2, '0')}`;
    tracks.push({
      label: `Câu ${question}-${end}`,
      from: question,
      to: end,
      url: etsAssetUrl(audioFileName(testNumber, label)),
    });
  }

  return tracks;
}

export function etsAudioTracksForMode(testNumber: number, partId: string, mode: 'full' | 'part') {
  const listeningParts = etsPracticeParts.filter((part) => part.section === 'Listening');
  const activeParts = mode === 'full' ? listeningParts : etsPracticeParts.filter((part) => part.id === partId);
  return activeParts.flatMap((part) => etsAudioTracksForPart(testNumber, part));
}

export function etsPdfAssets(testNumber: number) {
  return [
    {
      id: 'lc',
      label: 'Đề Listening',
      url: etsAssetUrl('ETS 2026- LC.pdf'),
    },
    {
      id: 'rc',
      label: 'Đề Reading',
      url: etsAssetUrl('ETS 2026- RC.pdf'),
    },
    {
      id: 'transcript',
      label: 'Transcript',
      url: etsAssetUrl('TRANSCRIPT.pdf'),
    },
    {
      id: 'listening-key',
      label: 'Key Listening',
      url: etsAssetUrl(`KEY VÀ GIẢI THÍCH CHI TIẾT/ETS 2026 LISTENING TEST ${testNumber} (SCRIPT AND KEY).pdf`),
    },
    {
      id: 'reading-key',
      label: 'Key Reading',
      url: etsAssetUrl(`KEY VÀ GIẢI THÍCH CHI TIẾT/ETS 2026 READING TEST ${testNumber}- KEY.pdf`),
    },
  ];
}

export function etsPartPaperAsset(testNumber: number, part: EtsPracticePart) {
  const isListening = part.section === 'Listening';
  const basePage = isListening ? 1 + (testNumber - 1) * 14 : 1 + (testNumber - 1) * 30;
  const assetPath = isListening ? 'ETS 2026- LC.pdf' : 'ETS 2026- RC.pdf';
  const page = basePage + part.paperPageOffset;

  return {
    label: `${part.label} - ${part.title}`,
    page,
    url: `${etsAssetUrl(assetPath)}#page=${page}&zoom=page-width`,
  };
}

export function etsKeyAsset(testNumber: number, section: 'Listening' | 'Reading') {
  return section === 'Listening'
    ? etsAssetUrl(`KEY VÀ GIẢI THÍCH CHI TIẾT/ETS 2026 LISTENING TEST ${testNumber} (SCRIPT AND KEY).pdf`)
    : etsAssetUrl(`KEY VÀ GIẢI THÍCH CHI TIẾT/ETS 2026 READING TEST ${testNumber}- KEY.pdf`);
}

export function etsPart1QuestionImageAssets(testNumber: number) {
  const safeTestNumber = Math.min(Math.max(testNumber, 1), 10);
  return questionNumbers(1, 6).map((question) => ({
    question,
    alt: `ETS 2026 Test ${safeTestNumber} Part 1 câu ${question}`,
    url: `/ets/part1/test-${String(safeTestNumber).padStart(2, '0')}/q-${String(question).padStart(2, '0')}.png`,
  }));
}

export function etsPart3QuestionGroupImageAssets(testNumber: number) {
  const safeTestNumber = Math.min(Math.max(testNumber, 1), 10);
  const groups = [
    [32, 34],
    [35, 37],
    [38, 40],
    [41, 43],
    [44, 46],
    [47, 49],
    [50, 52],
    [53, 55],
    [56, 58],
    [59, 61],
    [62, 64],
    [65, 67],
    [68, 70],
  ] as const;

  return groups.map(([from, to], index) => ({
    id: `part3-${from}-${to}`,
    index: index + 1,
    from,
    to,
    questions: questionNumbers(from, to),
    alt: `ETS 2026 Test ${safeTestNumber} Part 3 câu ${from}-${to}`,
    url: `/ets/part3/test-${String(safeTestNumber).padStart(2, '0')}/q-${String(from).padStart(2, '0')}-${String(to).padStart(2, '0')}.png`,
  }));
}

export function etsPart4QuestionGroupImageAssets(testNumber: number) {
  const safeTestNumber = Math.min(Math.max(testNumber, 1), 10);
  const groups = [
    [71, 73],
    [74, 76],
    [77, 79],
    [80, 82],
    [83, 85],
    [86, 88],
    [89, 91],
    [92, 94],
    [95, 97],
    [98, 100],
  ] as const;

  return groups.map(([from, to], index) => ({
    id: `part4-${from}-${to}`,
    index: index + 1,
    from,
    to,
    questions: questionNumbers(from, to),
    alt: `ETS 2026 Test ${safeTestNumber} Part 4 câu ${from}-${to}`,
    url: `/ets/part4/test-${String(safeTestNumber).padStart(2, '0')}/q-${String(from).padStart(2, '0')}-${String(to).padStart(2, '0')}.png`,
  }));
}

export function etsPart5QuestionGroupImageAssets(testNumber: number) {
  const safeTestNumber = Math.min(Math.max(testNumber, 1), 10);
  const groups = [
    [101, 104],
    [105, 108],
    [109, 114],
    [115, 120],
    [121, 125],
    [126, 130],
  ] as const;

  return groups.map(([from, to], index) => ({
    id: `part5-${from}-${to}`,
    index: index + 1,
    from,
    to,
    questions: questionNumbers(from, to),
    alt: `ETS 2026 Test ${safeTestNumber} Part 5 câu ${from}-${to}`,
    url: `/ets/part5-groups/test-${String(safeTestNumber).padStart(2, '0')}/q-${String(from).padStart(3, '0')}-${String(to).padStart(3, '0')}.png`,
  }));
}

export function etsPart6QuestionGroupImageAssets(testNumber: number) {
  const safeTestNumber = Math.min(Math.max(testNumber, 1), 10);
  const groups = [
    [131, 134],
    [135, 138],
    [139, 142],
    [143, 146],
  ] as const;

  return groups.map(([from, to], index) => ({
    id: `part6-${from}-${to}`,
    index: index + 1,
    from,
    to,
    questions: questionNumbers(from, to),
    alt: `ETS 2026 Test ${safeTestNumber} Part 6 câu ${from}-${to}`,
    url: `/ets/part6-groups/test-${String(safeTestNumber).padStart(2, '0')}/q-${String(from).padStart(3, '0')}-${String(to).padStart(3, '0')}.png`,
  }));
}

export function etsPart7QuestionGroupImageAssets(testNumber: number) {
  const safeTestNumber = Math.min(Math.max(testNumber, 1), 10);
  const groups = [
    [147, 148, 1],
    [149, 150, 1],
    [151, 152, 1],
    [153, 154, 1],
    [155, 157, 1],
    [158, 160, 1],
    [161, 163, 1],
    [164, 167, 1],
    [168, 171, 1],
    [172, 175, 2],
    [176, 180, 2],
    [181, 185, 2],
    [186, 190, 2],
    [191, 195, 2],
    [196, 200, 2],
  ] as const;

  return groups.map(([from, to, pageCount], index) => ({
    id: `part7-${from}-${to}`,
    index: index + 1,
    from,
    to,
    questions: questionNumbers(from, to),
    alt: `ETS 2026 Test ${safeTestNumber} Part 7 câu ${from}-${to}`,
    images: Array.from({ length: pageCount }, (_, pageIndex) => ({
      id: `part7-${from}-${to}-p${pageIndex + 1}`,
      pageIndex: pageIndex + 1,
      url: `/ets/part7-groups/test-${String(safeTestNumber).padStart(2, '0')}/q-${String(from).padStart(3, '0')}-${String(to).padStart(3, '0')}-p${pageIndex + 1}.png`,
      alt: `ETS 2026 Test ${safeTestNumber} Part 7 câu ${from}-${to} trang ${pageIndex + 1}`,
    })),
  }));
}

export function etsQuestionInsight(questionNumber: number) {
  const part = getPartByQuestion(questionNumber);

  if (part.id === 'part-1') {
    return {
      topic: 'Part 1 - Photograph description',
      reason:
        'Bạn cần kiểm tra lại chủ thể và hành động trong ảnh. Lỗi thường gặp là chọn câu có từ đúng nhưng hành động/vị trí không đúng ảnh.',
      focus: part.reviewFocus,
    };
  }

  if (part.id === 'part-2') {
    return {
      topic: 'Part 2 - Question response',
      reason:
        'Hãy nghe lại từ hỏi đầu câu và loại câu trả lời. Nếu đáp án lặp từ trong câu hỏi nhưng không trả lời đúng ý, đó thường là bẫy.',
      focus: part.reviewFocus,
    };
  }

  if (part.id === 'part-3' || part.id === 'part-4') {
    const topic = questionNumber % 3 === 2 ? 'Main idea / purpose' : questionNumber % 3 === 0 ? 'Detail / number / place' : 'Next action / inference';
    return {
      topic,
      reason:
        'Nghe lại track tương ứng và đánh dấu câu chứa keyword. Với câu sai, thường là bỏ lỡ chi tiết ở cuối hoặc chọn đáp án suy diễn quá xa.',
      focus: part.reviewFocus,
    };
  }

  if (part.id === 'part-5') {
    const topic =
      questionNumber <= 110
        ? 'Word form / part of speech'
        : questionNumber <= 120
          ? 'Verb tense / voice / agreement'
          : 'Preposition / conjunction / vocabulary';
    return {
      topic,
      reason:
        'Đọc lại vị trí trống và xác định câu hỏi đang kiểm tra từ loại, động từ, giới từ hay nghĩa từ vựng. Sai thường do nhìn nghĩa mà bỏ qua cấu trúc.',
      focus: part.reviewFocus,
    };
  }

  if (part.id === 'part-6') {
    return {
      topic: 'Text completion / cohesion',
      reason:
        'Cần đọc câu trước và câu sau vị trí trống. Sai thường do chọn từ đúng ngữ pháp nhưng không nối logic với toàn đoạn.',
      focus: part.reviewFocus,
    };
  }

  return {
    topic: 'Reading comprehension',
    reason:
      'Đối chiếu lại đoạn chứa keyword và câu hỏi. Sai thường do đọc lướt thiếu điều kiện, nhầm người/vật/ngày giờ hoặc bỏ qua thông tin ở đoạn thứ hai.',
    focus: part.reviewFocus,
  };
}
