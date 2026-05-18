-- Du lieu mo rong cho he thong EnglishPro Zoo Learning
-- Co the import truc tiep vao PostgreSQL, chay nhieu lan khong bi trung khoa.

BEGIN;

INSERT INTO giaidoanhoc (
  "maGiaiDoan", "maLoTrinh", "tenGiaiDoan", "loaiGiaiDoan", "thuTu", "moTa"
)
VALUES
  ('11000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Ngày 7 - Animals and pets', 'Ngay', 7, 'Học tên động vật quen thuộc, thú cưng và cách nói mình có con vật nào.'),
  ('11000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Ngày 8 - Colors and shapes', 'Ngay', 8, 'Học màu sắc, hình dạng và cách mô tả đồ vật xung quanh.'),
  ('11000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Ngày 9 - Weather and seasons', 'Ngay', 9, 'Học thời tiết, cảm giác nóng lạnh và mẫu câu mô tả hôm nay.')
ON CONFLICT ("maGiaiDoan") DO UPDATE SET
  "tenGiaiDoan" = EXCLUDED."tenGiaiDoan",
  "loaiGiaiDoan" = EXCLUDED."loaiGiaiDoan",
  "thuTu" = EXCLUDED."thuTu",
  "moTa" = EXCLUDED."moTa";

