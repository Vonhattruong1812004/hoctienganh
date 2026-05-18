export type ToeicGuidePart = {
  id: string;
  section: string;
  partLabel: string;
  title: string;
  questions: string;
  time: string;
  officialFormat: string;
  goal: string;
  howToDo: string[];
  highScoreTips: string[];
  traps: string[];
  practicePlan: string[];
};

export type ToeicGuideTest = {
  id: 'listening-reading' | 'speaking-writing';
  title: string;
  vietnameseTitle: string;
  overview: string;
  total: string;
  scoreScale: string;
  sourceNote: string;
  parts: ToeicGuidePart[];
};

export const toeicGuideTests: ToeicGuideTest[] = [
  {
    id: 'listening-reading',
    title: 'TOEIC Listening & Reading',
    vietnameseTitle: 'Bài thi Nghe và Đọc',
    overview:
      'Bài TOEIC Listening & Reading đo năng lực hiểu tiếng Anh trong môi trường làm việc. Theo IIBC/ETS, bài thi gồm 200 câu trong khoảng 2 giờ: Listening khoảng 45 phút, Reading 75 phút.',
    total: '200 câu • khoảng 2 giờ',
    scoreScale: '10-990',
    sourceNote: 'Dựa trên cấu trúc chính thức IIBC/ETS: Listening 100 câu, Reading 100 câu.',
    parts: [
      {
        id: 'lr-part-1',
        section: 'Listening',
        partLabel: 'Part 1',
        title: 'Photographs',
        questions: '6 câu',
        time: 'Nghe một lần',
        officialFormat:
          'Nhìn một bức ảnh, nghe 4 câu mô tả ngắn không in trong đề, chọn câu mô tả đúng nhất.',
        goal: 'Nhận diện hành động, vị trí, vật thể, trạng thái trong ảnh thật nhanh.',
        howToDo: [
          'Trước khi nghe, nhìn ảnh và tự gọi tên người/vật/hành động chính.',
          'Dự đoán động từ đang diễn ra: standing, holding, loading, repairing, placing.',
          'Loại câu sai tuyệt đối về người, vật, vị trí hoặc hành động.',
          'Chọn câu mô tả trực tiếp trong ảnh, không suy diễn ngoài ảnh.',
        ],
        highScoreTips: [
          'Ưu tiên nghe danh từ và động từ chính, không cần dịch cả câu.',
          'Cẩn thận bẫy âm gần giống: copy/coffee, walking/working.',
          'Nếu ảnh không có người, tập trung vật thể + vị trí: on, next to, beside, in front of.',
        ],
        traps: [
          'Câu đúng ngữ pháp nhưng mô tả vật không có trong ảnh.',
          'Câu dùng thì tương lai hoặc quá khứ trong khi ảnh chỉ mô tả hiện tại.',
          'Từ nghe giống từ trong ảnh nhưng nghĩa sai.',
        ],
        practicePlan: [
          'Mỗi ngày luyện 20 ảnh văn phòng, nhà hàng, giao thông, kho hàng.',
          'Tự nói 3 câu mô tả ảnh trước khi nghe đáp án.',
          'Ghi lại các động từ mô tả hành động thường gặp.',
        ],
      },
      {
        id: 'lr-part-2',
        section: 'Listening',
        partLabel: 'Part 2',
        title: 'Question-Response',
        questions: '25 câu',
        time: 'Nghe một lần',
        officialFormat:
          'Nghe một câu hỏi hoặc câu nói và 3 phản hồi không in trong đề, chọn phản hồi phù hợp nhất.',
        goal: 'Bắt từ hỏi, chức năng giao tiếp và phản hồi tự nhiên.',
        howToDo: [
          'Nghe kỹ từ đầu tiên: Who, What, When, Where, Why, How, Did, Would, Could.',
          'Xác định câu hỏi cần thông tin, xác nhận, lời đề nghị hay lời mời.',
          'Không chọn đáp án lặp lại từ khóa y chang nếu nghĩa không trả lời câu hỏi.',
          'Nếu không nghe rõ toàn câu, dùng loại câu trả lời sai loại: hỏi When thì không chọn nơi chốn.',
        ],
        highScoreTips: [
          'Với câu Yes/No, đáp án đúng có thể không bắt đầu bằng yes/no mà là câu gián tiếp.',
          'Với câu lựa chọn A or B, nghe xem đáp án chọn một bên, cả hai, hoặc từ chối lựa chọn.',
          'Luyện phản xạ câu hỏi công sở: meeting, appointment, report, shipment, invoice.',
        ],
        traps: [
          'Same-word trap: đáp án lặp từ trong câu hỏi nhưng không hợp nghĩa.',
          'Who/Where/When nghe nhanh dễ nhầm.',
          'Câu trả lời mơ hồ nhưng tự nhiên hơn câu trả lời dịch máy móc.',
        ],
        practicePlan: [
          'Luyện 50 câu hỏi ngắn mỗi ngày, chỉ tập bắt từ hỏi và ý định.',
          'Tự tạo câu trả lời tự nhiên cho từng câu hỏi.',
          'Nghe lại câu sai và phân loại sai do từ hỏi, từ vựng hay bẫy âm.',
        ],
      },
      {
        id: 'lr-part-3',
        section: 'Listening',
        partLabel: 'Part 3',
        title: 'Conversations',
        questions: '39 câu',
        time: 'Nghe một lần',
        officialFormat:
          'Nghe hội thoại giữa 2 hoặc 3 người, trả lời 3 câu hỏi cho mỗi hội thoại. Một số câu cần kết hợp thông tin trong biểu đồ/hình trong đề.',
        goal: 'Nắm ngữ cảnh, người nói, mục đích, vấn đề, hành động tiếp theo.',
        howToDo: [
          'Đọc nhanh 3 câu hỏi trước khi audio bắt đầu.',
          'Gạch từ khóa: who, where, why, problem, next, imply, graphic.',
          'Nghe theo luồng: mở đầu cho bối cảnh, giữa cho vấn đề, cuối cho quyết định/hành động.',
          'Với câu graphic, nối thông tin nghe được với bảng/biểu đồ trong đề.',
        ],
        highScoreTips: [
          'Không cố nghe từng chữ; nghe ý chính và dấu chuyển hướng như but, actually, however.',
          'Câu hỏi “What will the speaker probably do next?” thường nằm cuối hội thoại.',
          'Tập nghe giọng nam/nữ và vai trò: customer, clerk, manager, employee.',
        ],
        traps: [
          'Đáp án chứa từ đã nghe nhưng thuộc chi tiết phụ.',
          'Nghe nhầm người nói A làm việc của người nói B.',
          'Bỏ qua câu phủ định hoặc thay đổi kế hoạch ở cuối.',
        ],
        practicePlan: [
          'Luyện theo cụm 10 hội thoại, sau mỗi cụm ghi lại context-problem-next action.',
          'Tập đọc câu hỏi trong 7-10 giây trước khi nghe.',
          'Luyện câu có graphic bằng cách đọc bảng trước, đoán dữ liệu cần nghe.',
        ],
      },
      {
        id: 'lr-part-4',
        section: 'Listening',
        partLabel: 'Part 4',
        title: 'Talks',
        questions: '30 câu',
        time: 'Nghe một lần',
        officialFormat:
          'Nghe bài nói ngắn như thông báo, tin nhắn thoại, giới thiệu, quảng cáo hoặc hướng dẫn; trả lời 3 câu hỏi cho mỗi bài.',
        goal: 'Xác định loại bài nói, đối tượng nghe, mục đích và thông tin chi tiết.',
        howToDo: [
          'Đọc câu hỏi trước để biết cần nghe số, tên, địa điểm, mục đích hay hành động tiếp theo.',
          'Nhận dạng loại audio: announcement, voicemail, advertisement, news report, tour guide.',
          'Ghi nhớ khung bài: mở đầu nêu mục đích, giữa đưa chi tiết, cuối nêu yêu cầu/hành động.',
          'Với biểu đồ, xác định cột/hàng cần đối chiếu trước khi nghe.',
        ],
        highScoreTips: [
          'Tập bắt cụm báo hiệu: due to, starting next week, please remember, for more information.',
          'Câu hỏi mục đích thường trả lời được ngay phần đầu.',
          'Câu hỏi chi tiết số/ngày cần nghe chính xác nhưng không sa vào dịch toàn bài.',
        ],
        traps: [
          'Thông tin bị sửa lại: The meeting was scheduled for Monday, but it has been moved to Wednesday.',
          'Đáp án đúng dùng paraphrase, không lặp y nguyên audio.',
          'Thông tin trong graphic chỉ đúng khi kết hợp với audio.',
        ],
        practicePlan: [
          'Mỗi ngày luyện 5 voicemail, 5 announcement, 5 advertisement.',
          'Sau mỗi bài tóm tắt bằng 1 câu: ai nói, nói với ai, để làm gì.',
          'Luyện ghi keyword cực ngắn: date, place, action.',
        ],
      },
      {
        id: 'lr-part-5',
        section: 'Reading',
        partLabel: 'Part 5',
        title: 'Incomplete Sentences',
        questions: '30 câu',
        time: 'Khoảng 10-12 phút mục tiêu',
        officialFormat: 'Chọn đáp án tốt nhất trong 4 lựa chọn để hoàn thành câu.',
        goal: 'Ăn điểm nhanh bằng ngữ pháp, từ loại, collocation và nghĩa câu.',
        howToDo: [
          'Nhìn 4 đáp án trước: nếu cùng gốc từ -> câu từ loại; nếu cùng động từ khác thì -> câu thì/bị động.',
          'Xác định vị trí chỗ trống cần noun, verb, adjective, adverb, preposition hay conjunction.',
          'Chỉ đọc đủ cụm quanh chỗ trống với câu ngữ pháp; đọc toàn câu khi câu hỏi từ vựng/nghĩa.',
          'Không dành quá 35 giây cho một câu khó.',
        ],
        highScoreTips: [
          'Học collocation công sở: responsible for, interested in, comply with, according to.',
          'Tách câu hỏi thành nhóm: word form, verb form, preposition, conjunction, vocabulary.',
          'Mục tiêu điểm cao là tốc độ ổn định để giữ thời gian cho Part 7.',
        ],
        traps: [
          'Đáp án đúng từ loại nhưng sai nghĩa.',
          'Cụm giới từ chen giữa làm sai hòa hợp chủ ngữ - động từ.',
          'Because/because of, although/despite, during/while.',
        ],
        practicePlan: [
          'Luyện 30 câu/ngày theo timer 12 phút.',
          'Sau khi sai, ghi lỗi theo nhóm chứ không chỉ ghi đáp án.',
          'Ôn song song UC Học ngữ pháp TOEIC trong app.',
        ],
      },
      {
        id: 'lr-part-6',
        section: 'Reading',
        partLabel: 'Part 6',
        title: 'Text Completion',
        questions: '16 câu',
        time: 'Khoảng 8-10 phút mục tiêu',
        officialFormat:
          'Chọn từ, cụm từ hoặc câu tốt nhất để hoàn thành văn bản. Mỗi đoạn có 4 câu hỏi.',
        goal: 'Kết hợp ngữ pháp câu với logic đoạn văn.',
        howToDo: [
          'Đọc tiêu đề/ngữ cảnh nhanh để biết loại văn bản: email, notice, memo, article.',
          'Với câu từ loại/ngữ pháp, xử lý như Part 5.',
          'Với câu nối hoặc điền cả câu, đọc câu trước và câu sau.',
          'Chọn đáp án giữ mạch văn nhất quán về thì, đại từ, logic và giọng văn.',
        ],
        highScoreTips: [
          'Các câu điền cả câu thường cần hiểu mạch đoạn, không thể chỉ nhìn chỗ trống.',
          'Để ý đại từ this/it/they trong câu sau để biết câu cần điền nói về gì.',
          'Luyện email/memo công sở vì xuất hiện rất nhiều.',
        ],
        traps: [
          'Chọn câu nghe hay nhưng phá logic đoạn.',
          'Không đọc câu sau nên chọn sai từ nối.',
          'Nhầm thì vì chỉ nhìn một câu riêng lẻ.',
        ],
        practicePlan: [
          'Luyện theo đoạn, mỗi lần 4 câu như đề thật.',
          'Tóm tắt chức năng mỗi câu trong đoạn: mở, lý do, chi tiết, yêu cầu.',
          'Ghi lại các cụm email: in response to, please note, we regret to inform.',
        ],
      },
      {
        id: 'lr-part-7',
        section: 'Reading',
        partLabel: 'Part 7',
        title: 'Reading Comprehension',
        questions: '54 câu',
        time: 'Khoảng 53-57 phút mục tiêu',
        officialFormat:
          'Đọc single passages và multiple passages, chọn đáp án đúng. Một số câu yêu cầu chọn vị trí chèn câu.',
        goal: 'Đọc nhanh đúng thông tin, suy luận, mục đích, từ vựng theo ngữ cảnh và liên kết nhiều văn bản.',
        howToDo: [
          'Đọc câu hỏi trước để biết cần tìm thông tin nào.',
          'Scan tên người, ngày, số tiền, địa điểm, chức danh, từ khóa hiếm.',
          'Với multiple passages, xác định quan hệ giữa các văn bản: email-reply, ad-form, notice-message.',
          'Câu inference phải dựa trên bằng chứng trong bài, không suy diễn đời thực.',
        ],
        highScoreTips: [
          'Chia thời gian: single passages nhanh, giữ sức cho double/triple passages.',
          'Đọc câu đầu/cuối và tiêu đề để nắm mục đích văn bản.',
          'Với câu vocabulary in context, thay đáp án vào câu để kiểm tra nghĩa.',
        ],
        traps: [
          'True statement nhưng không trả lời câu hỏi.',
          'Đáp án dùng từ giống bài nhưng sai chi tiết.',
          'Bỏ qua email sau làm sai thông tin đã được cập nhật.',
        ],
        practicePlan: [
          'Luyện đọc 3 loại văn bản/ngày: email, notice, advertisement.',
          'Tập highlight bằng mắt keyword thay vì dịch từng câu.',
          'Sau khi làm, tìm dòng bằng chứng cho từng đáp án.',
        ],
      },
    ],
  },
  {
    id: 'speaking-writing',
    title: 'TOEIC Speaking & Writing',
    vietnameseTitle: 'Bài thi Nói và Viết',
    overview:
      'Bài TOEIC Speaking & Writing đo khả năng dùng tiếng Anh nói và viết trong tình huống công việc thực tế. Theo ETS, Speaking có 11 câu khoảng 20 phút, Writing có 8 câu khoảng 60 phút.',
    total: 'Speaking 11 câu • Writing 8 câu',
    scoreScale: '0-200 mỗi kỹ năng',
    sourceNote: 'Dựa trên cấu trúc chính thức ETS TOEIC Speaking & Writing.',
    parts: [
      {
        id: 'sw-speaking-1',
        section: 'Speaking',
        partLabel: 'Questions 1-2',
        title: 'Read a text aloud',
        questions: '2 câu',
        time: '45 giây chuẩn bị • 45 giây đọc',
        officialFormat: 'Đọc to một đoạn văn bản trên màn hình.',
        goal: 'Thể hiện phát âm, ngữ điệu, trọng âm, nối âm và độ trôi chảy.',
        howToDo: [
          'Dùng thời gian chuẩn bị để đọc lướt ý, đánh dấu chỗ ngắt câu.',
          'Đọc rõ âm cuối quan trọng: -s, -ed, -t, -d.',
          'Lên giọng nhẹ ở danh sách/chưa hết ý, xuống giọng ở cuối câu.',
          'Giữ tốc độ vừa phải; rõ ràng quan trọng hơn đọc quá nhanh.',
        ],
        highScoreTips: [
          'Chunking: chia câu dài thành cụm nghĩa ngắn.',
          'Nhấn mạnh từ nội dung: nouns, main verbs, adjectives.',
          'Không dừng quá lâu khi đọc sai; sửa nhanh hoặc đi tiếp tự nhiên.',
        ],
        traps: [
          'Đọc đều đều như robot.',
          'Nuốt âm cuối làm mất độ chính xác.',
          'Dừng ở giữa cụm danh từ/động từ làm câu khó hiểu.',
        ],
        practicePlan: [
          'Mỗi ngày đọc 5 email/announcement ngắn và ghi âm lại.',
          'So sánh bản ghi với text-to-speech để phát hiện âm cuối.',
          'Luyện nhịp 45 giây với đoạn 90-110 từ.',
        ],
      },
      {
        id: 'sw-speaking-2',
        section: 'Speaking',
        partLabel: 'Questions 3-4',
        title: 'Describe a picture',
        questions: '2 câu',
        time: '45 giây chuẩn bị • 30 giây nói',
        officialFormat: 'Mô tả bức ảnh trên màn hình càng chi tiết càng tốt.',
        goal: 'Mô tả người, vật, hành động, vị trí, bối cảnh bằng câu rõ ràng.',
        howToDo: [
          'Chuẩn bị theo khung: place -> people -> actions -> objects -> details.',
          'Bắt đầu bằng câu tổng quan: This picture shows...',
          'Dùng hiện tại tiếp diễn cho hành động: A man is checking a document.',
          'Dùng giới từ vị trí: on, next to, behind, in front of, near.',
        ],
        highScoreTips: [
          'Nói từ chắc chắn nhìn thấy, không đoán quá xa.',
          'Nếu thiếu từ, dùng mô tả đơn giản thay vì im lặng.',
          'Cố gắng nói 5-7 câu ngắn trong 30 giây.',
        ],
        traps: [
          'Dành quá lâu cho một chi tiết.',
          'Sai thì: dùng quá khứ thay vì hiện tại tiếp diễn.',
          'Nói ngoài ảnh quá nhiều.',
        ],
        practicePlan: [
          'Luyện ảnh văn phòng, nhà hàng, đường phố, cửa hàng.',
          'Tự tạo template 30 giây và dùng lại nhiều ảnh.',
          'Ghi âm và kiểm tra số câu hoàn chỉnh nói được.',
        ],
      },
      {
        id: 'sw-speaking-3',
        section: 'Speaking',
        partLabel: 'Questions 5-7',
        title: 'Respond to questions',
        questions: '3 câu',
        time: '3 giây chuẩn bị • 15/15/30 giây trả lời',
        officialFormat: 'Trả lời câu hỏi ngắn như trong phỏng vấn hoặc khảo sát.',
        goal: 'Trả lời trực tiếp, có lý do/chi tiết phù hợp, không lạc đề.',
        howToDo: [
          'Câu 5-6 trả lời thẳng trong 1-2 câu.',
          'Câu 7 dài hơn: answer -> reason -> example/detail.',
          'Lặp lại từ khóa câu hỏi để mở đầu tự nhiên.',
          'Nếu không có trải nghiệm thật, tạo câu trả lời hợp lý và nhất quán.',
        ],
        highScoreTips: [
          'Dùng linking đơn giản: because, for example, also.',
          'Không cần ý tưởng quá phức tạp; cần rõ, đúng, đủ.',
          'Kết thúc câu dứt khoát trước khi hết giờ.',
        ],
        traps: [
          'Im lặng vì cố nghĩ ý hay.',
          'Trả lời yes/no quá ngắn.',
          'Đổi chủ đề hoặc không trả lời đúng câu hỏi.',
        ],
        practicePlan: [
          'Luyện 20 câu hỏi workplace/lifestyle mỗi ngày.',
          'Bấm giờ 15 giây và 30 giây riêng.',
          'Tạo ngân hàng lý do: convenient, efficient, affordable, useful, comfortable.',
        ],
      },
      {
        id: 'sw-speaking-4',
        section: 'Speaking',
        partLabel: 'Questions 8-10',
        title: 'Respond using information provided',
        questions: '3 câu',
        time: '45 giây đọc thông tin • 15/15/30 giây trả lời',
        officialFormat:
          'Đọc bảng/lịch/thông tin cho trước rồi trả lời câu hỏi dựa trên thông tin đó.',
        goal: 'Tìm thông tin nhanh và trả lời như nhân viên hỗ trợ khách hàng.',
        howToDo: [
          'Trong 45 giây, đọc tiêu đề, ngày, giờ, địa điểm, tên người và ghi nhớ cấu trúc bảng.',
          'Nghe câu hỏi để xác định ô thông tin cần lấy.',
          'Trả lời đầy đủ chủ ngữ + thông tin, không chỉ đọc một cụm rời.',
          'Nếu câu hỏi yêu cầu xác nhận thông tin sai, hãy sửa lại lịch sự.',
        ],
        highScoreTips: [
          'Dùng mẫu: According to the schedule..., It will be held at..., The session begins at...',
          'Với câu 10, thường cần tổng hợp nhiều thông tin hơn.',
          'Tập đọc bảng theo cột: time, event, speaker, location.',
        ],
        traps: [
          'Nhìn nhầm hàng/cột.',
          'Trả lời thiếu ngày hoặc địa điểm.',
          'Không sửa thông tin sai trong câu hỏi.',
        ],
        practicePlan: [
          'Luyện schedule, conference program, train timetable, price list.',
          'Tập trả lời bằng câu đầy đủ trong 15 giây.',
          'Tự đặt 3 câu hỏi cho mỗi bảng và trả lời.',
        ],
      },
      {
        id: 'sw-speaking-5',
        section: 'Speaking',
        partLabel: 'Question 11',
        title: 'Express an opinion',
        questions: '1 câu',
        time: '45 giây chuẩn bị • 60 giây nói',
        officialFormat: 'Nêu, giải thích và bảo vệ ý kiến về một vấn đề.',
        goal: 'Trình bày quan điểm rõ, có 2 lý do hoặc 1 lý do + ví dụ mạnh.',
        howToDo: [
          'Chuẩn bị khung: opinion -> reason 1 -> reason 2/example -> closing.',
          'Chọn một phía rõ ràng, không đứng giữa quá lâu.',
          'Dùng câu đơn giản nhưng liên kết tốt.',
          'Kết thúc bằng câu tóm lại quan điểm.',
        ],
        highScoreTips: [
          'Template: I believe... The first reason is... Another reason is... For these reasons...',
          'Ưu tiên nói mạch lạc hơn dùng từ quá khó.',
          'Nếu còn thời gian, thêm ví dụ công việc cụ thể.',
        ],
        traps: [
          'Mở bài quá dài làm thiếu thời gian cho lý do.',
          'Nêu 3 ý nhưng không phát triển ý nào.',
          'Không trả lời trực tiếp câu hỏi.',
        ],
        practicePlan: [
          'Luyện 1 phút nói mỗi ngày với 5 chủ đề workplace/study/lifestyle.',
          'Ghi âm và kiểm tra có đủ opinion + reasons + example chưa.',
          'Chuẩn bị sẵn cụm mở bài/kết bài.',
        ],
      },
      {
        id: 'sw-writing-1',
        section: 'Writing',
        partLabel: 'Questions 1-5',
        title: 'Write a sentence based on a picture',
        questions: '5 câu',
        time: 'Dùng 2 từ/cụm được cho trong mỗi câu',
        officialFormat:
          'Viết một câu dựa trên ảnh, bắt buộc dùng 2 từ/cụm cho trước; có thể đổi dạng từ và thứ tự từ.',
        goal: 'Viết câu đúng ngữ pháp, liên quan ảnh và dùng đủ từ yêu cầu.',
        howToDo: [
          'Nhìn ảnh xác định chủ thể + hành động + nơi chốn.',
          'Dùng cả 2 từ/cụm bắt buộc, có thể đổi dạng cho đúng ngữ pháp.',
          'Viết một câu hoàn chỉnh có chủ ngữ và động từ.',
          'Ưu tiên câu rõ và đúng hơn câu dài phức tạp.',
        ],
        highScoreTips: [
          'Dùng hiện tại tiếp diễn cho ảnh có người đang làm gì.',
          'Thêm giới từ vị trí để câu giàu thông tin.',
          'Kiểm tra số ít/số nhiều và mạo từ trước khi gửi.',
        ],
        traps: [
          'Quên dùng một trong hai từ bắt buộc.',
          'Câu không liên quan ảnh.',
          'Câu thiếu động từ chính.',
        ],
        practicePlan: [
          'Mỗi ngày viết 10 câu ảnh với 2 từ bắt buộc.',
          'Tự kiểm tra: dùng đủ từ, đúng ảnh, đúng ngữ pháp.',
          'Tạo bộ câu mẫu cho văn phòng, nhà hàng, giao thông.',
        ],
      },
      {
        id: 'sw-writing-2',
        section: 'Writing',
        partLabel: 'Questions 6-7',
        title: 'Respond to a written request',
        questions: '2 câu',
        time: '10 phút mỗi email',
        officialFormat: 'Viết phản hồi email/yêu cầu bằng văn phong phù hợp.',
        goal: 'Trả lời đủ yêu cầu, giọng văn lịch sự, cấu trúc email rõ.',
        howToDo: [
          'Đọc yêu cầu và gạch số việc cần trả lời.',
          'Mở email bằng lời chào/ngữ cảnh ngắn.',
          'Trả lời từng yêu cầu bằng đoạn ngắn rõ ràng.',
          'Kết thúc bằng câu hỗ trợ hoặc cảm ơn.',
        ],
        highScoreTips: [
          'Template: Thank you for your email. Regarding..., I would like to... Please let me know if...',
          'Nếu yêu cầu hỏi 2 việc, trả lời đủ cả 2.',
          'Dùng câu lịch sự: Could you, would be possible, I would appreciate.',
        ],
        traps: [
          'Trả lời thiếu một yêu cầu trong đề.',
          'Văn phong quá thân mật.',
          'Lỗi thì và đại từ làm email thiếu chuyên nghiệp.',
        ],
        practicePlan: [
          'Luyện 1 email complaint, 1 email request, 1 email schedule mỗi ngày.',
          'Bấm giờ 10 phút và kiểm tra số yêu cầu đã trả lời.',
          'Tạo ngân hàng câu mở/kết email.',
        ],
      },
      {
        id: 'sw-writing-3',
        section: 'Writing',
        partLabel: 'Question 8',
        title: 'Write an opinion essay',
        questions: '1 câu',
        time: 'Khoảng 30 phút',
        officialFormat:
          'Viết bài luận nêu, giải thích và hỗ trợ quan điểm; ETS nêu bài hiệu quả thường tối thiểu khoảng 300 từ.',
        goal: 'Viết bài có thesis rõ, lý do phát triển đủ, ví dụ cụ thể và kết luận.',
        howToDo: [
          'Dành 3-5 phút lập dàn ý trước khi viết.',
          'Mở bài trả lời trực tiếp câu hỏi và nêu thesis.',
          'Viết 2 thân bài, mỗi thân bài có topic sentence, explanation, example.',
          'Kết luận tóm tắt quan điểm, không thêm ý mới.',
        ],
        highScoreTips: [
          'Dùng cấu trúc 4 đoạn: introduction, body 1, body 2, conclusion.',
          'Tập dùng từ nối: first, moreover, as a result, for example, in conclusion.',
          'Ưu tiên ví dụ thực tế công việc/học tập để tăng tính thuyết phục.',
        ],
        traps: [
          'Liệt kê ý nhưng không giải thích.',
          'Lạc đề hoặc không chọn quan điểm rõ.',
          'Bài quá ngắn, thiếu ví dụ, thiếu kết luận.',
        ],
        practicePlan: [
          'Viết 2 bài/tuần, mỗi bài 280-350 từ.',
          'Sau khi viết, tự check thesis, topic sentences, examples, grammar.',
          'Tạo bank ý tưởng cho chủ đề work, technology, education, communication.',
        ],
      },
    ],
  },
];

export const toeicGuideSources = [
  {
    label: 'ETS TOEIC Speaking & Writing format',
    url: 'https://www.ets.org/toeic/about/speaking-writing.html',
  },
  {
    label: 'IIBC TOEIC Listening & Reading format',
    url: 'https://www.iibc-global.org/english/toeic/test/lr/about/format.html',
  },
  {
    label: 'ETS TOEIC Listening & Reading overview',
    url: 'https://www.es.ets.org/toeic/about/listening-reading.html',
  },
];

export function getToeicGuideTest(id: ToeicGuideTest['id']) {
  return toeicGuideTests.find((test) => test.id === id) ?? toeicGuideTests[0];
}
