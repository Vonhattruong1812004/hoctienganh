export type ToeicGrammarQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

export type ToeicGrammarTopic = {
  id: string;
  group: string;
  title: string;
  vietnameseTitle: string;
  level: 'Foundation' | 'Core TOEIC' | 'Advanced TOEIC';
  partFocus: string[];
  summary: string;
  patterns: string[];
  rules: string[];
  toeicTraps: string[];
  examples: Array<{ sentence: string; meaning: string; note: string }>;
  questions: ToeicGrammarQuestion[];
};

export type ToeicGrammarEnhancement = {
  signals: string[];
  decisionSteps: string[];
  commonMistakes: string[];
  businessFrames: string[];
};

function q(
  topicId: string,
  index: number,
  prompt: string,
  choices: string[],
  answer: string,
  explanation: string,
): ToeicGrammarQuestion {
  return {
    id: `${topicId}-q-${index}`,
    prompt,
    choices,
    answer,
    explanation,
  };
}

const coreExamples = {
  report: {
    sentence: 'The quarterly report was submitted before the deadline.',
    meaning: 'Báo cáo quý đã được nộp trước hạn chót.',
    note: 'Ngữ cảnh công sở thường xuất hiện trong TOEIC Part 5 và Part 6.',
  },
  meeting: {
    sentence: 'Employees who attend the meeting should bring their ID cards.',
    meaning: 'Nhân viên tham dự cuộc họp nên mang thẻ nhân viên.',
    note: 'Câu có mệnh đề quan hệ và danh từ chỉ người.',
  },
  invoice: {
    sentence: 'Please review the invoice carefully before making a payment.',
    meaning: 'Vui lòng kiểm tra hóa đơn cẩn thận trước khi thanh toán.',
    note: 'Câu mệnh lệnh lịch sự, hay gặp trong email công việc.',
  },
};

