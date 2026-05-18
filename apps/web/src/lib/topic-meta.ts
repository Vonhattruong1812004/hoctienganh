export type TopicCategory =
  | 'TatCa'
  | 'ToeicVanPhong'
  | 'ToeicKinhDoanh'
  | 'DuLich'
  | 'DoiSong'
  | 'DongVat'
  | 'HocDuong';

export type TopicSource = {
  title?: string | null;
  description?: string | null;
  stageName?: string | null;
  stageType?: string | null;
  topicName?: string | null;
  pathName?: string | null;
  content?: string | null;
};

export type TopicVocabularyWord = {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string | null;
  wordType?: string | null;
  example?: string | null;
  exampleMeaning?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
};

export const topicCategoryFilters: Array<{ key: TopicCategory; label: string; hint: string }> = [
  { key: 'TatCa', label: 'Tất cả', hint: 'Toàn bộ chủ đề' },
  { key: 'ToeicVanPhong', label: 'Văn phòng', hint: 'Office, meeting, email' },
  { key: 'ToeicKinhDoanh', label: 'Kinh doanh', hint: 'Business, sales, service' },
  { key: 'DuLich', label: 'Du lịch', hint: 'Travel, hotel, airport' },
  { key: 'DoiSong', label: 'Đời sống', hint: 'Food, routine, family' },
  { key: 'DongVat', label: 'Động vật', hint: 'Animals, zoo, nature' },
  { key: 'HocDuong', label: 'Học đường', hint: 'Classroom, study, objects' },
];

