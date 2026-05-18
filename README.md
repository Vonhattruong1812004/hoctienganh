# EnglishPro

EnglishPro là hệ thống học tiếng Anh full-stack theo hướng sản phẩm thực tế. Dự án có nhiều actor, dashboard riêng theo vai trò, học từ vựng theo chủ đề, học ngữ pháp TOEIC, giới thiệu cấu trúc bài thi TOEIC, thi thử ETS, game hóa với pet và AI Vision Lab.

## Điểm Nổi Bật

- Actor rõ ràng: học viên, phụ huynh, giáo viên, quản trị viên.
- Dashboard chỉ đóng vai trò trung tâm chức năng; từng UC có trang riêng.
- Học viên học theo chủ đề: từ vựng, ngữ cảnh, phát âm, hình ảnh và game ôn ngay trong luồng học.
- Kho ngữ pháp TOEIC theo topic, có màn học và luyện tập.
- UC giới thiệu TOEIC Listening & Reading, Speaking & Writing, các Part và mẹo làm bài.
- UC thi thử TOEIC ETS: chọn đề, chọn Part, đếm giờ, làm bài, nộp bài và xem kết quả.
- Listening Part 1, 2, 3, 4 đã được tách khỏi PDF để làm trực tiếp trong giao diện.
- Zoo theme với pet, hiệu ứng ambient, audio tương tác và giao diện sinh động.
- Backend NestJS cung cấp auth, bài học, quiz, tiến trình, game hóa, phụ huynh, vision và tích hợp nguồn ngoài.

## Công Nghệ

- Frontend: Next.js 15, React 19, TypeScript, CSS thuần.
- Backend: NestJS 11, TypeScript.
- Database: PostgreSQL, Prisma.
- Local services: Docker Compose, Redis.
- AI/vision: TensorFlow MobileNet trên web, OpenAI Vision khi cấu hình key.
- Nguồn nội dung: Datamuse, Free Dictionary, LanguageTool, Tatoeba, Openverse, Wikipedia/Wikimedia và các API có key.
- TOEIC assets: PDF/audio ETS local, script Swift/PDFKit để cắt đề thành ảnh dùng trong UI.

## Cấu Trúc Dự Án

```text
apps/web                 Frontend Next.js
apps/api                 Backend NestJS
packages/database        Prisma schema và database helpers
packages/shared          Kiểu dữ liệu và hằng số dùng chung
docs                     Tài liệu phân tích/nghiệp vụ
scripts                  Script xử lý PDF ETS thành asset giao diện
ETS                      Thư mục đề/audio/key local, không nên commit lên Git
apps/web/public/ets      Asset ảnh đã cắt để web hiển thị từng câu/cụm câu
```

## Các Trang Chính

```text
/login                   Đăng nhập
/dashboard               Dashboard theo actor
/lessons                 Học từ vựng theo chủ đề
/lessons/[id]/learn      Màn học từ vựng/ngữ cảnh
/lessons/[id]/game       Game ôn theo chủ đề
/grammar                 Học ngữ pháp TOEIC
/grammar/[id]            Chi tiết topic ngữ pháp
/toeic-guide             Giới thiệu bài thi TOEIC và tips từng Part
/ets-practice            Chọn đề ETS, loại bài thi và Part
/ets-practice/take       Phòng thi thử
/ets-practice/result     Kết quả, đúng/sai, phân tích và lời giải
/playground              Sân chơi học tập, pet, mini game, AI Vision
/progress                Tiến trình học viên
/admin                   Dashboard quản trị viên
/parent/support          Phụ huynh theo dõi hỗ trợ
/students                Giáo viên theo dõi học viên
```

## Thi Thử TOEIC ETS

Luồng thi thử hiện tại:

1. Vào `/ets-practice`.
2. Chọn TOEIC Listening & Reading.
3. Chọn đề ETS 2026 Test 1-10.
4. Tick Part muốn làm.
5. Bấm làm bài để vào `/ets-practice/take`.
6. Đồng hồ tự chạy ngay khi vào phòng thi.
7. Chọn đáp án, nộp bài hoặc tự nộp khi hết giờ.
8. Xem kết quả ở `/ets-practice/result`.

Trạng thái tách đề:

- Part 1: tách thành 6 ảnh/câu cho mỗi đề.
- Part 2: hiển thị từng câu nghe, audio riêng, chọn A/B/C tại chỗ.
- Part 3: tách thành 13 cụm hội thoại, mỗi cụm 3 câu.
- Part 4: tách thành 10 cụm bài nói, mỗi cụm 3 câu.
- Part 5-7: đang mở rộng theo hướng tách đề đọc thành cụm/câu, hiện có script hỗ trợ xử lý PDF.

## ETS Assets Local

Thư mục `ETS/` chứa PDF/audio/key dung lượng lớn, nên để local tại root project:

```text
ETS/
  ETS 2026- LC.pdf
  ETS 2026- RC.pdf
  TRANSCRIPT.pdf
  AUDIO/
  KEY READING/
  KEY VÀ GIẢI THÍCH CHI TIẾT/
```

Không nên commit `ETS/` lên GitHub vì dung lượng lớn và có thể vượt giới hạn file. Web đọc các file này qua route `/api/ets-assets/...` khi chạy local.

Các asset ảnh đã cắt phục vụ UI nằm trong `apps/web/public/ets`.

## Yêu Cầu

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Redis 7 nếu chạy đầy đủ backend
- Docker Desktop nếu dùng Docker Compose
- macOS có Swift/PDFKit nếu cần chạy script cắt PDF ETS

## Cài Đặt

```bash
npm install
cp .env.example .env
npm run db:generate
```

## Chạy Local

Chạy cả web và API:

```bash
npm run dev
```

Chạy riêng web:

```bash
npm run dev:web
```

Chạy riêng API:

```bash
npm run dev:api
```

Mặc định:

```text
Web: http://localhost:4000
API: http://localhost:4100/api
```

Nếu gặp `EADDRINUSE`, nghĩa là port đã có tiến trình đang chạy. Kiểm tra và dừng tiến trình cũ:

```bash
lsof -Pan -iTCP:4000 -sTCP:LISTEN
lsof -Pan -iTCP:4100 -sTCP:LISTEN
```

## Chạy Bằng Docker

```bash
npm run docker:up
```

Dừng Docker:

```bash
npm run docker:down
```

## Database

Sinh Prisma client:

```bash
npm run db:generate
```

Nạp dữ liệu mẫu:

```bash
npm run db:seed:sql
```

Hoặc import thủ công:

```bash
psql "$DATABASE_URL" -f thiet_ke_csdl_hoc_tieng_anh.sql
```

Một số file dữ liệu mở rộng:

```text
du_lieu_mo_rong_hoc_tieng_anh.sql
cap_nhat_quiz_tieng_viet_co_dau.sql
cap_nhat_anh_minh_hoa_daily_routine.sql
```

## Biến Môi Trường

Các nguồn không cần key vẫn có thể chạy ở chế độ cơ bản. Muốn mở thêm ảnh, audio, AI Vision và từ điển nâng cao thì cấu hình:

```bash
DATABASE_URL=
JWT_SECRET=
API_PORT=4100
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4100/api
MERRIAM_WEBSTER_LEARNERS_KEY=
PIXABAY_API_KEY=
PEXELS_API_KEY=
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-4.1-mini
```

## Tài Khoản Mẫu

```text
admin@englishpro.local      / 123456
giaovien@englishpro.local   / 123456
phuhuynh@englishpro.local   / 123456
hocvien1@englishpro.local   / 123456
hocvien2@englishpro.local   / 123456
```

## Scripts Hữu Ích

```bash
npm run dev
npm run dev:web
npm run dev:api
npm run build
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:studio
npm run docker:up
npm run docker:down
```

Script xử lý PDF ETS:

```bash
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part1-assets.swift
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part3-assets.swift
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part4-assets.swift
```

## Kiểm Tra Trước Khi Commit

```bash
npm run build -w apps/web
npm run build -w apps/api
```

## Ghi Chú Phát Triển

- Không đưa `.env`, `.env.local`, `node_modules`, `.next`, database volume và thư mục `ETS/` lên Git.
- Các UC đang được tách theo đúng workflow: dashboard chỉ là cổng vào, mỗi chức năng có màn riêng.
- TOEIC mock test đang ưu tiên trải nghiệm giống phòng thi thật: chọn Part, tự chạy giờ, làm bài trực tiếp, xem kết quả ở trang riêng.
