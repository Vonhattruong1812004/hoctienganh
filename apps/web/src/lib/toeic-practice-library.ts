export type ToeicPracticeType = 'listening-reading' | 'speaking-writing';
export type ToeicPracticeMode = 'full' | 'part';

export type ToeicPracticeItem = {
  id: string;
  kind: 'choice' | 'writing' | 'speaking';
  prompt: string;
  stimulus?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  audioText?: string;
  choices?: string[];
  answer?: string;
  sampleAnswer?: string;
  explanation: string;
};

export type ToeicPracticePart = {
  id: string;
  section: 'Listening' | 'Reading' | 'Speaking' | 'Writing';
  label: string;
  title: string;
  officialQuestions: number;
  durationMinutes: number;
  directions: string;
  strategy: string[];
  items: ToeicPracticeItem[];
};

export type ToeicPracticeTest = {
  id: string;
  type: ToeicPracticeType;
  title: string;
  level: 'Starter' | 'Target 650+' | 'Target 800+';
  description: string;
  fullDurationMinutes: number;
  officialTotalQuestions: string;
  parts: ToeicPracticePart[];
};

const lrCommonParts: ToeicPracticePart[] = [
  {
    id: 'part-1',
    section: 'Listening',
    label: 'Part 1',
    title: 'Photographs',
    officialQuestions: 6,
    durationMinutes: 4,
    directions: 'Nghe 4 câu mô tả về ảnh và chọn câu mô tả đúng nhất. Trong app, audio được mô phỏng bằng giọng đọc.',
    strategy: ['Nhìn ảnh trước, đoán chủ thể và hành động.', 'Nghe danh từ + động từ chính.', 'Không suy diễn ngoài ảnh.'],
    items: [
      {
        id: 'lr-p1-1',
        kind: 'choice',
        stimulus: 'Photo: A woman is standing beside a printer in an office.',
        imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Woman_with_Xerox_9700_printer.jpg',
        imageAlt: 'A woman standing beside a large office printer.',
        imageCredit: 'Wikimedia Commons • Woman with Xerox 9700 printer',
        audioText:
          'A. The woman is repairing a window. B. The woman is holding some documents. C. The printer is being moved. D. The documents are on the floor.',
        prompt: 'Choose the sentence that best describes the picture.',
        choices: ['A', 'B', 'C', 'D'],
        answer: 'B',
        explanation: 'Ảnh có người phụ nữ đang cầm tài liệu cạnh máy in.',
      },
      {
        id: 'lr-p1-2',
        kind: 'choice',
        stimulus: 'Photo: Several workers are sitting around a conference table.',
        imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Staff_meeting_(3).jpg',
        imageAlt: 'Several people sitting around an office conference table.',
        imageCredit: 'Wikimedia Commons • Staff meeting',
        audioText:
          'A. The workers are boarding a train. B. Some people are seated at a table. C. A man is painting a wall. D. The table is empty.',
        prompt: 'Choose the sentence that best describes the picture.',
        choices: ['A', 'B', 'C', 'D'],
        answer: 'B',
        explanation: 'Câu B mô tả đúng người đang ngồi quanh bàn.',
      },
    ],
  },
  {
    id: 'part-2',
    section: 'Listening',
    label: 'Part 2',
    title: 'Question-Response',
    officialQuestions: 25,
    durationMinutes: 9,
    directions: 'Nghe câu hỏi/câu nói và 3 phản hồi, chọn phản hồi phù hợp nhất.',
    strategy: ['Bắt từ hỏi đầu câu.', 'Loại đáp án trả lời sai loại thông tin.', 'Cẩn thận đáp án lặp từ nhưng sai nghĩa.'],
    items: [
      {
        id: 'lr-p2-1',
        kind: 'choice',
        audioText: 'When will the training session begin? A. In the main conference room. B. At nine thirty. C. The trainer is new.',
        prompt: 'Select the best response.',
        choices: ['A', 'B', 'C'],
        answer: 'B',
        explanation: 'When hỏi thời gian, đáp án B trả lời thời gian.',
      },
      {
        id: 'lr-p2-2',
        kind: 'choice',
        audioText: 'Could you send me the revised invoice? A. Sure, I will email it this afternoon. B. It is on the third floor. C. The client arrived early.',
        prompt: 'Select the best response.',
        choices: ['A', 'B', 'C'],
        answer: 'A',
        explanation: 'Could you... là yêu cầu; phản hồi phù hợp là đồng ý gửi.',
      },
    ],
  },
  {
    id: 'part-3',
    section: 'Listening',
    label: 'Part 3',
    title: 'Conversations',
    officialQuestions: 39,
    durationMinutes: 17,
    directions: 'Nghe hội thoại công sở và trả lời câu hỏi.',
    strategy: ['Đọc câu hỏi trước.', 'Nghe vấn đề và hành động tiếp theo.', 'Chú ý chuyển hướng ở cuối hội thoại.'],
    items: [
      {
        id: 'lr-p3-1',
        kind: 'choice',
        audioText:
          'Woman: The client meeting has been moved to Thursday morning. Man: Thanks. Should I update the presentation today? Woman: Yes, and please add the new sales figures before noon.',
        prompt: 'What does the woman ask the man to do?',
        choices: ['Reserve a meeting room', 'Add sales figures to a presentation', 'Call the client', 'Move the meeting to noon'],
        answer: 'Add sales figures to a presentation',
        explanation: 'Người nữ yêu cầu thêm số liệu bán hàng mới trước buổi trưa.',
      },
      {
        id: 'lr-p3-2',
        kind: 'choice',
        audioText:
          'Man: I ordered ten laptops last week, but only eight arrived. Woman: I will contact the supplier and ask them to send the missing items. Man: Great, we need them for orientation.',
        prompt: 'What is the problem?',
        choices: ['The laptops are too expensive', 'The supplier sent too many laptops', 'Two laptops are missing', 'Orientation was canceled'],
        answer: 'Two laptops are missing',
        explanation: 'Đã đặt 10 nhưng chỉ nhận 8, thiếu 2 chiếc.',
      },
    ],
  },
  {
    id: 'part-4',
    section: 'Listening',
    label: 'Part 4',
    title: 'Talks',
    officialQuestions: 30,
    durationMinutes: 15,
    directions: 'Nghe bài nói ngắn như thông báo, tin nhắn thoại hoặc quảng cáo.',
    strategy: ['Xác định loại bài nói.', 'Nghe mục đích ở đầu.', 'Nghe hành động cần làm ở cuối.'],
    items: [
      {
        id: 'lr-p4-1',
        kind: 'choice',
        audioText:
          'Good morning. This is a reminder that the staff entrance will be closed tomorrow due to maintenance. Employees should use the west entrance until further notice.',
        prompt: 'What are employees asked to do?',
        choices: ['Arrive earlier than usual', 'Use the west entrance', 'Call the maintenance team', 'Cancel their appointments'],
        answer: 'Use the west entrance',
        explanation: 'Thông báo yêu cầu nhân viên dùng lối vào phía tây.',
      },
      {
        id: 'lr-p4-2',
        kind: 'choice',
        audioText:
          'Thank you for calling Greenway Catering. We are offering a ten percent discount on lunch orders for corporate events booked before Friday.',
        prompt: 'What is being advertised?',
        choices: ['A catering discount', 'A job opening', 'A delivery delay', 'A training course'],
        answer: 'A catering discount',
        explanation: 'Bài nói quảng cáo giảm giá dịch vụ catering.',
      },
    ],
  },
  {
    id: 'part-5',
    section: 'Reading',
    label: 'Part 5',
    title: 'Incomplete Sentences',
    officialQuestions: 30,
    durationMinutes: 12,
    directions: 'Chọn đáp án tốt nhất để hoàn thành câu.',
    strategy: ['Nhìn đáp án để nhận dạng câu hỏi từ loại/thì/từ vựng.', 'Xử lý câu ngữ pháp thật nhanh.', 'Không quá 35 giây/câu.'],
    items: [
      {
        id: 'lr-p5-1',
        kind: 'choice',
        prompt: 'The marketing team will release the new brochure _____ Friday.',
        choices: ['on', 'at', 'in', 'to'],
        answer: 'on',
        explanation: 'Friday là ngày, dùng giới từ on.',
      },
      {
        id: 'lr-p5-2',
        kind: 'choice',
        prompt: 'All visitors are _____ to wear identification badges.',
        choices: ['require', 'requires', 'required', 'requiring'],
        answer: 'required',
        explanation: 'Câu bị động: are required to.',
      },
      {
        id: 'lr-p5-3',
        kind: 'choice',
        prompt: 'The new software helps employees work more _____.',
        choices: ['efficient', 'efficiency', 'efficiently', 'efficiencies'],
        answer: 'efficiently',
        explanation: 'Bổ nghĩa cho động từ work cần trạng từ.',
      },
    ],
  },
  {
    id: 'part-6',
    section: 'Reading',
    label: 'Part 6',
    title: 'Text Completion',
    officialQuestions: 16,
    durationMinutes: 10,
    directions: 'Hoàn thành văn bản bằng từ/cụm/câu phù hợp.',
    strategy: ['Đọc loại văn bản.', 'Dùng câu trước/sau để chọn logic.', 'Giữ nhất quán thì và đại từ.'],
    items: [
      {
        id: 'lr-p6-1',
        kind: 'choice',
        stimulus:
          'Memo: The customer service department will move to the fifth floor next Monday. _____, all phone extensions will remain the same.',
        prompt: 'Choose the best word to complete the text.',
        choices: ['However', 'Because', 'During', 'Unless'],
        answer: 'However',
        explanation: 'Chuyển tầng nhưng số máy vẫn giữ nguyên -> tương phản nhẹ, dùng However.',
      },
      {
        id: 'lr-p6-2',
        kind: 'choice',
        stimulus:
          'Email: Thank you for your interest in our training program. Please complete the attached form and return it by May 20. _____',
        prompt: 'Choose the best sentence to complete the email.',
        choices: [
          'We look forward to receiving your application.',
          'The printer is located near the reception desk.',
          'The restaurant closes every Monday.',
          'Our warehouse manager has resigned.',
        ],
        answer: 'We look forward to receiving your application.',
        explanation: 'Câu này nối logic với việc hoàn thành và gửi form đăng ký.',
      },
    ],
  },
  {
    id: 'part-7',
    section: 'Reading',
    label: 'Part 7',
    title: 'Reading Comprehension',
    officialQuestions: 54,
    durationMinutes: 53,
    directions: 'Đọc văn bản đơn hoặc nhiều văn bản và trả lời câu hỏi.',
    strategy: ['Đọc câu hỏi trước.', 'Scan keyword.', 'Với multiple passages, nối thông tin giữa các văn bản.'],
    items: [
      {
        id: 'lr-p7-1',
        kind: 'choice',
        stimulus:
          'Email: Dear Ms. Park, Your order of 25 office chairs has shipped. The delivery company will contact you on Wednesday to arrange a drop-off time. Please inspect the items upon arrival and report any damage within two business days.',
        prompt: 'What should Ms. Park do after receiving the chairs?',
        choices: ['Pay an additional fee', 'Inspect the items', 'Call the sales manager immediately', 'Cancel the delivery'],
        answer: 'Inspect the items',
        explanation: 'Email yêu cầu kiểm tra hàng khi nhận.',
      },
      {
        id: 'lr-p7-2',
        kind: 'choice',
        stimulus:
          'Notice: The employee cafeteria will be closed from June 3 to June 7 for renovations. During this period, food trucks will be available in the north parking lot from 11:30 a.m. to 1:30 p.m.',
        prompt: 'Why will the cafeteria be closed?',
        choices: ['For staff training', 'For renovations', 'Because of a holiday', 'Because food trucks are unavailable'],
        answer: 'For renovations',
        explanation: 'Thông báo ghi rõ cafeteria đóng để sửa chữa.',
      },
    ],
  },
];