export const toeicGrammarTopics: ToeicGrammarTopic[] = [
  {
    id: 'tenses-overview',
    group: 'Thì và thời gian',
    title: 'Verb tenses in TOEIC',
    vietnameseTitle: 'Tổng quan các thì trong TOEIC',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary:
      'TOEIC thường kiểm tra thì qua dấu hiệu thời gian, trình tự sự kiện, trạng từ như recently, currently, by the time, since, for và ngữ cảnh email/báo cáo.',
    patterns: ['S + V(s/es)', 'S + am/is/are + V-ing', 'S + have/has + V3', 'S + will + V'],
    rules: [
      'Dùng hiện tại đơn cho thói quen, lịch trình, quy trình công ty.',
      'Dùng hiện tại tiếp diễn cho hành động đang diễn ra hoặc kế hoạch gần.',
      'Dùng hiện tại hoàn thành cho kết quả liên quan hiện tại hoặc mốc since/for.',
      'Dùng tương lai với will/be going to cho kế hoạch, dự đoán, thông báo.',
    ],
    toeicTraps: [
      'Currently thường kéo hiện tại tiếp diễn.',
      'Since/for thường kéo hiện tại hoàn thành.',
      'By the time + mốc tương lai thường đi với future perfect.',
    ],
    examples: [
      {
        sentence: 'The accounting team is reviewing the expense reports now.',
        meaning: 'Nhóm kế toán đang xem xét các báo cáo chi phí lúc này.',
        note: 'now -> hiện tại tiếp diễn.',
      },
      coreExamples.report,
    ],
    questions: [
      q(
        'tenses-overview',
        1,
        'The manager _____ the new policy at tomorrow’s meeting.',
        ['announces', 'will announce', 'has announced', 'announcing'],
        'will announce',
        'tomorrow’s meeting là mốc tương lai, cần will announce.',
      ),
      q(
        'tenses-overview',
        2,
        'The technicians _____ the machines since 8 a.m.',
        ['inspect', 'are inspecting', 'have inspected', 'inspected'],
        'have inspected',
        'since 8 a.m. nhấn mạnh quá trình bắt đầu từ quá khứ đến hiện tại.',
      ),
    ],
  },
  {
    id: 'present-simple-continuous',
    group: 'Thì và thời gian',
    title: 'Present simple vs present continuous',
    vietnameseTitle: 'Hiện tại đơn và hiện tại tiếp diễn',
    level: 'Foundation',
    partFocus: ['Part 5'],
    summary: 'Phân biệt quy trình/lịch trình cố định với hành động đang xảy ra trong bối cảnh công việc.',
    patterns: ['S + V(s/es)', 'S + am/is/are + V-ing'],
    rules: [
      'Hiện tại đơn dùng cho lịch trình, quy định, sự thật công ty.',
      'Hiện tại tiếp diễn dùng cho hành động đang diễn ra tạm thời.',
      'Các động từ trạng thái như know, own, belong hiếm khi dùng dạng V-ing.',
    ],
    toeicTraps: ['every, usually, often -> hiện tại đơn.', 'currently, at the moment -> hiện tại tiếp diễn.'],
    examples: [
      {
        sentence: 'The shuttle leaves the hotel every thirty minutes.',
        meaning: 'Xe đưa đón rời khách sạn mỗi ba mươi phút.',
        note: 'every thirty minutes -> lịch trình cố định.',
      },
      {
        sentence: 'The sales team is preparing a proposal this week.',
        meaning: 'Đội bán hàng đang chuẩn bị một đề xuất trong tuần này.',
        note: 'this week -> hành động tạm thời.',
      },
    ],
    questions: [
      q(
        'present-simple-continuous',
        1,
        'The cafeteria _____ at 7 a.m. every weekday.',
        ['opens', 'is opening', 'opened', 'open'],
        'opens',
        'every weekday là lịch trình cố định, dùng hiện tại đơn.',
      ),
      q(
        'present-simple-continuous',
        2,
        'Ms. Lee _____ with a client right now.',
        ['speaks', 'is speaking', 'spoke', 'has spoken'],
        'is speaking',
        'right now là dấu hiệu hiện tại tiếp diễn.',
      ),
    ],
  },
  {
    id: 'past-perfect-sequence',
    group: 'Thì và thời gian',
    title: 'Past simple, past continuous and past perfect',
    vietnameseTitle: 'Quá khứ đơn, quá khứ tiếp diễn và quá khứ hoàn thành',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'TOEIC dùng nhóm thì quá khứ để kiểm tra thứ tự sự kiện trong báo cáo, lịch sử dự án và email.',
    patterns: ['S + V2/ed', 'S + was/were + V-ing', 'S + had + V3'],
    rules: [
      'Quá khứ đơn dùng cho hành động đã hoàn tất tại mốc quá khứ.',
      'Quá khứ tiếp diễn dùng cho hành động đang xảy ra tại một thời điểm quá khứ.',
      'Quá khứ hoàn thành dùng cho hành động xảy ra trước một hành động quá khứ khác.',
    ],
    toeicTraps: ['before/after/by the time thường kiểm tra past perfect.', 'while thường kéo past continuous.'],
    examples: [
      {
        sentence: 'By the time the client arrived, the team had prepared the presentation.',
        meaning: 'Trước khi khách hàng đến, nhóm đã chuẩn bị xong bài thuyết trình.',
        note: 'Hành động chuẩn bị xảy ra trước arrived.',
      },
    ],
    questions: [
      q(
        'past-perfect-sequence',
        1,
        'The office _____ closed when we reached the building.',
        ['has', 'had', 'was', 'is'],
        'was',
        'closed là tính từ/trạng thái ở quá khứ; cần was closed.',
      ),
      q(
        'past-perfect-sequence',
        2,
        'The shipment had left before the warehouse manager _____.',
        ['called', 'calling', 'has called', 'will call'],
        'called',
        'Hành động sau dùng quá khứ đơn, hành động trước dùng had left.',
      ),
    ],
  },
  {
    id: 'subject-verb-agreement',
    group: 'Cấu trúc câu',
    title: 'Subject-verb agreement',
    vietnameseTitle: 'Hòa hợp chủ ngữ và động từ',
    level: 'Core TOEIC',
    partFocus: ['Part 5'],
    summary: 'Chọn đúng dạng động từ theo chủ ngữ thật, không bị nhiễu bởi cụm giới từ hoặc mệnh đề chen giữa.',
    patterns: ['Singular subject + singular verb', 'Plural subject + plural verb'],
    rules: [
      'Tìm chủ ngữ thật trước khi chọn động từ.',
      'Cụm giới từ như of the reports không quyết định động từ.',
      'Each, every, either, neither thường đi với động từ số ít.',
    ],
    toeicTraps: ['The list of items is...', 'Each of the employees has...', 'Neither A nor B phụ thuộc chủ ngữ gần động từ hơn.'],
    examples: [
      {
        sentence: 'The list of approved vendors is on the manager’s desk.',
        meaning: 'Danh sách nhà cung cấp được phê duyệt đang ở trên bàn của quản lý.',
        note: 'Chủ ngữ thật là list, không phải vendors.',
      },
    ],
    questions: [
      q(
        'subject-verb-agreement',
        1,
        'The number of applicants _____ increasing every month.',
        ['are', 'is', 'were', 'be'],
        'is',
        'The number of + plural noun dùng động từ số ít.',
      ),
      q(
        'subject-verb-agreement',
        2,
        'Each of the invoices _____ a reference number.',
        ['have', 'has', 'having', 'are having'],
        'has',
        'Each là chủ ngữ số ít.',
      ),
    ],
  },
  {
    id: 'parts-of-speech',
    group: 'Từ loại',
    title: 'Parts of speech',
    vietnameseTitle: 'Từ loại trong TOEIC',
    level: 'Foundation',
    partFocus: ['Part 5'],
    summary: 'Part 5 rất hay cho các đáp án cùng gốc từ như manage, manager, managerial, management để kiểm tra vị trí từ loại.',
    patterns: ['adjective + noun', 'verb + adverb', 'be + adjective', 'preposition + noun/gerund'],
    rules: [
      'Sau mạo từ hoặc tính từ thường cần danh từ.',
      'Trước danh từ thường cần tính từ.',
      'Sau động từ thường cần tân ngữ hoặc trạng từ tùy cấu trúc.',
    ],
    toeicTraps: ['Đáp án cùng gốc từ không cần dịch toàn câu, hãy nhìn vị trí trống trước.', 'Sau preposition dùng noun hoặc V-ing.'],
    examples: [
      {
        sentence: 'The company needs an experienced manager for the new branch.',
        meaning: 'Công ty cần một quản lý có kinh nghiệm cho chi nhánh mới.',
        note: 'an experienced + noun -> manager.',
      },
    ],
    questions: [
      q(
        'parts-of-speech',
        1,
        'The marketing team gave a detailed _____ of the campaign.',
        ['analyze', 'analysis', 'analytical', 'analyzes'],
        'analysis',
        'Sau a detailed cần danh từ.',
      ),
      q(
        'parts-of-speech',
        2,
        'The new software works _____.',
        ['efficient', 'efficiency', 'efficiently', 'efficientness'],
        'efficiently',
        'Bổ nghĩa cho động từ works cần trạng từ.',
      ),
    ],
  },
  {
    id: 'nouns-articles-quantifiers',
    group: 'Danh từ và định lượng',
    title: 'Nouns, articles and quantifiers',
    vietnameseTitle: 'Danh từ, mạo từ và lượng từ',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Kiểm tra danh từ đếm được/không đếm được, số ít/số nhiều, a/an/the và lượng từ như many, much, few, little, several.',
    patterns: ['a/an + singular countable noun', 'many/several + plural noun', 'much/little + uncountable noun'],
    rules: [
      'Danh từ đếm được số ít cần mạo từ hoặc từ hạn định.',
      'Information, equipment, advice là danh từ không đếm được trong TOEIC.',
      'Several, many, a few đi với danh từ số nhiều.',
    ],
    toeicTraps: ['equipments là sai trong tiếng Anh chuẩn.', 'an dùng theo âm bắt đầu, không chỉ theo chữ cái.'],
    examples: [
      {
        sentence: 'The technician ordered new equipment for the laboratory.',
        meaning: 'Kỹ thuật viên đã đặt thiết bị mới cho phòng thí nghiệm.',
        note: 'equipment không thêm s.',
      },
    ],
    questions: [
      q(
        'nouns-articles-quantifiers',
        1,
        'The supervisor gave us useful _____.',
        ['advices', 'advice', 'an advice', 'many advice'],
        'advice',
        'Advice là danh từ không đếm được.',
      ),
      q(
        'nouns-articles-quantifiers',
        2,
        'Several _____ attended the workshop.',
        ['employee', 'employees', 'equipment', 'information'],
        'employees',
        'Several đi với danh từ đếm được số nhiều.',
      ),
    ],
  },
  {
    id: 'pronouns-reference',
    group: 'Đại từ và tham chiếu',
    title: 'Pronouns and reference',
    vietnameseTitle: 'Đại từ và cách quy chiếu',
    level: 'Foundation',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Chọn đúng đại từ chủ ngữ, tân ngữ, sở hữu, phản thân và xác định nó thay cho danh từ nào.',
    patterns: ['subject pronoun + verb', 'verb/preposition + object pronoun', 'possessive adjective + noun', 'by + reflexive pronoun'],
    rules: [
      'Sau giới từ dùng tân ngữ: for him, to them.',
      'Trước danh từ dùng tính từ sở hữu: her report, their office.',
      'Dùng phản thân khi chủ ngữ và tân ngữ là cùng một người/vật.',
    ],
    toeicTraps: ['its và it’s khác nhau.', 'their đi với danh từ, theirs đứng độc lập.'],
    examples: [
      {
        sentence: 'Ms. Tran updated her schedule before the conference.',
        meaning: 'Cô Trân đã cập nhật lịch của cô ấy trước hội nghị.',
        note: 'her + noun.',
      },
    ],
    questions: [
      q('pronouns-reference', 1, 'The employees submitted _____ reports on time.', ['they', 'them', 'their', 'theirs'], 'their', 'Trước reports cần tính từ sở hữu.'),
      q('pronouns-reference', 2, 'Please send the file to _____.', ['I', 'me', 'my', 'mine'], 'me', 'Sau to cần tân ngữ.'),
    ],
  },
  {
    id: 'relative-clauses',
    group: 'Mệnh đề',
    title: 'Relative clauses',
    vietnameseTitle: 'Mệnh đề quan hệ',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6', 'Part 7'],
    summary: 'Dùng who, whom, which, that, whose, where để nối thông tin về người, vật, nơi chốn trong câu công việc.',
    patterns: ['person + who/that + verb', 'thing + which/that + verb', 'noun + whose + noun', 'place + where + clause'],
    rules: [
      'Who dùng cho người làm chủ ngữ.',
      'Which dùng cho vật/sự việc.',
      'Whose thể hiện sở hữu.',
      'Where dùng cho nơi chốn.',
    ],
    toeicTraps: ['Sau whose phải có danh từ.', 'Không dùng where nếu phía sau thiếu chủ ngữ/tân ngữ của động từ.'],
    examples: [coreExamples.meeting],
    questions: [
      q('relative-clauses', 1, 'The applicant _____ resume impressed the director was hired.', ['who', 'whose', 'which', 'where'], 'whose', 'whose + resume diễn tả sở hữu.'),
      q('relative-clauses', 2, 'The printer _____ we bought last month is already broken.', ['who', 'where', 'which', 'whose'], 'which', 'Printer là vật, dùng which.'),
    ],
  },
  {
    id: 'passive-voice',
    group: 'Bị động và chủ động',
    title: 'Passive voice',
    vietnameseTitle: 'Câu bị động',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'TOEIC dùng bị động nhiều trong thông báo, quy trình, báo cáo, email: is required, was submitted, has been approved.',
    patterns: ['be + V3/ed', 'modal + be + V3', 'have/has been + V3'],
    rules: [
      'Dùng bị động khi chủ ngữ nhận hành động.',
      'Câu bị động vẫn phải đúng thì.',
      'Sau modal dùng be + V3.',
    ],
    toeicTraps: ['by không phải lúc nào cũng xuất hiện trong câu bị động.', 'Đừng chọn V-ing khi cần V3.'],
    examples: [coreExamples.report],
    questions: [
      q('passive-voice', 1, 'All visitors _____ to wear identification badges.', ['require', 'requires', 'are required', 'requiring'], 'are required', 'Visitors nhận yêu cầu, cần bị động hiện tại.'),
      q('passive-voice', 2, 'The contract has been _____ by both companies.', ['sign', 'signed', 'signing', 'signs'], 'signed', 'has been + V3.'),
    ],
  },
  {
    id: 'active-passive-choice',
    group: 'Bị động và chủ động',
    title: 'Active vs passive choice',
    vietnameseTitle: 'Chọn chủ động hay bị động',
    level: 'Core TOEIC',
    partFocus: ['Part 5'],
    summary: 'Không phải thấy V3 là chọn bị động; phải xem chủ ngữ tự làm hành động hay nhận hành động.',
    patterns: ['S performs action -> active', 'S receives action -> passive'],
    rules: [
      'Nếu chủ ngữ là người/bộ phận thực hiện việc, thường dùng chủ động.',
      'Nếu chủ ngữ là tài liệu, sản phẩm, đơn hàng nhận tác động, thường dùng bị động.',
    ],
    toeicTraps: ['The manager approved... chủ động.', 'The proposal was approved... bị động.'],
    examples: [
      {
        sentence: 'The manager approved the budget yesterday.',
        meaning: 'Quản lý đã phê duyệt ngân sách hôm qua.',
        note: 'Manager là người thực hiện hành động.',
      },
      {
        sentence: 'The budget was approved yesterday.',
        meaning: 'Ngân sách đã được phê duyệt hôm qua.',
        note: 'Budget nhận hành động.',
      },
    ],
    questions: [
      q('active-passive-choice', 1, 'The director _____ the final report.', ['approved', 'was approved', 'approving', 'has been approved'], 'approved', 'Director thực hiện hành động.'),
      q('active-passive-choice', 2, 'The final report _____ by the director.', ['approved', 'was approved', 'approves', 'approving'], 'was approved', 'Report nhận hành động; by the director là tác nhân.'),
    ],
  },
  {
    id: 'gerunds-infinitives',
    group: 'Động từ theo sau',
    title: 'Gerunds and infinitives',
    vietnameseTitle: 'Danh động từ và động từ nguyên mẫu',
    level: 'Core TOEIC',
    partFocus: ['Part 5'],
    summary: 'Một số động từ theo sau bởi to V, một số theo sau bởi V-ing; đây là dạng bẫy rất phổ biến ở Part 5.',
    patterns: ['decide/plan/agree + to V', 'avoid/consider/finish + V-ing', 'look forward to + V-ing'],
    rules: [
      'Sau preposition dùng V-ing.',
      'Plan, decide, agree, expect thường đi với to V.',
      'Avoid, consider, finish, mind thường đi với V-ing.',
    ],
    toeicTraps: ['look forward to + V-ing vì to là giới từ.', 'be responsible for + V-ing.'],
    examples: [
      {
        sentence: 'We look forward to meeting you at the seminar.',
        meaning: 'Chúng tôi mong được gặp bạn tại hội thảo.',
        note: 'look forward to + V-ing.',
      },
    ],
    questions: [
      q('gerunds-infinitives', 1, 'The company plans _____ a new branch next year.', ['open', 'opening', 'to open', 'opened'], 'to open', 'plan + to V.'),
      q('gerunds-infinitives', 2, 'Please avoid _____ confidential information.', ['share', 'sharing', 'to share', 'shared'], 'sharing', 'avoid + V-ing.'),
    ],
  },
  {
    id: 'modals-obligation',
    group: 'Động từ theo sau',
    title: 'Modals of obligation and possibility',
    vietnameseTitle: 'Động từ khuyết thiếu',
    level: 'Foundation',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Can, could, may, might, must, should, have to thường xuất hiện trong thông báo, hướng dẫn và chính sách công ty.',
    patterns: ['modal + base verb', 'must/should/can + V', 'have to + V'],
    rules: [
      'Sau modal luôn dùng động từ nguyên mẫu không to.',
      'Must/have to diễn tả bắt buộc.',
      'May/might/could diễn tả khả năng hoặc xin phép lịch sự.',
    ],
    toeicTraps: ['Không dùng should to go.', 'must be + V3 là bị động với modal.'],
    examples: [
      {
        sentence: 'Employees must submit travel receipts within five days.',
        meaning: 'Nhân viên phải nộp biên lai đi lại trong vòng năm ngày.',
        note: 'must + submit.',
      },
    ],
    questions: [
      q('modals-obligation', 1, 'All guests must _____ at the reception desk.', ['register', 'registered', 'registering', 'to register'], 'register', 'Sau must dùng V nguyên mẫu.'),
      q('modals-obligation', 2, 'The package should be _____ by Friday.', ['deliver', 'delivered', 'delivering', 'delivers'], 'delivered', 'should be + V3 là bị động với modal.'),
    ],
  },
  {
    id: 'conditionals',
    group: 'Mệnh đề',
    title: 'Conditionals',
    vietnameseTitle: 'Câu điều kiện',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'TOEIC thường dùng if/unless/provided that trong email chính sách, bảo hành, đặt phòng, giao hàng.',
    patterns: ['If + present, will + V', 'If + past, would + V', 'Unless + clause'],
    rules: [
      'Điều kiện có thể xảy ra: If + present, will/can/may + V.',
      'Unless = if not.',
      'Không dùng will trong mệnh đề if chỉ điều kiện thông thường.',
    ],
    toeicTraps: ['If the shipment arrives, we will notify you.', 'Unless payment is received = If payment is not received.'],
    examples: [
      {
        sentence: 'If the payment is received today, the order will be shipped tomorrow.',
        meaning: 'Nếu khoản thanh toán được nhận hôm nay, đơn hàng sẽ được gửi ngày mai.',
        note: 'If + present, will + V.',
      },
    ],
    questions: [
      q('conditionals', 1, 'If the client _____ the contract, we will begin production.', ['signs', 'will sign', 'signed', 'signing'], 'signs', 'Mệnh đề if loại 1 dùng hiện tại đơn.'),
      q('conditionals', 2, 'Unless the invoice is paid, access _____ suspended.', ['is', 'will be', 'has been', 'being'], 'will be', 'Unless + present, main clause dùng will be.',
      ),
    ],
  },
  {
    id: 'comparatives-superlatives',
    group: 'Tính từ và trạng từ',
    title: 'Comparatives and superlatives',
    vietnameseTitle: 'So sánh hơn và so sánh nhất',
    level: 'Foundation',
    partFocus: ['Part 5'],
    summary: 'So sánh được dùng trong báo cáo hiệu suất, giá cả, dịch vụ, sản phẩm và phản hồi khách hàng.',
    patterns: ['comparative + than', 'the + superlative', 'as + adjective/adverb + as'],
    rules: [
      'So sánh hơn thường đi với than.',
      'So sánh nhất thường có the.',
      'Tính từ dài dùng more/most.',
    ],
    toeicTraps: ['more better là sai.', 'the most efficient, not most efficient nếu đứng trước danh từ xác định.'],
    examples: [
      {
        sentence: 'This printer is more efficient than the previous model.',
        meaning: 'Máy in này hiệu quả hơn mẫu trước.',
        note: 'more efficient than.',
      },
    ],
    questions: [
      q('comparatives-superlatives', 1, 'The new delivery system is _____ than the old one.', ['fast', 'faster', 'fastest', 'more fast'], 'faster', 'fast là tính từ ngắn, dùng faster than.'),
      q('comparatives-superlatives', 2, 'This is the _____ option available.', ['economical', 'more economical', 'most economical', 'economically'], 'most economical', 'the + superlative.'),
    ],
  },
  {
    id: 'adjectives-adverbs',
    group: 'Tính từ và trạng từ',
    title: 'Adjectives and adverbs',
    vietnameseTitle: 'Tính từ và trạng từ',
    level: 'Foundation',
    partFocus: ['Part 5'],
    summary: 'Chọn tính từ để bổ nghĩa danh từ/trạng thái, chọn trạng từ để bổ nghĩa động từ, tính từ hoặc cả câu.',
    patterns: ['adjective + noun', 'verb + adverb', 'be/seem/remain + adjective'],
    rules: [
      'Tính từ đứng trước danh từ.',
      'Trạng từ thường bổ nghĩa động từ.',
      'Sau linking verb như be, seem, remain dùng tính từ.',
    ],
    toeicTraps: ['hard và hardly khác nghĩa.', 'late và lately khác nghĩa.'],
    examples: [
      {
        sentence: 'The assistant handled the request professionally.',
        meaning: 'Trợ lý đã xử lý yêu cầu một cách chuyên nghiệp.',
        note: 'professionally bổ nghĩa cho handled.',
      },
    ],
    questions: [
      q('adjectives-adverbs', 1, 'The speaker gave a _____ explanation.', ['clear', 'clearly', 'clarity', 'clearer'], 'clear', 'Trước explanation cần tính từ.'),
      q('adjectives-adverbs', 2, 'The technician repaired the machine _____.', ['quick', 'quickly', 'quicken', 'quickness'], 'quickly', 'Bổ nghĩa cho repaired cần trạng từ.'),
    ],
  },
  {
    id: 'prepositions',
    group: 'Liên kết câu',
    title: 'Prepositions',
    vietnameseTitle: 'Giới từ trong TOEIC',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Giới từ trong TOEIC thường gắn với thời gian, địa điểm, phương thức, trách nhiệm và cụm cố định công sở.',
    patterns: ['at/on/in + time/place', 'responsible for', 'interested in', 'according to', 'because of'],
    rules: [
      'At dùng cho thời điểm chính xác; on dùng cho ngày; in dùng cho tháng/năm/khoảng thời gian.',
      'Sau giới từ là danh từ hoặc V-ing.',
      'Học theo cụm cố định thay vì dịch từng chữ.',
    ],
    toeicTraps: ['because + clause, because of + noun/gerund.', 'despite + noun/gerund, although + clause.'],
    examples: [
      {
        sentence: 'The training session starts at 9 a.m. on Monday.',
        meaning: 'Buổi đào tạo bắt đầu lúc 9 giờ sáng thứ Hai.',
        note: 'at + giờ, on + ngày.',
      },
    ],
    questions: [
      q('prepositions', 1, 'The report must be submitted _____ Friday.', ['at', 'on', 'in', 'to'], 'on', 'Friday là ngày, dùng on.'),
      q('prepositions', 2, 'Ms. Kim is responsible _____ ordering supplies.', ['to', 'with', 'for', 'by'], 'for', 'responsible for + V-ing/noun.'),
    ],
  },
  {
    id: 'conjunctions-transitions',
    group: 'Liên kết câu',
    title: 'Conjunctions and transitions',
    vietnameseTitle: 'Liên từ và từ nối',
    level: 'Core TOEIC',
    partFocus: ['Part 5', 'Part 6', 'Part 7'],
    summary: 'Part 6 rất hay kiểm tra từ nối theo logic: nguyên nhân, tương phản, bổ sung, kết quả, điều kiện.',
    patterns: ['although + clause', 'because + clause', 'therefore + sentence', 'however + sentence'],
    rules: [
      'Although/while diễn tả tương phản.',
      'Because/since/as diễn tả nguyên nhân.',
      'Therefore/thus/consequently diễn tả kết quả.',
      'In addition/furthermore diễn tả bổ sung.',
    ],
    toeicTraps: ['However thường nối hai câu hoặc sau dấu chấm/phẩy.', 'Despite đi với noun/V-ing, không đi trực tiếp với clause.'],
    examples: [
      {
        sentence: 'Although the deadline was tight, the team completed the project.',
        meaning: 'Mặc dù hạn chót gấp, nhóm đã hoàn thành dự án.',
        note: 'Although + clause.',
      },
    ],
    questions: [
      q('conjunctions-transitions', 1, '_____ the weather was bad, the flight departed on time.', ['Because', 'Although', 'Therefore', 'In addition'], 'Although', 'Hai vế tương phản: thời tiết xấu nhưng bay đúng giờ.'),
      q('conjunctions-transitions', 2, 'The printer is broken; _____, all reports will be sent by email.', ['however', 'therefore', 'although', 'despite'], 'therefore', 'Máy in hỏng -> kết quả là gửi email.'),
    ],
  },
  {
    id: 'participles',
    group: 'Mệnh đề rút gọn',
    title: 'Present and past participles',
    vietnameseTitle: 'V-ing và V-ed phân từ',
    level: 'Advanced TOEIC',
    partFocus: ['Part 5'],
    summary: 'TOEIC kiểm tra V-ing/V-ed để bổ nghĩa danh từ: người/vật gây ra cảm giác dùng V-ing, người/vật nhận cảm giác dùng V-ed.',
    patterns: ['V-ing noun', 'V-ed noun', 'noun + V-ing/V-ed phrase'],
    rules: [
      'V-ing mang nghĩa chủ động hoặc gây ra tác động.',
      'V-ed mang nghĩa bị động hoặc đã hoàn tất.',
      'Chọn theo quan hệ giữa danh từ và hành động.',
    ],
    toeicTraps: ['interested customers, interesting proposal.', 'attached file, not attaching file nếu file được đính kèm.'],
    examples: [
      {
        sentence: 'Please read the attached document before the meeting.',
        meaning: 'Vui lòng đọc tài liệu được đính kèm trước cuộc họp.',
        note: 'Document được đính kèm -> attached.',
      },
    ],
    questions: [
      q('participles', 1, 'The _____ instructions are included in the manual.', ['update', 'updated', 'updating', 'updates'], 'updated', 'Instructions đã được cập nhật, dùng V-ed.'),
      q('participles', 2, 'The _____ seminar attracted many new employees.', ['interest', 'interested', 'interesting', 'interestingly'], 'interesting', 'Seminar gây hứng thú, dùng V-ing.'),
    ],
  },
  {
    id: 'reduced-clauses',
    group: 'Mệnh đề rút gọn',
    title: 'Reduced relative and adverb clauses',
    vietnameseTitle: 'Rút gọn mệnh đề quan hệ và trạng ngữ',
    level: 'Advanced TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Mệnh đề có thể rút gọn bằng V-ing, V-ed hoặc to V tùy quan hệ chủ động/bị động/mục đích.',
    patterns: ['noun + V-ing', 'noun + V-ed', 'to V for purpose'],
    rules: [
      'Rút gọn chủ động dùng V-ing.',
      'Rút gọn bị động dùng V-ed.',
      'Rút gọn mục đích dùng to V.',
    ],
    toeicTraps: ['Applicants applying for the position...', 'Documents submitted after Friday...'],
    examples: [
      {
        sentence: 'Applications submitted after the deadline will not be accepted.',
        meaning: 'Đơn nộp sau hạn chót sẽ không được chấp nhận.',
        note: 'Applications that are submitted -> Applications submitted.',
      },
    ],
    questions: [
      q('reduced-clauses', 1, 'Guests _____ in the hotel lobby should show their badges.', ['wait', 'waiting', 'waited', 'to wait'], 'waiting', 'Guests who are waiting -> Guests waiting.'),
      q('reduced-clauses', 2, 'Forms _____ by Monday will receive priority.', ['submit', 'submitting', 'submitted', 'to submit'], 'submitted', 'Forms that are submitted -> Forms submitted.'),
    ],
  },
  {
    id: 'noun-clauses',
    group: 'Mệnh đề',
    title: 'Noun clauses',
    vietnameseTitle: 'Mệnh đề danh từ',
    level: 'Advanced TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Mệnh đề danh từ đóng vai trò chủ ngữ, tân ngữ hoặc bổ ngữ trong câu công việc.',
    patterns: ['what/when/where/why/how + S + V', 'that + S + V', 'whether/if + S + V'],
    rules: [
      'Trong mệnh đề danh từ, dùng trật tự S + V, không đảo như câu hỏi.',
      'Whether dùng khi nhấn mạnh hai khả năng.',
      'What thường vừa làm nghĩa “điều mà/cái mà” vừa giữ vai trò trong mệnh đề.',
    ],
    toeicTraps: ['I know where is the office là sai; phải là where the office is.', 'whether thường trang trọng hơn if.'],
    examples: [
      {
        sentence: 'The manager explained why the shipment was delayed.',
        meaning: 'Quản lý đã giải thích vì sao lô hàng bị trễ.',
        note: 'why + S + V.',
      },
    ],
    questions: [
      q('noun-clauses', 1, 'Please tell me _____ the conference room is.', ['where', 'where is', 'is where', 'where does'], 'where', 'Mệnh đề danh từ dùng trật tự where + S + V.'),
      q('noun-clauses', 2, 'The director confirmed _____ the budget had been approved.', ['that', 'what', 'where', 'who'], 'that', 'confirm that + clause.'),
    ],
  },
  {
    id: 'parallel-structure',
    group: 'Cấu trúc câu',
    title: 'Parallel structure',
    vietnameseTitle: 'Cấu trúc song song',
    level: 'Advanced TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Các thành phần trong danh sách hoặc sau and/or/but phải cùng dạng ngữ pháp.',
    patterns: ['noun, noun, and noun', 'to V, to V, and to V', 'V-ing, V-ing, and V-ing'],
    rules: [
      'Các mục trong danh sách nên cùng từ loại/dạng động từ.',
      'Sau both...and, either...or, not only...but also cần giữ cấu trúc cân bằng.',
    ],
    toeicTraps: ['to review, revise, and submitting là sai; phải cùng dạng.'],
    examples: [
      {
        sentence: 'The assistant is responsible for scheduling meetings, preparing files, and answering calls.',
        meaning: 'Trợ lý chịu trách nhiệm lên lịch họp, chuẩn bị hồ sơ và trả lời cuộc gọi.',
        note: 'Ba cụm đều là V-ing.',
      },
    ],
    questions: [
      q('parallel-structure', 1, 'The workshop teaches employees to plan, to organize, and _____.', ['communicating', 'communicate', 'to communicate', 'communication'], 'to communicate', 'Giữ song song: to plan, to organize, and to communicate.'),
      q('parallel-structure', 2, 'The job requires accuracy, patience, and _____.', ['reliable', 'reliability', 'reliably', 'rely'], 'reliability', 'Danh sách danh từ: accuracy, patience, reliability.'),
    ],
  },
  {
    id: 'inversion-emphasis',
    group: 'Cấu trúc câu',
    title: 'Inversion and emphasis',
    vietnameseTitle: 'Đảo ngữ và nhấn mạnh',
    level: 'Advanced TOEIC',
    partFocus: ['Part 5', 'Part 6'],
    summary: 'Ít gặp hơn nhưng hữu ích cho câu trang trọng: not only, rarely, never, only after, no sooner.',
    patterns: ['Not only + auxiliary + S + V, but S also V', 'Rarely + auxiliary + S + V'],
    rules: [
      'Sau cụm phủ định đứng đầu câu thường đảo trợ động từ lên trước chủ ngữ.',
      'Not only yêu cầu đảo ở vế đầu.',
    ],
    toeicTraps: ['Not only the manager approved là sai nếu dùng cấu trúc đảo; cần Not only did the manager approve.'],
    examples: [
      {
        sentence: 'Not only did the team finish early, but it also reduced costs.',
        meaning: 'Nhóm không chỉ hoàn thành sớm mà còn giảm chi phí.',
        note: 'Not only did + S + V.',
      },
    ],
    questions: [
      q('inversion-emphasis', 1, 'Not only _____ the product affordable, but it is also reliable.', ['is', 'are', 'does', 'has'], 'is', 'Not only + be + subject/adjective.'),
      q('inversion-emphasis', 2, 'Rarely _____ the company received so many complaints.', ['is', 'has', 'does', 'was'], 'has', 'Rarely + auxiliary + subject + V3.',
      ),
    ],
  },
  {
    id: 'business-email-grammar',
    group: 'TOEIC công sở',
    title: 'Business email grammar',
    vietnameseTitle: 'Ngữ pháp email công việc',
    level: 'Core TOEIC',
    partFocus: ['Part 6', 'Part 7'],
    summary: 'Tập trung các mẫu câu yêu cầu, thông báo, xác nhận, đính kèm, xin lỗi, hẹn lịch trong email TOEIC.',
    patterns: ['Please + V', 'We are pleased to + V', 'I would like to + V', 'Attached is/are + noun'],
    rules: [
      'Please + V nguyên mẫu cho yêu cầu lịch sự.',
      'Would like to + V dùng để diễn đạt mong muốn trang trọng.',
      'Attached is/are phụ thuộc danh từ phía sau.',
    ],
    toeicTraps: ['Attached are the documents, Attached is the document.', 'Please to send là sai.'],
    examples: [
      {
        sentence: 'Attached are the documents you requested.',
        meaning: 'Đính kèm là các tài liệu bạn đã yêu cầu.',
        note: 'documents số nhiều -> are.',
      },
      coreExamples.invoice,
    ],
    questions: [
      q('business-email-grammar', 1, 'Please _____ the attached file before Friday.', ['review', 'to review', 'reviewing', 'reviewed'], 'review', 'Please + V nguyên mẫu.'),
      q('business-email-grammar', 2, 'Attached _____ the revised contract.', ['are', 'is', 'be', 'were'], 'is', 'contract số ít -> is.'),
    ],
  },
];