const topicRules: Array<{
  category: Exclude<TopicCategory, 'TatCa'>;
  label: string;
  englishLabel: string;
  context: string;
  pattern: RegExp;
}> = [
  {
    category: 'ToeicVanPhong',
    label: 'Văn phòng và công sở',
    englishLabel: 'Office and workplace',
    context: 'Từ vựng TOEIC về văn phòng, cuộc họp, email, máy in, báo cáo và đồng nghiệp.',
    pattern: /(office|meeting|email|report|manager|employee|desk|computer|printer|workplace|van phong|cong ty|cuoc hop)/,
  },
  {
    category: 'ToeicKinhDoanh',
    label: 'Kinh doanh và dịch vụ',
    englishLabel: 'Business and service',
    context: 'Từ vựng TOEIC về khách hàng, hợp đồng, hóa đơn, bán hàng và dịch vụ.',
    pattern: /(business|sales|service|customer|invoice|contract|market|product|order|payment|kinh doanh|khach hang)/,
  },
  {
    category: 'DuLich',
    label: 'Du lịch và di chuyển',
    englishLabel: 'Travel and transportation',
    context: 'Từ vựng về sân bay, khách sạn, vé, nhà hàng, lịch trình và chỉ đường.',
    pattern: /(travel|hotel|airport|ticket|restaurant|flight|train|bus|trip|du lich|san bay|khach san)/,
  },
  {
    category: 'DongVat',
    label: 'Động vật và thiên nhiên',
    englishLabel: 'Animals and nature',
    context: 'Từ vựng về động vật, môi trường sống, âm thanh và mô tả đặc điểm.',
    pattern: /(animal|zoo|dog|cat|fish|rabbit|turtle|penguin|pig|bird|nature|dong vat)/,
  },
  {
    category: 'HocDuong',
    label: 'Đồ vật lớp học',
    englishLabel: 'Classroom objects',
    context: 'Từ vựng về sách, bút, bàn, ghế, lớp học và các câu chỉ đồ vật.',
    pattern: /(classroom|book|pen|pencil|school|student|teacher|board|bag|hoc|lop|sach|but)/,
  },
  {
    category: 'DoiSong',
    label: 'Chào hỏi và giới thiệu',
    englishLabel: 'Greetings and introductions',
    context: 'Từ vựng và mẫu câu chào hỏi, hỏi tên, giới thiệu bản thân.',
    pattern: /(hello|greeting|introduction|name|meet|chao|gioi thieu|hoi ten)/,
  },
  {
    category: 'DoiSong',
    label: 'Gia đình',
    englishLabel: 'Family members',
    context: 'Từ vựng về thành viên gia đình và cách giới thiệu người thân.',
    pattern: /(family|father|mother|brother|sister|parent|gia dinh|bo|me|anh|chi|em)/,
  },
  {
    category: 'DoiSong',
    label: 'Thói quen hằng ngày',
    englishLabel: 'Daily routines',
    context: 'Từ vựng về thức dậy, đi học, học bài, chơi, ngủ và lịch trình trong ngày.',
    pattern: /(daily|routine|get up|brush|sleep|study|play|go to school|habit|thoi quen|hang ngay|lich trinh)/,
  },
  {
    category: 'DoiSong',
    label: 'Đồ ăn và đồ uống',
    englishLabel: 'Food and drinks',
    context: 'Từ vựng về món ăn, thức uống, sở thích và gọi món cơ bản.',
    pattern: /(food|drink|milk|apple|orange|bread|rice|like|do an|do uong|sua|trai cay)/,
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveVocabularyTopic(source: TopicSource) {
  const searchable = normalizeText(
    [source.title, source.description, source.stageName, source.stageType, source.content, source.pathName]
      .filter(Boolean)
      .join(' '),
  );
  const matchedRule = topicRules.find((rule) => rule.pattern.test(searchable));
  const fallbackCategory: Exclude<TopicCategory, 'TatCa'> = 'DoiSong';
  const rawTopic = source.topicName?.trim();
  const rawTopicLooksTechnical = rawTopic
    ? /(ngu phap|ngữ pháp|co ban|cơ bản|a1|a2|b1|foundation|path|lo trinh|lộ trình)/i.test(rawTopic)
    : true;

  const label = matchedRule?.label ?? (rawTopic && !rawTopicLooksTechnical ? rawTopic : 'Từ vựng giao tiếp cơ bản');
  const englishLabel = matchedRule?.englishLabel ?? label;
  const category = matchedRule?.category ?? fallbackCategory;

  return {
    category,
    categoryLabel: topicCategoryFilters.find((item) => item.key === category)?.label ?? 'Đời sống',
    label,
    englishLabel,
    context:
      matchedRule?.context ??
      'Học từ vựng theo chủ đề thực tế, có hình ảnh, phát âm, ví dụ ngữ cảnh và bài ôn sau khi học.',
  };
}

const topicVocabularyBank: Record<Exclude<TopicCategory, 'TatCa'>, TopicVocabularyWord[]> = {
  ToeicVanPhong: [
    { id: 'ext-office-appointment', word: 'appointment', meaning: 'cuộc hẹn', phonetic: '/əˈpɔɪnt.mənt/', wordType: 'noun', example: 'I have an appointment at 9 a.m.', exampleMeaning: 'Tôi có một cuộc hẹn lúc 9 giờ sáng.' },
    { id: 'ext-office-colleague', word: 'colleague', meaning: 'đồng nghiệp', phonetic: '/ˈkɑː.liːɡ/', wordType: 'noun', example: 'My colleague will join the meeting.', exampleMeaning: 'Đồng nghiệp của tôi sẽ tham gia cuộc họp.' },
    { id: 'ext-office-deadline', word: 'deadline', meaning: 'hạn chót', phonetic: '/ˈded.laɪn/', wordType: 'noun', example: 'The deadline is Friday afternoon.', exampleMeaning: 'Hạn chót là chiều thứ Sáu.' },
    { id: 'ext-office-report', word: 'report', meaning: 'báo cáo', phonetic: '/rɪˈpɔːrt/', wordType: 'noun', example: 'Please send the report today.', exampleMeaning: 'Vui lòng gửi báo cáo hôm nay.' },
    { id: 'ext-office-printer', word: 'printer', meaning: 'máy in', phonetic: '/ˈprɪn.tər/', wordType: 'noun', example: 'The printer is next to the desk.', exampleMeaning: 'Máy in ở cạnh bàn làm việc.' },
    { id: 'ext-office-supervisor', word: 'supervisor', meaning: 'người giám sát', phonetic: '/ˈsuː.pər.vaɪ.zər/', wordType: 'noun', example: 'Ask your supervisor for approval.', exampleMeaning: 'Hãy xin người giám sát phê duyệt.' },
    { id: 'ext-office-conference', word: 'conference', meaning: 'hội nghị', phonetic: '/ˈkɑːn.fɚ.əns/', wordType: 'noun', example: 'The conference starts next Monday.', exampleMeaning: 'Hội nghị bắt đầu vào thứ Hai tới.' },
    { id: 'ext-office-schedule', word: 'schedule', meaning: 'lịch trình', phonetic: '/ˈskedʒ.uːl/', wordType: 'noun', example: 'Check the schedule before the meeting.', exampleMeaning: 'Hãy kiểm tra lịch trình trước cuộc họp.' },
  ],
  ToeicKinhDoanh: [
    { id: 'ext-business-customer', word: 'customer', meaning: 'khách hàng', phonetic: '/ˈkʌs.tə.mər/', wordType: 'noun', example: 'The customer asked for a discount.', exampleMeaning: 'Khách hàng đã hỏi về giảm giá.' },
    { id: 'ext-business-contract', word: 'contract', meaning: 'hợp đồng', phonetic: '/ˈkɑːn.trækt/', wordType: 'noun', example: 'We signed the contract yesterday.', exampleMeaning: 'Chúng tôi đã ký hợp đồng hôm qua.' },
    { id: 'ext-business-invoice', word: 'invoice', meaning: 'hóa đơn', phonetic: '/ˈɪn.vɔɪs/', wordType: 'noun', example: 'The invoice includes the delivery fee.', exampleMeaning: 'Hóa đơn bao gồm phí giao hàng.' },
    { id: 'ext-business-payment', word: 'payment', meaning: 'thanh toán', phonetic: '/ˈpeɪ.mənt/', wordType: 'noun', example: 'Payment is due next week.', exampleMeaning: 'Khoản thanh toán đến hạn vào tuần sau.' },
    { id: 'ext-business-shipment', word: 'shipment', meaning: 'lô hàng', phonetic: '/ˈʃɪp.mənt/', wordType: 'noun', example: 'The shipment arrived on time.', exampleMeaning: 'Lô hàng đã đến đúng giờ.' },
    { id: 'ext-business-warranty', word: 'warranty', meaning: 'bảo hành', phonetic: '/ˈwɔːr.ən.ti/', wordType: 'noun', example: 'This product has a one-year warranty.', exampleMeaning: 'Sản phẩm này có bảo hành một năm.' },
    { id: 'ext-business-refund', word: 'refund', meaning: 'hoàn tiền', phonetic: '/ˈriː.fʌnd/', wordType: 'noun', example: 'You can request a refund online.', exampleMeaning: 'Bạn có thể yêu cầu hoàn tiền trực tuyến.' },
    { id: 'ext-business-branch', word: 'branch', meaning: 'chi nhánh', phonetic: '/bræntʃ/', wordType: 'noun', example: 'The company opened a new branch.', exampleMeaning: 'Công ty đã mở một chi nhánh mới.' },
  ],
  DuLich: [
    { id: 'ext-travel-airport', word: 'airport', meaning: 'sân bay', phonetic: '/ˈer.pɔːrt/', wordType: 'noun', example: 'The airport is very busy today.', exampleMeaning: 'Sân bay hôm nay rất đông.' },
    { id: 'ext-travel-luggage', word: 'luggage', meaning: 'hành lý', phonetic: '/ˈlʌɡ.ɪdʒ/', wordType: 'noun', example: 'My luggage is under the seat.', exampleMeaning: 'Hành lý của tôi ở dưới ghế.' },
    { id: 'ext-travel-reservation', word: 'reservation', meaning: 'đặt chỗ', phonetic: '/ˌrez.ɚˈveɪ.ʃən/', wordType: 'noun', example: 'I made a hotel reservation.', exampleMeaning: 'Tôi đã đặt phòng khách sạn.' },
    { id: 'ext-travel-departure', word: 'departure', meaning: 'khởi hành', phonetic: '/dɪˈpɑːr.tʃɚ/', wordType: 'noun', example: 'The departure time is 8:30.', exampleMeaning: 'Giờ khởi hành là 8:30.' },
    { id: 'ext-travel-arrival', word: 'arrival', meaning: 'đến nơi', phonetic: '/əˈraɪ.vəl/', wordType: 'noun', example: 'The arrival gate is number five.', exampleMeaning: 'Cổng đến là số năm.' },
    { id: 'ext-travel-itinerary', word: 'itinerary', meaning: 'lịch trình du lịch', phonetic: '/aɪˈtɪn.ə.rer.i/', wordType: 'noun', example: 'The itinerary includes two museums.', exampleMeaning: 'Lịch trình bao gồm hai bảo tàng.' },
    { id: 'ext-travel-platform', word: 'platform', meaning: 'sân ga', phonetic: '/ˈplæt.fɔːrm/', wordType: 'noun', example: 'The train leaves from platform two.', exampleMeaning: 'Tàu rời sân ga số hai.' },
    { id: 'ext-travel-passenger', word: 'passenger', meaning: 'hành khách', phonetic: '/ˈpæs.ən.dʒɚ/', wordType: 'noun', example: 'Passengers should show their tickets.', exampleMeaning: 'Hành khách nên xuất trình vé.' },
  ],
  DoiSong: [
    { id: 'ext-life-orange', word: 'orange', meaning: 'quả cam', phonetic: '/ˈɔːr.ɪndʒ/', wordType: 'noun', example: 'I eat an orange after lunch.', exampleMeaning: 'Tôi ăn một quả cam sau bữa trưa.' },
    { id: 'ext-life-breakfast', word: 'breakfast', meaning: 'bữa sáng', phonetic: '/ˈbrek.fəst/', wordType: 'noun', example: 'I have breakfast at seven.', exampleMeaning: 'Tôi ăn sáng lúc bảy giờ.' },
    { id: 'ext-life-routine', word: 'routine', meaning: 'thói quen', phonetic: '/ruːˈtiːn/', wordType: 'noun', example: 'My morning routine is simple.', exampleMeaning: 'Thói quen buổi sáng của tôi rất đơn giản.' },
    { id: 'ext-life-prepare', word: 'prepare', meaning: 'chuẩn bị', phonetic: '/prɪˈper/', wordType: 'verb', example: 'I prepare my bag at night.', exampleMeaning: 'Tôi chuẩn bị cặp vào buổi tối.' },
    { id: 'ext-life-exercise', word: 'exercise', meaning: 'tập thể dục', phonetic: '/ˈek.sɚ.saɪz/', wordType: 'verb', example: 'I exercise before breakfast.', exampleMeaning: 'Tôi tập thể dục trước bữa sáng.' },
    { id: 'ext-life-relax', word: 'relax', meaning: 'thư giãn', phonetic: '/rɪˈlæks/', wordType: 'verb', example: 'I relax after school.', exampleMeaning: 'Tôi thư giãn sau giờ học.' },
    { id: 'ext-life-cousin', word: 'cousin', meaning: 'anh chị em họ', phonetic: '/ˈkʌz.ən/', wordType: 'noun', example: 'My cousin lives near my house.', exampleMeaning: 'Anh họ của tôi sống gần nhà tôi.' },
    { id: 'ext-life-grandmother', word: 'grandmother', meaning: 'bà', phonetic: '/ˈɡræn.mʌð.ɚ/', wordType: 'noun', example: 'My grandmother tells great stories.', exampleMeaning: 'Bà tôi kể những câu chuyện rất hay.' },
  ],
  DongVat: [
    { id: 'ext-animal-penguin', word: 'penguin', meaning: 'chim cánh cụt', phonetic: '/ˈpeŋ.ɡwɪn/', wordType: 'noun', example: 'The penguin walks on the ice.', exampleMeaning: 'Chim cánh cụt đi trên băng.' },
    { id: 'ext-animal-rabbit', word: 'rabbit', meaning: 'con thỏ', phonetic: '/ˈræb.ɪt/', wordType: 'noun', example: 'The rabbit eats a carrot.', exampleMeaning: 'Con thỏ ăn một củ cà rốt.' },
    { id: 'ext-animal-turtle', word: 'turtle', meaning: 'con rùa', phonetic: '/ˈtɝː.t̬əl/', wordType: 'noun', example: 'The turtle moves slowly.', exampleMeaning: 'Con rùa di chuyển chậm.' },
    { id: 'ext-animal-feather', word: 'feather', meaning: 'lông vũ', phonetic: '/ˈfeð.ɚ/', wordType: 'noun', example: 'A bird has soft feathers.', exampleMeaning: 'Một con chim có lông vũ mềm.' },
    { id: 'ext-animal-shell', word: 'shell', meaning: 'mai/vỏ', phonetic: '/ʃel/', wordType: 'noun', example: 'The turtle has a hard shell.', exampleMeaning: 'Con rùa có chiếc mai cứng.' },
    { id: 'ext-animal-habitat', word: 'habitat', meaning: 'môi trường sống', phonetic: '/ˈhæb.ə.tæt/', wordType: 'noun', example: 'The forest is a habitat for many animals.', exampleMeaning: 'Khu rừng là môi trường sống của nhiều loài vật.' },
    { id: 'ext-animal-swim', word: 'swim', meaning: 'bơi', phonetic: '/swɪm/', wordType: 'verb', example: 'Fish swim in the water.', exampleMeaning: 'Cá bơi trong nước.' },
    { id: 'ext-animal-wild', word: 'wild', meaning: 'hoang dã', phonetic: '/waɪld/', wordType: 'adjective', example: 'Some wild animals live in the zoo.', exampleMeaning: 'Một số động vật hoang dã sống trong sở thú.' },
  ],
  HocDuong: [
    { id: 'ext-school-notebook', word: 'notebook', meaning: 'vở ghi', phonetic: '/ˈnoʊt.bʊk/', wordType: 'noun', example: 'I write new words in my notebook.', exampleMeaning: 'Tôi viết từ mới vào vở ghi.' },
    { id: 'ext-school-backpack', word: 'backpack', meaning: 'ba lô', phonetic: '/ˈbæk.pæk/', wordType: 'noun', example: 'My backpack is under the chair.', exampleMeaning: 'Ba lô của tôi ở dưới ghế.' },
    { id: 'ext-school-whiteboard', word: 'whiteboard', meaning: 'bảng trắng', phonetic: '/ˈwaɪt.bɔːrd/', wordType: 'noun', example: 'The teacher writes on the whiteboard.', exampleMeaning: 'Giáo viên viết lên bảng trắng.' },
    { id: 'ext-school-assignment', word: 'assignment', meaning: 'bài tập được giao', phonetic: '/əˈsaɪn.mənt/', wordType: 'noun', example: 'The assignment is due tomorrow.', exampleMeaning: 'Bài tập được giao đến hạn vào ngày mai.' },
    { id: 'ext-school-dictionary', word: 'dictionary', meaning: 'từ điển', phonetic: '/ˈdɪk.ʃən.er.i/', wordType: 'noun', example: 'Use a dictionary to check the meaning.', exampleMeaning: 'Dùng từ điển để kiểm tra nghĩa.' },
    { id: 'ext-school-timetable', word: 'timetable', meaning: 'thời khóa biểu', phonetic: '/ˈtaɪmˌteɪ.bəl/', wordType: 'noun', example: 'My timetable has English on Monday.', exampleMeaning: 'Thời khóa biểu của tôi có môn tiếng Anh vào thứ Hai.' },
    { id: 'ext-school-eraser', word: 'eraser', meaning: 'cục tẩy', phonetic: '/ɪˈreɪ.sɚ/', wordType: 'noun', example: 'I need an eraser for this sentence.', exampleMeaning: 'Tôi cần một cục tẩy cho câu này.' },
    { id: 'ext-school-ruler', word: 'ruler', meaning: 'thước kẻ', phonetic: '/ˈruː.lɚ/', wordType: 'noun', example: 'The ruler is in my pencil case.', exampleMeaning: 'Thước kẻ ở trong hộp bút của tôi.' },
  ],
};

const labelVocabularyBank: Array<{ pattern: RegExp; words: TopicVocabularyWord[] }> = [
  {
    pattern: /(daily|routine|thoi quen|hằng ngày|hang ngay|get up|brush)/i,
    words: [
      { id: 'ext-routine-wake-up', word: 'wake up', meaning: 'thức dậy', phonetic: '/weɪk ʌp/', wordType: 'verb phrase', example: 'I wake up at six thirty.', exampleMeaning: 'Tôi thức dậy lúc sáu giờ ba mươi.' },
      { id: 'ext-routine-brush-teeth', word: 'brush my teeth', meaning: 'đánh răng', phonetic: '/brʌʃ maɪ tiːθ/', wordType: 'phrase', example: 'I brush my teeth after breakfast.', exampleMeaning: 'Tôi đánh răng sau bữa sáng.' },
      { id: 'ext-routine-commute', word: 'commute', meaning: 'đi lại hằng ngày', phonetic: '/kəˈmjuːt/', wordType: 'verb', example: 'I commute to school by bus.', exampleMeaning: 'Tôi đi học hằng ngày bằng xe buýt.' },
      { id: 'ext-routine-finish', word: 'finish', meaning: 'hoàn thành/kết thúc', phonetic: '/ˈfɪn.ɪʃ/', wordType: 'verb', example: 'I finish my homework at eight.', exampleMeaning: 'Tôi hoàn thành bài tập lúc tám giờ.' },
    ],
  },
  {
    pattern: /(family|gia đình|gia dinh|father|mother)/i,
    words: [
      { id: 'ext-family-parents', word: 'parents', meaning: 'bố mẹ', phonetic: '/ˈper.ənts/', wordType: 'noun', example: 'My parents are kind.', exampleMeaning: 'Bố mẹ tôi rất tốt bụng.' },
      { id: 'ext-family-younger-brother', word: 'younger brother', meaning: 'em trai', phonetic: '/ˈjʌŋ.ɡɚ ˈbrʌð.ɚ/', wordType: 'noun', example: 'My younger brother likes milk.', exampleMeaning: 'Em trai tôi thích sữa.' },
      { id: 'ext-family-older-sister', word: 'older sister', meaning: 'chị gái', phonetic: '/ˈoʊl.dɚ ˈsɪs.tɚ/', wordType: 'noun', example: 'My older sister studies English.', exampleMeaning: 'Chị gái tôi học tiếng Anh.' },
    ],
  },
  {
    pattern: /(food|drink|đồ ăn|do an|milk|orange|apple)/i,
    words: [
      { id: 'ext-food-menu', word: 'menu', meaning: 'thực đơn', phonetic: '/ˈmen.juː/', wordType: 'noun', example: 'Can I see the menu, please?', exampleMeaning: 'Tôi có thể xem thực đơn được không?' },
      { id: 'ext-food-order', word: 'order', meaning: 'gọi món/đặt hàng', phonetic: '/ˈɔːr.dɚ/', wordType: 'verb', example: 'I want to order orange juice.', exampleMeaning: 'Tôi muốn gọi nước cam.' },
      { id: 'ext-food-juice', word: 'juice', meaning: 'nước ép', phonetic: '/dʒuːs/', wordType: 'noun', example: 'Orange juice is fresh.', exampleMeaning: 'Nước cam rất tươi.' },
    ],
  },
];

function uniqueVocabulary(words: TopicVocabularyWord[]) {
  const seen = new Set<string>();
  return words.filter((item) => {
    const key = normalizeText(item.word).trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getExtendedTopicVocabulary(topic: ReturnType<typeof resolveVocabularyTopic> | null | undefined) {
  if (!topic) return [];
  const base = topicVocabularyBank[topic.category] ?? [];
  const labelSearch = `${topic.label} ${topic.englishLabel} ${topic.context}`;
  const specific = labelVocabularyBank.flatMap((item) => (item.pattern.test(labelSearch) ? item.words : []));
  return uniqueVocabulary([...specific, ...base]);
}

export function mergeTopicVocabulary<T extends TopicVocabularyWord>(
  baseWords: T[] | null | undefined,
  topic: ReturnType<typeof resolveVocabularyTopic> | null | undefined,
) {
  return uniqueVocabulary([...(baseWords ?? []), ...getExtendedTopicVocabulary(topic)]);
}