const swCommonParts: ToeicPracticePart[] = [
  {
    id: 'speaking-1',
    section: 'Speaking',
    label: 'Questions 1-2',
    title: 'Read a text aloud',
    officialQuestions: 2,
    durationMinutes: 4,
    directions: 'Đọc to đoạn văn như bài thi Speaking.',
    strategy: ['Đọc theo cụm nghĩa.', 'Giữ âm cuối rõ.', 'Ngắt nghỉ ở dấu câu.'],
    items: [
      {
        id: 'sw-s1-1',
        kind: 'speaking',
        prompt:
          'Please read aloud: Welcome to the annual sales conference. Registration begins at eight thirty in the main lobby, and the opening presentation will start at nine.',
        sampleAnswer: 'Đọc rõ, ngắt sau conference, lobby; nhấn annual sales conference, registration, opening presentation.',
        explanation: 'Task này chấm phát âm, ngữ điệu và độ trôi chảy.',
      },
    ],
  },
  {
    id: 'speaking-2',
    section: 'Speaking',
    label: 'Questions 3-4',
    title: 'Describe a picture',
    officialQuestions: 2,
    durationMinutes: 4,
    directions: 'Mô tả ảnh trong 30 giây.',
    strategy: ['Place -> people -> actions -> objects.', 'Dùng present continuous.', 'Không suy diễn ngoài ảnh.'],
    items: [
      {
        id: 'sw-s2-1',
        kind: 'speaking',
        stimulus: 'Picture: Two employees are reviewing charts on a laptop in a meeting room.',
        prompt: 'Describe the picture in as much detail as possible.',
        sampleAnswer:
          'This picture shows two employees in a meeting room. They are looking at a laptop and reviewing some charts. There are documents on the table, and they seem to be discussing a project.',
        explanation: 'Câu trả lời mẫu có địa điểm, người, hành động và vật thể.',
      },
    ],
  },
  {
    id: 'speaking-3',
    section: 'Speaking',
    label: 'Questions 5-7',
    title: 'Respond to questions',
    officialQuestions: 3,
    durationMinutes: 4,
    directions: 'Trả lời câu hỏi ngắn về tình huống quen thuộc.',
    strategy: ['Answer directly.', 'Add one reason.', 'For Q7, add an example.'],
    items: [
      {
        id: 'sw-s3-1',
        kind: 'speaking',
        prompt: 'Do you prefer attending meetings online or in person? Why?',
        sampleAnswer:
          'I prefer online meetings because they save travel time. They are also convenient when team members work in different locations.',
        explanation: 'Trả lời trực tiếp + lý do rõ.',
      },
    ],
  },
  {
    id: 'speaking-4',
    section: 'Speaking',
    label: 'Questions 8-10',
    title: 'Respond using information provided',
    officialQuestions: 3,
    durationMinutes: 5,
    directions: 'Dùng bảng/lịch thông tin để trả lời.',
    strategy: ['Đọc tiêu đề và cột.', 'Tìm đúng hàng.', 'Trả lời bằng câu đầy đủ.'],
    items: [
      {
        id: 'sw-s4-1',
        kind: 'speaking',
        stimulus: 'Schedule: 9:00 Product Demo - Room A; 10:30 Marketing Workshop - Room B; 1:00 Client Panel - Auditorium.',
        prompt: 'Where will the Marketing Workshop take place?',
        sampleAnswer: 'The Marketing Workshop will take place in Room B at ten thirty.',
        explanation: 'Câu trả lời lấy đúng hàng Marketing Workshop.',
      },
    ],
  },
  {
    id: 'speaking-5',
    section: 'Speaking',
    label: 'Question 11',
    title: 'Express an opinion',
    officialQuestions: 1,
    durationMinutes: 3,
    directions: 'Nêu và bảo vệ quan điểm.',
    strategy: ['Opinion -> reason -> example -> closing.', 'Chọn một phía rõ.', 'Nói mạch lạc hơn là dùng từ khó.'],
    items: [
      {
        id: 'sw-s5-1',
        kind: 'speaking',
        prompt: 'Do you think companies should allow employees to work from home? Give reasons and examples.',
        sampleAnswer:
          'I think companies should allow employees to work from home because it can improve productivity. Employees can save commuting time and focus better on important tasks. For example, when I work from home, I can start earlier and finish reports faster.',
        explanation: 'Cấu trúc có quan điểm, lý do và ví dụ.',
      },
    ],
  },
  {
    id: 'writing-1',
    section: 'Writing',
    label: 'Questions 1-5',
    title: 'Write a sentence based on a picture',
    officialQuestions: 5,
    durationMinutes: 8,
    directions: 'Viết câu dựa trên ảnh và dùng từ bắt buộc.',
    strategy: ['Có chủ ngữ + động từ.', 'Dùng đủ 2 từ.', 'Liên quan trực tiếp ảnh.'],
    items: [
      {
        id: 'sw-w1-1',
        kind: 'writing',
        stimulus: 'Picture: A delivery worker is carrying boxes into an office. Required words: carry, boxes.',
        prompt: 'Write one sentence based on the picture using both required words.',
        sampleAnswer: 'A delivery worker is carrying boxes into an office.',
        explanation: 'Câu dùng đủ carry/boxes và mô tả đúng ảnh.',
      },
    ],
  },
  {
    id: 'writing-2',
    section: 'Writing',
    label: 'Questions 6-7',
    title: 'Respond to a written request',
    officialQuestions: 2,
    durationMinutes: 20,
    directions: 'Viết email phản hồi yêu cầu.',
    strategy: ['Chào + trả lời đủ yêu cầu + kết thúc lịch sự.', 'Dùng văn phong công sở.', 'Không bỏ sót yêu cầu.'],
    items: [
      {
        id: 'sw-w2-1',
        kind: 'writing',
        stimulus:
          'Email request: Your manager asks you to suggest a location for next month’s team lunch and explain why it is suitable.',
        prompt: 'Write an email response.',
        sampleAnswer:
          'Dear Ms. Lee, I recommend Green Garden Restaurant for next month’s team lunch. It is close to our office, and it has enough space for a large group. The menu also includes vegetarian options. Please let me know if you would like me to make a reservation. Best regards,',
        explanation: 'Email trả lời đúng yêu cầu: địa điểm + lý do + hành động tiếp theo.',
      },
    ],
  },
  {
    id: 'writing-3',
    section: 'Writing',
    label: 'Question 8',
    title: 'Write an opinion essay',
    officialQuestions: 1,
    durationMinutes: 30,
    directions: 'Viết bài luận quan điểm.',
    strategy: ['Thesis rõ.', '2 lý do có ví dụ.', 'Kết luận ngắn.'],
    items: [
      {
        id: 'sw-w3-1',
        kind: 'writing',
        prompt: 'Some people think teamwork is more important than individual skill in the workplace. Do you agree or disagree?',
        sampleAnswer:
          'A strong essay should state a clear opinion, explain two reasons, and support each reason with workplace examples.',
        explanation: 'Bài tốt cần quan điểm rõ, lý do phát triển và ví dụ cụ thể.',
      },
    ],
  },
];