export const toeicGrammarGroups = Array.from(new Set(toeicGrammarTopics.map((topic) => topic.group)));

export const toeicGrammarEnhancements: Record<string, ToeicGrammarEnhancement> = {
  'tenses-overview': {
    signals: [
      'Part 5 hay đặt trạng từ thời gian ngay trước hoặc sau chỗ trống: currently, recently, already, yet, since, for, by next month.',
      'Part 6 thường cần đọc câu trước/sau để biết sự kiện đang diễn ra, đã hoàn tất hay là kế hoạch sắp tới.',
      'Các email thông báo lịch họp, giao hàng, tuyển dụng thường dùng hiện tại đơn cho lịch trình và tương lai cho kế hoạch.',
    ],
    decisionSteps: [
      'Bước 1: gạch chân mốc thời gian trong câu.',
      'Bước 2: xác định hành động đã xong, đang diễn ra, lặp lại hay sẽ xảy ra.',
      'Bước 3: kiểm tra chủ ngữ số ít/số nhiều trước khi chọn dạng động từ.',
      'Bước 4: nếu có since/for, ưu tiên hiện tại hoàn thành trừ khi ngữ cảnh quá khứ rõ ràng.',
    ],
    commonMistakes: [
      'Dùng quá khứ đơn với since/for khi câu đang nối quá khứ với hiện tại.',
      'Chọn hiện tại tiếp diễn cho lịch trình cố định như train leaves, office opens.',
      'Bỏ qua mệnh đề phụ làm thay đổi mốc thời gian của câu.',
    ],
    businessFrames: [
      'The department has + V3 + the report since + time.',
      'The meeting will + V + at + time.',
      'The company is currently + V-ing + a new policy.',
      'The branch opens/closes + every/on/at + time.',
    ],
  },
  'present-simple-continuous': {
    signals: [
      'Every, usually, generally, normally, on Mondays thường kéo hiện tại đơn.',
      'Now, currently, at the moment, this week thường kéo hiện tại tiếp diễn.',
      'Lịch trình tàu, hội thảo, giờ mở cửa thường dùng hiện tại đơn dù nói về tương lai gần.',
    ],
    decisionSteps: [
      'Xác định câu nói về thói quen/quy trình hay hành động tạm thời.',
      'Nếu là động từ trạng thái như own, know, believe, prefer, kiểm tra kỹ trước khi chọn V-ing.',
      'Nếu chủ ngữ là company/team/office số ít, thêm s/es ở hiện tại đơn.',
    ],
    commonMistakes: [
      'The office is opening at 8 every day dùng sai nếu nói lịch trình cố định.',
      'Dùng V-ing với belong/contain/own trong câu trạng thái.',
      'Quên s/es với chủ ngữ số ít: The store opens.',
    ],
    businessFrames: [
      'The shuttle leaves every + period.',
      'The team is preparing + noun + this week.',
      'Our office handles + noun + daily.',
      'The supplier is updating + noun + now.',
    ],
  },
  'past-perfect-sequence': {
    signals: [
      'By the time, before, after, when, already là dấu hiệu cần xét thứ tự sự kiện.',
      'Past perfect thường xuất hiện khi câu có hai hành động quá khứ và một hành động xảy ra trước.',
      'While/as thường tạo bối cảnh quá khứ tiếp diễn.',
    ],
    decisionSteps: [
      'Đánh dấu hai hành động trong câu.',
      'Hành động xảy ra trước trong quá khứ dùng had + V3.',
      'Hành động xảy ra sau dùng quá khứ đơn.',
      'Nếu hành động đang diễn ra bị chen ngang, dùng was/were + V-ing cho hành động nền.',
    ],
    commonMistakes: [
      'Lạm dụng past perfect khi câu chỉ có một hành động quá khứ.',
      'Nhầm was closed là bị động; nhiều khi closed là tính từ trạng thái.',
      'Dùng had + V3 cho cả hai hành động làm câu nặng và sai thứ tự.',
    ],
    businessFrames: [
      'By the time + S + V2, S + had + V3.',
      'After + S + had + V3, S + V2.',
      'While + S + was/were + V-ing, S + V2.',
      'The office had already + V3 + before + noun/time.',
    ],
  },
  'subject-verb-agreement': {
    signals: [
      'Cụm of + danh từ số nhiều thường đứng giữa chủ ngữ và động từ để đánh lạc hướng.',
      'Each, every, either, neither, one thường kéo động từ số ít.',
      'A number of + plural noun thường số nhiều; the number of + plural noun thường số ít.',
    ],
    decisionSteps: [
      'Khoanh chủ ngữ thật, bỏ qua cụm giới từ chen giữa.',
      'Xác định chủ ngữ số ít, số nhiều hay danh từ tập hợp.',
      'Kiểm tra thì của câu sau khi đã chọn số ít/số nhiều.',
    ],
    commonMistakes: [
      'Chọn are vì thấy vendors trong The list of vendors.',
      'Nhầm each of the employees là số nhiều.',
      'Không nhận ra gerund làm chủ ngữ thường số ít: Reviewing reports takes time.',
    ],
    businessFrames: [
      'The list of + plural noun + is + complement.',
      'Each of the + plural noun + has + noun.',
      'A number of + plural noun + are + V-ing.',
      'The number of + plural noun + is + V-ing.',
    ],
  },
  'parts-of-speech': {
    signals: [
      'Đáp án cùng gốc từ là dấu hiệu kinh điển của câu hỏi từ loại: produce/product/productive/productively.',
      'Chỗ trống sau mạo từ/tính từ thường cần danh từ.',
      'Chỗ trống trước danh từ thường cần tính từ; sau động từ thường có thể cần trạng từ.',
    ],
    decisionSteps: [
      'Không dịch vội; nhìn từ đứng trước và sau chỗ trống.',
      'Xác định chỗ trống cần noun, verb, adjective hay adverb.',
      'Sau đó mới kiểm tra nghĩa của từ để tránh chọn đúng từ loại nhưng sai nghĩa.',
    ],
    commonMistakes: [
      'Chọn adverb trước danh từ vì thấy đuôi -ly quen mắt.',
      'Nhầm manager/management/managerial trong cụm danh từ.',
      'Quên rằng sau preposition cần noun hoặc V-ing.',
    ],
    businessFrames: [
      'a/an/the + adjective + noun',
      'verb + adverb',
      'be/remain/seem + adjective',
      'preposition + noun/V-ing',
    ],
  },
  'nouns-articles-quantifiers': {
    signals: [
      'Many, several, a few báo hiệu danh từ đếm được số nhiều.',
      'Much, little, a great deal of báo hiệu danh từ không đếm được.',
      'A/an báo hiệu danh từ đếm được số ít và phụ thuộc âm đầu của từ sau.',
    ],
    decisionSteps: [
      'Xác định danh từ đếm được hay không đếm được.',
      'Kiểm tra số ít/số nhiều.',
      'Chọn mạo từ/lượng từ phù hợp với loại danh từ.',
      'Để ý danh từ TOEIC hay gặp: equipment, information, advice, luggage không thêm s.',
    ],
    commonMistakes: [
      'Dùng equipments, informations, advices.',
      'Dùng many với danh từ không đếm được.',
      'Bỏ mạo từ trước danh từ đếm được số ít.',
    ],
    businessFrames: [
      'several + plural countable noun',
      'much/a little + uncountable noun',
      'a/an + singular countable noun',
      'the + noun already known in context',
    ],
  },
  'pronouns-reference': {
    signals: [
      'Đáp án gồm he/him/his/himself hoặc they/them/their/theirs thường kiểm tra chức năng đại từ.',
      'Part 6 có thể yêu cầu đọc câu trước để biết đại từ thay cho danh từ nào.',
      'Cụm by + reflexive pronoun diễn tả tự làm: by herself, by themselves.',
    ],
    decisionSteps: [
      'Xác định chỗ trống là chủ ngữ, tân ngữ, sở hữu hay phản thân.',
      'Tìm danh từ mà đại từ thay thế để chọn số ít/số nhiều và người/vật.',
      'Nếu sau chỗ trống là danh từ, thường cần possessive adjective: his/her/their/its.',
    ],
    commonMistakes: [
      'Dùng they trước danh từ thay vì their.',
      'Nhầm its và it’s.',
      'Dùng reflexive pronoun khi chủ ngữ và tân ngữ không cùng đối tượng.',
    ],
    businessFrames: [
      'S + submitted + possessive adjective + report.',
      'Please send + noun + to + object pronoun.',
      'S + completed the task by + reflexive pronoun.',
      'The office updated its schedule.',
    ],
  },
  'relative-clauses': {
    signals: [
      'Chỗ trống sau danh từ chỉ người/vật/nơi thường là relative pronoun.',
      'Whose luôn cần một danh từ ngay sau nó.',
      'Where chỉ dùng khi danh từ trước là nơi chốn và mệnh đề sau đủ chủ ngữ/động từ.',
    ],
    decisionSteps: [
      'Xác định danh từ trước chỗ trống là người, vật, nơi hay sở hữu.',
      'Xem trong mệnh đề sau thiếu chủ ngữ hay tân ngữ.',
      'Chọn who/which/that/whose/where theo vai trò thiếu đó.',
      'Nếu có dấu phẩy trong non-defining clause, tránh dùng that.',
    ],
    commonMistakes: [
      'Dùng where cho company khi mệnh đề sau thiếu tân ngữ.',
      'Dùng whose nhưng không có danh từ sau nó.',
      'Thêm thừa chủ ngữ sau relative pronoun: the person who he called.',
    ],
    businessFrames: [
      'The employee who + verb...',
      'The document which/that + subject + verb...',
      'The manager whose + noun + verb...',
      'The branch where + subject + verb...',
    ],
  },
  'passive-voice': {
    signals: [
      'Theo Purdue OWL, bị động hữu ích khi người thực hiện không quan trọng hoặc muốn đưa đối tượng chịu tác động lên trước.',
      'TOEIC hay dùng passive trong policy, notice, shipment, report, contract: is required, was sent, has been approved.',
      'Sau modal trong bị động dùng be + V3.',
    ],
    decisionSteps: [
      'Hỏi: chủ ngữ làm hành động hay nhận hành động?',
      'Nếu nhận hành động, chọn be/get + V3 đúng thì.',
      'Nếu có modal, chọn modal + be + V3.',
      'Không cần tìm by-phrase vì bị động TOEIC thường bỏ tác nhân.',
    ],
    commonMistakes: [
      'Chọn V-ing thay vì V3 sau be.',
      'Nghĩ câu bị động bắt buộc phải có by.',
      'Dùng bị động với động từ không cần tân ngữ trong ngữ cảnh đó.',
    ],
    businessFrames: [
      'Visitors are required to + V.',
      'The report was submitted + time.',
      'The contract has been approved.',
      'The package should be delivered + time.',
    ],
  },
  'active-passive-choice': {
    signals: [
      'Nếu chủ ngữ là người/bộ phận như manager/team/company và có tân ngữ sau động từ, khả năng cao là chủ động.',
      'Nếu chủ ngữ là proposal/report/order/package và không tự thực hiện hành động, khả năng cao là bị động.',
      'By + person/department là dấu hiệu mạnh của bị động.',
    ],
    decisionSteps: [
      'Tìm chủ ngữ và tân ngữ.',
      'Nếu chủ ngữ tác động lên tân ngữ -> active.',
      'Nếu chủ ngữ bị tác động -> passive.',
      'Sau đó kiểm tra thì và số ít/số nhiều.',
    ],
    commonMistakes: [
      'Thấy by là chọn sai thì bị động.',
      'Chọn passive vì câu nghe trang trọng dù chủ ngữ đang làm hành động.',
      'Quên thêm be trong passive.',
    ],
    businessFrames: [
      'The manager approved + object.',
      'The object was approved by + agent.',
      'The team will review + object.',
      'The object will be reviewed + time.',
    ],
  },
  'gerunds-infinitives': {
    signals: [
      'Đáp án gồm to V/V-ing/V/V3 thường kiểm tra verb pattern.',
      'Sau preposition luôn ưu tiên noun hoặc V-ing.',
      'Look forward to, be responsible for, be interested in là cụm TOEIC hay gặp.',
    ],
    decisionSteps: [
      'Nhìn động từ/tính từ/cụm giới từ trước chỗ trống.',
      'Xác định nó đi với to V hay V-ing.',
      'Nếu trước chỗ trống là preposition, chọn V-ing.',
      'Nếu là mục đích sau danh từ hoặc tính từ, cân nhắc to V.',
    ],
    commonMistakes: [
      'look forward to meet là sai.',
      'avoid to share là sai.',
      'Sau decide/plan chọn V-ing thay vì to V.',
    ],
    businessFrames: [
      'plan/decide/agree + to V',
      'avoid/consider/finish + V-ing',
      'look forward to + V-ing',
      'be responsible for + V-ing',
    ],
  },
  'modals-obligation': {
    signals: [
      'Must, should, can, may, might, could, would luôn đi với động từ nguyên mẫu không to.',
      'Thông báo nội quy thường dùng must/should/be required to.',
      'Chính sách hoặc khả năng thường dùng may/might/could.',
    ],
    decisionSteps: [
      'Xác định modal trước chỗ trống.',
      'Nếu chủ động: modal + V.',
      'Nếu bị động: modal + be + V3.',
      'Nếu phủ định: modal + not + V/be + V3.',
    ],
    commonMistakes: [
      'should to submit.',
      'must be submit thay vì must be submitted.',
      'Dùng modal + V-ing.',
    ],
    businessFrames: [
      'Employees must + V + object.',
      'The form must be + V3.',
      'Customers may + V + noun.',
      'The issue should be + V3 + soon.',
    ],
  },
  conditionals: {
    signals: [
      'If, unless, provided that, as long as báo hiệu câu điều kiện.',
      'Trong chính sách công ty, loại 1 là phổ biến nhất: điều kiện thật/có thể xảy ra.',
      'Unless = if not, thường dùng trong thông báo và điều khoản.',
    ],
    decisionSteps: [
      'Xác định điều kiện có thật/có thể xảy ra hay giả định.',
      'Điều kiện loại 1: if + present, will/can/may + V.',
      'Điều kiện giả định hiện tại: if + past, would + V.',
      'Không dùng will trong mệnh đề if loại 1 thông thường.',
    ],
    commonMistakes: [
      'If the client will sign...',
      'Unless payment is not received bị phủ định kép sai nghĩa.',
      'Nhầm unless với although.',
    ],
    businessFrames: [
      'If + S + V(s/es), S + will + V.',
      'Unless + S + V(s/es), S + will + V.',
      'Provided that + S + V, S + may + V.',
      'If + S + V2, S + would + V.',
    ],
  },
  'comparatives-superlatives': {
    signals: [
      'Than báo hiệu so sánh hơn.',
      'The + adjective/adverb + -est hoặc the most + adjective/adverb báo hiệu so sánh nhất.',
      'As ... as báo hiệu so sánh bằng.',
    ],
    decisionSteps: [
      'Tìm than, the, as...as.',
      'Xác định tính từ ngắn hay dài.',
      'Chọn comparative hoặc superlative phù hợp.',
      'Kiểm tra danh từ sau so sánh để tránh chọn trạng từ sai.',
    ],
    commonMistakes: [
      'more better.',
      'most efficient than.',
      'as faster as.',
    ],
    businessFrames: [
      'more/less + adjective + than',
      'adjective-er + than',
      'the most + adjective + noun',
      'as + adjective/adverb + as',
    ],
  },
  'adjectives-adverbs': {
    signals: [
      'Chỗ trống trước danh từ thường là adjective.',
      'Chỗ trống sau động từ hành động thường là adverb.',
      'Sau be/seem/remain/become thường là adjective.',
    ],
    decisionSteps: [
      'Xem từ được bổ nghĩa là danh từ, động từ, tính từ hay cả câu.',
      'Nếu bổ nghĩa danh từ -> adjective.',
      'Nếu bổ nghĩa động từ/tính từ/câu -> adverb.',
      'Cẩn thận các cặp hard/hardly, late/lately, near/nearly.',
    ],
    commonMistakes: [
      'The report was submitted quick.',
      'The quickly report.',
      'hardly nghĩa là hầu như không, không phải một cách chăm chỉ.',
    ],
    businessFrames: [
      'a highly effective strategy',
      'respond quickly to + noun',
      'remain available/open/closed',
      'carefully review + noun',
    ],
  },
  prepositions: {
    signals: [
      'Cambridge Grammar Today nhấn mạnh preposition là nguồn lỗi phổ biến vì cách dùng khác nhau giữa các ngôn ngữ.',
      'Các cụm cố định công sở thường được kiểm tra: responsible for, interested in, according to, due to, because of.',
      'Sau preposition là noun hoặc V-ing.',
    ],
    decisionSteps: [
      'Nhìn danh từ/động từ/tính từ trước chỗ trống để nhận collocation.',
      'Nếu là thời gian, phân biệt at/on/in.',
      'Nếu là nguyên nhân/tương phản, phân biệt because of/despite/due to.',
      'Kiểm tra sau giới từ có noun/V-ing hay clause.',
    ],
    commonMistakes: [
      'responsible to ordering thay vì responsible for ordering.',
      'because of the shipment was late thay vì because the shipment was late.',
      'in Monday thay vì on Monday.',
    ],
    businessFrames: [
      'responsible for + noun/V-ing',
      'according to + noun',
      'due to/because of + noun/V-ing',
      'at + exact time, on + day/date, in + month/year/period',
    ],
  },
  'conjunctions-transitions': {
    signals: [
      'Part 6 thường cần đọc câu trước/sau để chọn từ nối logic.',
      'Although/while/despite báo hiệu tương phản.',
      'Therefore/consequently/thus báo hiệu kết quả.',
      'Furthermore/in addition báo hiệu bổ sung.',
    ],
    decisionSteps: [
      'Xác định quan hệ giữa hai ý: nguyên nhân, kết quả, tương phản, bổ sung, điều kiện.',
      'Kiểm tra sau từ nối là clause hay noun/V-ing.',
      'Chọn conjunction nếu nối mệnh đề; chọn transition nếu nối câu/ý.',
      'Đọc lại toàn đoạn để kiểm tra mạch logic.',
    ],
    commonMistakes: [
      'Despite the weather was bad.',
      'Because of the client complained.',
      'Dùng however khi cần therefore.',
    ],
    businessFrames: [
      'Although + clause, main clause.',
      'Because + clause, main clause.',
      'Despite + noun/V-ing, main clause.',
      'Sentence; therefore, sentence.',
    ],
  },
  participles: {
    signals: [
      'Đáp án V-ing/V-ed thường yêu cầu xem danh từ đang gây ra hành động hay nhận hành động.',
      'V-ed thường mang nghĩa bị động/đã hoàn tất: attached file, updated schedule.',
      'V-ing thường mang nghĩa chủ động/gây tác động: leading company, interesting seminar.',
    ],
    decisionSteps: [
      'Tìm danh từ được bổ nghĩa.',
      'Hỏi danh từ đó làm hành động hay nhận hành động.',
      'Nếu làm/gây ra -> V-ing.',
      'Nếu nhận/bị tác động hoặc đã hoàn tất -> V-ed.',
    ],
    commonMistakes: [
      'attaching document thay vì attached document.',
      'interested seminar thay vì interesting seminar.',
      'Không phân biệt bored/boring, satisfied/satisfying.',
    ],
    businessFrames: [
      'attached document/file',
      'updated schedule/list',
      'leading company/provider',
      'remaining balance/items',
    ],
  },
  'reduced-clauses': {
    signals: [
      'Danh từ + V-ing/V-ed ngay sau thường là mệnh đề quan hệ rút gọn.',
      'Documents submitted... = documents that were submitted...',
      'Employees attending... = employees who are attending...',
    ],
    decisionSteps: [
      'Khôi phục mệnh đề đầy đủ trong đầu.',
      'Nếu mệnh đề đầy đủ là chủ động -> rút gọn V-ing.',
      'Nếu mệnh đề đầy đủ là bị động -> rút gọn V-ed.',
      'Nếu diễn tả mục đích -> dùng to V.',
    ],
    commonMistakes: [
      'Forms submitting by Monday.',
      'Guests waited in the lobby should...',
      'Dùng rút gọn khi chủ ngữ hai vế không cùng đối tượng.',
    ],
    businessFrames: [
      'Applicants applying for + noun',
      'Documents submitted after + time',
      'Items listed in + noun',
      'Employees selected for + noun',
    ],
  },
  'noun-clauses': {
    signals: [
      'Sau verbs như know, confirm, explain, announce, ask, decide có thể là noun clause.',
      'What/where/when/why/how trong noun clause không đảo trợ động từ như câu hỏi.',
      'That thường giới thiệu mệnh đề nội dung sau confirm/announce/report.',
    ],
    decisionSteps: [
      'Xác định mệnh đề làm tân ngữ/chủ ngữ/bổ ngữ.',
      'Dùng trật tự S + V bên trong mệnh đề.',
      'Chọn that nếu chỉ nối nội dung; chọn wh-word nếu cần nghĩa hỏi gián tiếp.',
      'Chọn whether/if nếu có hai khả năng.',
    ],
    commonMistakes: [
      'Please tell me where is the office.',
      'The manager explained why was the shipment late.',
      'Nhầm what với that khi chỗ trống cần vai trò trong mệnh đề.',
    ],
    businessFrames: [
      'Please confirm that + S + V.',
      'The manager explained why + S + V.',
      'We need to know whether + S + V.',
      'What + S + V + is + complement.',
    ],
  },
  'parallel-structure': {
    signals: [
      'Danh sách có dấu phẩy và and/or thường kiểm tra cấu trúc song song.',
      'Both...and, either...or, neither...nor, not only...but also yêu cầu cân bằng dạng.',
      'Các câu mô tả trách nhiệm công việc rất hay dùng V-ing song song.',
    ],
    decisionSteps: [
      'Gạch chân các thành phần trước và sau conjunction.',
      'Xác định dạng chung: noun, adjective, to V, V-ing hay clause.',
      'Chọn đáp án giữ cùng dạng với các thành phần còn lại.',
    ],
    commonMistakes: [
      'to plan, organizing, and communicate.',
      'accuracy, patience, and reliable.',
      'not only + noun but also + clause không cân bằng nếu đề yêu cầu cấu trúc song song.',
    ],
    businessFrames: [
      'responsible for V-ing, V-ing, and V-ing',
      'to V, to V, and to V',
      'noun, noun, and noun',
      'both adjective and adjective',
    ],
  },
  'inversion-emphasis': {
    signals: [
      'Rarely, seldom, never, hardly, only after, not only đứng đầu câu thường kéo đảo trợ động từ.',
      'Not only...but also là mẫu trang trọng có thể xuất hiện trong Part 6/7.',
      'Đảo ngữ thường kiểm tra auxiliary + subject + main verb.',
    ],
    decisionSteps: [
      'Nhận diện cụm phủ định/giới hạn ở đầu câu.',
      'Chọn trợ động từ phù hợp thì: do/does/did, has/have/had, is/are/was/were.',
      'Đặt trợ động từ trước chủ ngữ, động từ chính giữ dạng cơ bản/V3/V-ing theo thì.',
    ],
    commonMistakes: [
      'Not only the product is...',
      'Rarely the company has...',
      'Chọn sai auxiliary làm sai thì của câu.',
    ],
    businessFrames: [
      'Not only + auxiliary + S + V, but S also + V.',
      'Rarely + auxiliary + S + V.',
      'Only after + noun/clause + auxiliary + S + V.',
      'No sooner + had + S + V3 + than + S + V2.',
    ],
  },
  'business-email-grammar': {
    signals: [
      'Email TOEIC thường có please, attached, regarding, in response to, we are pleased to, we regret to.',
      'Part 6 có thể kiểm tra sự lịch sự, thì phù hợp và liên kết câu trong email.',
      'Attached is/are đảo vị trí chủ ngữ sau động từ.',
    ],
    decisionSteps: [
      'Xác định mục đích email: yêu cầu, xác nhận, xin lỗi, thông báo, đính kèm.',
      'Chọn cấu trúc lịch sự: Please + V, Would you please + V, We would like to + V.',
      'Với attached is/are, nhìn danh từ phía sau để chọn số ít/số nhiều.',
      'Đọc câu trước/sau để chọn từ nối hoặc đại từ tham chiếu.',
    ],
    commonMistakes: [
      'Please to review.',
      'Attached are the document.',
      'Dùng văn nói quá trực tiếp trong email trang trọng.',
    ],
    businessFrames: [
      'Please + V + object + by + deadline.',
      'We are pleased to inform you that + clause.',
      'Attached is/are + noun.',
      'If you have any questions, please contact + person/department.',
    ],
  },
};

export function getToeicGrammarTopic(id: string) {
  return toeicGrammarTopics.find((topic) => topic.id === id) ?? null;
}

export function getToeicGrammarEnhancement(id: string) {
  return toeicGrammarEnhancements[id] ?? null;
}