INSERT INTO chudehoc (
  "maChuDe", "tenChuDe", "moTa", "capDo", "kyNang", "trangThai"
)
VALUES
  ('12000000-0000-0000-0000-000000000007', 'Động vật và thú cưng', 'Từ vựng về chó, mèo, thỏ, rùa, cá, chim và cách nói về thú cưng.', 'A1', 'TuVung', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000008', 'Màu sắc và hình dạng', 'Từ vựng màu sắc, hình dạng cơ bản và mẫu câu mô tả đồ vật.', 'A1', 'TuVung', 'HoatDong'),
  ('12000000-0000-0000-0000-000000000009', 'Thời tiết hằng ngày', 'Từ vựng thời tiết và mẫu câu It is sunny/rainy/cloudy.', 'A1', 'Nghe', 'HoatDong')
ON CONFLICT ("maChuDe") DO UPDATE SET
  "tenChuDe" = EXCLUDED."tenChuDe",
  "moTa" = EXCLUDED."moTa",
  "capDo" = EXCLUDED."capDo",
  "kyNang" = EXCLUDED."kyNang",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO baihoc (
  "maBaiHoc", "maGiaiDoan", "maChuDe", "tieuDe", "moTa", "noiDung",
  "capDo", "thuTu", "diemDatYeuCau", "trangThai", "maNguoiTao"
)
VALUES
  (
    '13000000-0000-0000-0000-000000000007',
    '11000000-0000-0000-0000-000000000007',
    '12000000-0000-0000-0000-000000000007',
    'Bài 7: My cute pets',
    'Học tên động vật, thú cưng và cách nói I have a pet.',
    'Bài học đưa người học vào khu vườn EnglishPro Zoo để học dog, cat, rabbit, turtle, fish, bird và penguin. Người học luyện mẫu câu I have a..., It is cute, The dog is fast và nghe phát âm từng con vật.',
    'A1',
    7,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000008',
    '11000000-0000-0000-0000-000000000008',
    '12000000-0000-0000-0000-000000000008',
    'Bài 8: Colors around me',
    'Học màu sắc, hình dạng và mô tả đồ vật đơn giản.',
    'Người học quan sát đồ vật trong lớp, công viên và khu zoo để học red, blue, yellow, green, circle, square, triangle. Trọng tâm là mẫu câu It is + color và It is a + shape.',
    'A1',
    8,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000009',
    '11000000-0000-0000-0000-000000000009',
    '12000000-0000-0000-0000-000000000009',
    'Bài 9: It is sunny today',
    'Học thời tiết và cách nói cảm giác trong ngày.',
    'Bài học giúp người học nói It is sunny, It is rainy, It is cloudy, It is windy, It is hot, It is cold. Nội dung có ảnh minh họa, audio mẫu và nhiệm vụ chọn thời tiết phù hợp.',
    'A1',
    9,
    80,
    'CongBo',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT ("maBaiHoc") DO UPDATE SET
  "maGiaiDoan" = EXCLUDED."maGiaiDoan",
  "maChuDe" = EXCLUDED."maChuDe",
  "tieuDe" = EXCLUDED."tieuDe",
  "moTa" = EXCLUDED."moTa",
  "noiDung" = EXCLUDED."noiDung",
  "capDo" = EXCLUDED."capDo",
  "thuTu" = EXCLUDED."thuTu",
  "diemDatYeuCau" = EXCLUDED."diemDatYeuCau",
  "trangThai" = EXCLUDED."trangThai",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

INSERT INTO nhiemvuhoctap (
  "maNhiemVu", "maBaiHoc", "tieuDe", "huongDan", "loaiNhiemVu", "batBuoc", "thuTu", "trangThai"
)
VALUES
  ('14000000-0000-0000-0000-000000000013', '13000000-0000-0000-0000-000000000007', 'Nghe và lặp lại 8 con vật', 'Bấm phát âm từng từ, lặp lại ít nhất 2 lần và chú ý âm cuối.', 'Nghe', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000014', '13000000-0000-0000-0000-000000000007', 'Nói về thú cưng của em', 'Dùng mẫu I have a... hoặc I like... để nói 3 câu về thú cưng.', 'LuyenTap', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000015', '13000000-0000-0000-0000-000000000008', 'Ghép màu với đồ vật', 'Quan sát hình và đọc to red apple, blue book, yellow sun, green tree.', 'TuVung', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000016', '13000000-0000-0000-0000-000000000008', 'Mô tả hình dạng', 'Đặt 4 câu với circle, square, triangle, rectangle.', 'NguPhap', TRUE, 2, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000017', '13000000-0000-0000-0000-000000000009', 'Nghe bản tin thời tiết', 'Nghe đoạn mô tả thời tiết và chọn tranh phù hợp.', 'Nghe', TRUE, 1, 'HoatDong'),
  ('14000000-0000-0000-0000-000000000018', '13000000-0000-0000-0000-000000000009', 'Nói thời tiết hôm nay', 'Viết và đọc 3 câu về thời tiết hôm nay bằng It is...', 'LuyenTap', TRUE, 2, 'HoatDong')
ON CONFLICT ("maNhiemVu") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "huongDan" = EXCLUDED."huongDan",
  "loaiNhiemVu" = EXCLUDED."loaiNhiemVu",
  "batBuoc" = EXCLUDED."batBuoc",
  "thuTu" = EXCLUDED."thuTu",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO tuvung (
  "maTuVung", "maBaiHoc", tu, nghia, "phienAm", "loaiTu", "viDu", "nghiaViDu", "audioPhatAm", "hinhAnh"
)
VALUES
  ('15000000-0000-0000-0000-000000000013', '13000000-0000-0000-0000-000000000001', 'hi', 'xin chào', '/haɪ/', 'interjection', 'Hi, I am Khang.', 'Xin chào, mình là Khang.', '/media/audio/hi.mp3', '/media/images/hi.png'),
  ('15000000-0000-0000-0000-000000000014', '13000000-0000-0000-0000-000000000001', 'good morning', 'chào buổi sáng', '/ɡʊd ˈmɔːrnɪŋ/', 'phrase', 'Good morning, teacher.', 'Chào buổi sáng, cô giáo.', '/media/audio/good-morning.mp3', '/media/images/good-morning.png'),
  ('15000000-0000-0000-0000-000000000015', '13000000-0000-0000-0000-000000000001', 'goodbye', 'tạm biệt', '/ˌɡʊdˈbaɪ/', 'interjection', 'Goodbye, see you tomorrow.', 'Tạm biệt, hẹn gặp lại ngày mai.', '/media/audio/goodbye.mp3', '/media/images/goodbye.png'),
  ('15000000-0000-0000-0000-000000000016', '13000000-0000-0000-0000-000000000002', 'pencil', 'bút chì', '/ˈpensəl/', 'noun', 'This is my pencil.', 'Đây là bút chì của tôi.', '/media/audio/pencil.mp3', '/media/images/pencil.png'),
  ('15000000-0000-0000-0000-000000000017', '13000000-0000-0000-0000-000000000002', 'desk', 'bàn học', '/desk/', 'noun', 'The book is on the desk.', 'Quyển sách ở trên bàn học.', '/media/audio/desk.mp3', '/media/images/desk.png'),
  ('15000000-0000-0000-0000-000000000018', '13000000-0000-0000-0000-000000000002', 'board', 'bảng', '/bɔːrd/', 'noun', 'The board is white.', 'Cái bảng màu trắng.', '/media/audio/board.mp3', '/media/images/board.png'),
  ('15000000-0000-0000-0000-000000000019', '13000000-0000-0000-0000-000000000003', 'brother', 'anh/em trai', '/ˈbrʌðər/', 'noun', 'He is my brother.', 'Anh ấy là anh trai của tôi.', '/media/audio/brother.mp3', '/media/images/brother.png'),
  ('15000000-0000-0000-0000-000000000020', '13000000-0000-0000-0000-000000000003', 'sister', 'chị/em gái', '/ˈsɪstər/', 'noun', 'She is my sister.', 'Cô ấy là chị gái của tôi.', '/media/audio/sister.mp3', '/media/images/sister.png'),
  ('15000000-0000-0000-0000-000000000021', '13000000-0000-0000-0000-000000000003', 'grandmother', 'bà', '/ˈɡrænmʌðər/', 'noun', 'This is my grandmother.', 'Đây là bà của tôi.', '/media/audio/grandmother.mp3', '/media/images/grandmother.png'),
  ('15000000-0000-0000-0000-000000000022', '13000000-0000-0000-0000-000000000004', 'get up', 'thức dậy', '/ɡet ʌp/', 'verb phrase', 'I get up at six.', 'Tôi thức dậy lúc sáu giờ.', '/media/audio/get-up.mp3', '/media/images/get-up.png'),
  ('15000000-0000-0000-0000-000000000023', '13000000-0000-0000-0000-000000000004', 'brush', 'chải', '/brʌʃ/', 'verb', 'I brush my teeth.', 'Tôi chải răng.', '/media/audio/brush.mp3', '/media/images/brush.png'),
  ('15000000-0000-0000-0000-000000000024', '13000000-0000-0000-0000-000000000004', 'go to school', 'đi học', '/ɡoʊ tə skuːl/', 'verb phrase', 'I go to school at seven.', 'Tôi đi học lúc bảy giờ.', '/media/audio/go-to-school.mp3', '/media/images/go-to-school.png'),
  ('15000000-0000-0000-0000-000000000025', '13000000-0000-0000-0000-000000000005', 'rice', 'cơm/gạo', '/raɪs/', 'noun', 'I like rice.', 'Tôi thích cơm.', '/media/audio/rice.mp3', '/media/images/rice.png'),
  ('15000000-0000-0000-0000-000000000026', '13000000-0000-0000-0000-000000000005', 'bread', 'bánh mì', '/bred/', 'noun', 'This is bread.', 'Đây là bánh mì.', '/media/audio/bread.mp3', '/media/images/bread.png'),
  ('15000000-0000-0000-0000-000000000027', '13000000-0000-0000-0000-000000000005', 'juice', 'nước ép', '/dʒuːs/', 'noun', 'I drink orange juice.', 'Tôi uống nước ép cam.', '/media/audio/juice.mp3', '/media/images/juice.png'),
  ('15000000-0000-0000-0000-000000000028', '13000000-0000-0000-0000-000000000007', 'dog', 'con chó', '/dɔːɡ/', 'noun', 'The dog is fast.', 'Con chó chạy nhanh.', '/media/audio/dog.mp3', '/media/images/dog.png'),
  ('15000000-0000-0000-0000-000000000029', '13000000-0000-0000-0000-000000000007', 'cat', 'con mèo', '/kæt/', 'noun', 'The cat is cute.', 'Con mèo dễ thương.', '/media/audio/cat.mp3', '/media/images/cat.png'),
  ('15000000-0000-0000-0000-000000000030', '13000000-0000-0000-0000-000000000007', 'rabbit', 'con thỏ', '/ˈræbɪt/', 'noun', 'I like the rabbit.', 'Tôi thích con thỏ.', '/media/audio/rabbit.mp3', '/media/images/rabbit.png'),
  ('15000000-0000-0000-0000-000000000031', '13000000-0000-0000-0000-000000000007', 'turtle', 'con rùa', '/ˈtɜːrtl/', 'noun', 'The turtle is slow.', 'Con rùa đi chậm.', '/media/audio/turtle.mp3', '/media/images/turtle.png'),
  ('15000000-0000-0000-0000-000000000032', '13000000-0000-0000-0000-000000000007', 'fish', 'con cá', '/fɪʃ/', 'noun', 'The fish is blue.', 'Con cá màu xanh dương.', '/media/audio/fish.mp3', '/media/images/fish.png'),
  ('15000000-0000-0000-0000-000000000033', '13000000-0000-0000-0000-000000000007', 'penguin', 'chim cánh cụt', '/ˈpeŋɡwɪn/', 'noun', 'Pingu is a penguin.', 'Pingu là một chú chim cánh cụt.', '/media/audio/penguin.mp3', '/media/images/penguin.png'),
  ('15000000-0000-0000-0000-000000000034', '13000000-0000-0000-0000-000000000008', 'red', 'màu đỏ', '/red/', 'adjective', 'It is a red apple.', 'Đó là một quả táo màu đỏ.', '/media/audio/red.mp3', '/media/images/red.png'),
  ('15000000-0000-0000-0000-000000000035', '13000000-0000-0000-0000-000000000008', 'blue', 'màu xanh dương', '/bluː/', 'adjective', 'This is a blue book.', 'Đây là một quyển sách màu xanh dương.', '/media/audio/blue.mp3', '/media/images/blue.png'),
  ('15000000-0000-0000-0000-000000000036', '13000000-0000-0000-0000-000000000008', 'yellow', 'màu vàng', '/ˈjeloʊ/', 'adjective', 'The sun is yellow.', 'Mặt trời màu vàng.', '/media/audio/yellow.mp3', '/media/images/yellow.png'),
  ('15000000-0000-0000-0000-000000000037', '13000000-0000-0000-0000-000000000008', 'circle', 'hình tròn', '/ˈsɜːrkl/', 'noun', 'It is a circle.', 'Nó là một hình tròn.', '/media/audio/circle.mp3', '/media/images/circle.png'),
  ('15000000-0000-0000-0000-000000000038', '13000000-0000-0000-0000-000000000008', 'square', 'hình vuông', '/skwer/', 'noun', 'It is a square.', 'Nó là một hình vuông.', '/media/audio/square.mp3', '/media/images/square.png'),
  ('15000000-0000-0000-0000-000000000039', '13000000-0000-0000-0000-000000000009', 'sunny', 'có nắng', '/ˈsʌni/', 'adjective', 'It is sunny today.', 'Hôm nay trời có nắng.', '/media/audio/sunny.mp3', '/media/images/sunny.png'),
  ('15000000-0000-0000-0000-000000000040', '13000000-0000-0000-0000-000000000009', 'rainy', 'có mưa', '/ˈreɪni/', 'adjective', 'It is rainy.', 'Trời đang mưa.', '/media/audio/rainy.mp3', '/media/images/rainy.png'),
  ('15000000-0000-0000-0000-000000000041', '13000000-0000-0000-0000-000000000009', 'cloudy', 'nhiều mây', '/ˈklaʊdi/', 'adjective', 'It is cloudy.', 'Trời nhiều mây.', '/media/audio/cloudy.mp3', '/media/images/cloudy.png'),
  ('15000000-0000-0000-0000-000000000042', '13000000-0000-0000-0000-000000000009', 'windy', 'có gió', '/ˈwɪndi/', 'adjective', 'It is windy.', 'Trời có gió.', '/media/audio/windy.mp3', '/media/images/windy.png')
ON CONFLICT ("maTuVung") DO UPDATE SET
  tu = EXCLUDED.tu,
  nghia = EXCLUDED.nghia,
  "phienAm" = EXCLUDED."phienAm",
  "loaiTu" = EXCLUDED."loaiTu",
  "viDu" = EXCLUDED."viDu",
  "nghiaViDu" = EXCLUDED."nghiaViDu",
  "audioPhatAm" = EXCLUDED."audioPhatAm",
  "hinhAnh" = EXCLUDED."hinhAnh";

INSERT INTO nguphap (
  "maNguPhap", "maBaiHoc", "tieuDe", "cauTruc", "giaiThich", "viDu", "ghiChu"
)
VALUES
  ('16000000-0000-0000-0000-000000000006', '13000000-0000-0000-0000-000000000007', 'Nói mình có thú cưng', 'I have a/an + con vật.', 'Dùng have để nói mình có một con vật hoặc thú cưng.', 'I have a rabbit. I have a penguin.', 'Dùng an trước từ bắt đầu bằng nguyên âm.'),
  ('16000000-0000-0000-0000-000000000007', '13000000-0000-0000-0000-000000000008', 'Tính từ màu sắc đứng trước danh từ', 'It is a/an + color + noun.', 'Màu sắc thường đứng trước danh từ khi mô tả đồ vật.', 'It is a blue book. It is a red apple.', 'Không thêm s cho tính từ màu sắc.'),
  ('16000000-0000-0000-0000-000000000008', '13000000-0000-0000-0000-000000000009', 'Mô tả thời tiết với It is', 'It is + tính từ thời tiết.', 'Dùng It is để nói về thời tiết hiện tại.', 'It is sunny today. It is windy.', 'Có thể viết It is thành It''s trong hội thoại.')
ON CONFLICT ("maNguPhap") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "cauTruc" = EXCLUDED."cauTruc",
  "giaiThich" = EXCLUDED."giaiThich",
  "viDu" = EXCLUDED."viDu",
  "ghiChu" = EXCLUDED."ghiChu";

INSERT INTO tainguyenhoctap (
  "maTaiNguyen", "maBaiHoc", "maNhiemVu", "tenTaiNguyen", "loaiTaiNguyen",
  "duongDan", "moTa", "dungLuong", "maNguoiTaiLen"
)
VALUES
  ('17000000-0000-0000-0000-000000000009', '13000000-0000-0000-0000-000000000007', '14000000-0000-0000-0000-000000000013', 'Bộ tranh EnglishPro Zoo pets', 'HinhAnh', '/media/images/pets-zoo.png', 'Tranh minh họa chó, mèo, thỏ, rùa, cá và chim cánh cụt trong khu zoo.', 720000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000010', '13000000-0000-0000-0000-000000000007', '14000000-0000-0000-0000-000000000013', 'Audio animals and pets', 'Audio', '/media/audio/animals-and-pets.mp3', 'Audio đọc chậm từng từ động vật kèm ví dụ ngắn.', 2300000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000011', '13000000-0000-0000-0000-000000000008', '14000000-0000-0000-0000-000000000015', 'Bảng màu và hình dạng', 'HinhAnh', '/media/images/colors-shapes.png', 'Ảnh minh họa màu sắc và hình dạng cơ bản để luyện nói.', 680000, '00000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000012', '13000000-0000-0000-0000-000000000009', '14000000-0000-0000-0000-000000000017', 'Weather flashcards', 'HinhAnh', '/media/images/weather-flashcards.png', 'Bộ flashcard sunny, rainy, cloudy, windy, hot và cold.', 690000, '00000000-0000-0000-0000-000000000002')
ON CONFLICT ("maTaiNguyen") DO UPDATE SET
  "tenTaiNguyen" = EXCLUDED."tenTaiNguyen",
  "loaiTaiNguyen" = EXCLUDED."loaiTaiNguyen",
  "duongDan" = EXCLUDED."duongDan",
  "moTa" = EXCLUDED."moTa",
  "dungLuong" = EXCLUDED."dungLuong";

INSERT INTO baikiemtra (
  "maBaiKiemTra", "maBaiHoc", "tieuDe", "moTa", "loaiBaiKiemTra",
  "thoiGianLamBai", "diemDatYeuCau", "soLanLamToiDa", "trangThai"
)
VALUES
  ('18000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000007', 'Kiểm tra Bài 7 - Animals and pets', 'Đánh giá từ vựng động vật và mẫu câu I have a pet.', 'CuoiBai', 10, 80, 3, 'CongBo'),
  ('18000000-0000-0000-0000-000000000006', '13000000-0000-0000-0000-000000000008', 'Kiểm tra Bài 8 - Colors and shapes', 'Đánh giá màu sắc, hình dạng và mô tả đồ vật.', 'CuoiBai', 10, 80, 3, 'CongBo'),
  ('18000000-0000-0000-0000-000000000007', '13000000-0000-0000-0000-000000000009', 'Kiểm tra Bài 9 - Weather', 'Đánh giá khả năng nghe và mô tả thời tiết hằng ngày.', 'CuoiBai', 10, 80, 3, 'CongBo')
ON CONFLICT ("maBaiKiemTra") DO UPDATE SET
  "tieuDe" = EXCLUDED."tieuDe",
  "moTa" = EXCLUDED."moTa",
  "loaiBaiKiemTra" = EXCLUDED."loaiBaiKiemTra",
  "thoiGianLamBai" = EXCLUDED."thoiGianLamBai",
  "diemDatYeuCau" = EXCLUDED."diemDatYeuCau",
  "soLanLamToiDa" = EXCLUDED."soLanLamToiDa",
  "trangThai" = EXCLUDED."trangThai";

INSERT INTO tientrinhhoctap (
  "maTienTrinh", "maHocVien", "maBaiHoc", "trangThai",
  "phanTramHoanThanh", "diemCaoNhat", "ngayBatDau", "ngayHoanThanh"
)
VALUES
  ('1d000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000005', 'BiKhoa', 0, 0, NULL, NULL),
  ('1d000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000006', 'BiKhoa', 0, 0, NULL, NULL),
  ('1d000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000007', 'BiKhoa', 0, 0, NULL, NULL),
  ('1d000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000008', 'BiKhoa', 0, 0, NULL, NULL),
  ('1d000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000009', 'BiKhoa', 0, 0, NULL, NULL)
ON CONFLICT ("maTienTrinh") DO UPDATE SET
  "trangThai" = EXCLUDED."trangThai",
  "phanTramHoanThanh" = EXCLUDED."phanTramHoanThanh",
  "diemCaoNhat" = EXCLUDED."diemCaoNhat",
  "ngayBatDau" = EXCLUDED."ngayBatDau",
  "ngayHoanThanh" = EXCLUDED."ngayHoanThanh",
  "ngayCapNhat" = CURRENT_TIMESTAMP;

COMMIT;