export const toeicPracticeTests: ToeicPracticeTest[] = [
  {
    id: 'lr-office-set-a',
    type: 'listening-reading',
    title: 'L&R Practice Test A - Office Operations',
    level: 'Target 650+',
    description: 'Đề mô phỏng chủ đề văn phòng, lịch họp, hóa đơn, giao hàng và thông báo nội bộ.',
    fullDurationMinutes: 120,
    officialTotalQuestions: '200 câu theo format thật',
    parts: lrCommonParts,
  },
  {
    id: 'lr-business-set-b',
    type: 'listening-reading',
    title: 'L&R Practice Test B - Business Services',
    level: 'Target 800+',
    description: 'Đề luyện tốc độ với bối cảnh dịch vụ khách hàng, nhà cung cấp, sự kiện và báo cáo.',
    fullDurationMinutes: 120,
    officialTotalQuestions: '200 câu theo format thật',
    parts: lrCommonParts.map((part) => ({ ...part, id: `${part.id}-b` })),
  },
  {
    id: 'sw-workplace-set-a',
    type: 'speaking-writing',
    title: 'S&W Practice Test A - Workplace Communication',
    level: 'Target 650+',
    description: 'Đề mô phỏng Speaking/Writing theo tình huống công việc: đọc, mô tả ảnh, email và opinion.',
    fullDurationMinutes: 80,
    officialTotalQuestions: 'Speaking 11 câu + Writing 8 câu',
    parts: swCommonParts,
  },
  {
    id: 'sw-career-set-b',
    type: 'speaking-writing',
    title: 'S&W Practice Test B - Career & Meetings',
    level: 'Target 800+',
    description: 'Đề luyện phản xạ nói/viết với chủ đề họp, đào tạo, làm việc từ xa và dịch vụ khách hàng.',
    fullDurationMinutes: 80,
    officialTotalQuestions: 'Speaking 11 câu + Writing 8 câu',
    parts: swCommonParts.map((part) => ({ ...part, id: `${part.id}-b` })),
  },
];

export function getToeicPracticeTest(id: string) {
  return toeicPracticeTests.find((test) => test.id === id) ?? toeicPracticeTests[0];
}
