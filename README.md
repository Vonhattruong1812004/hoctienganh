# EnglishPro - Hệ thống học tiếng Anh đa vai trò

EnglishPro là một nền tảng học tiếng Anh full-stack theo hướng sản phẩm thực tế, có dashboard riêng cho từng actor, lộ trình học, bài học, quiz, tiến trình, sân chơi game hóa và dữ liệu mẫu để triển khai, kiểm thử nhanh.

## Tổng quan

Hệ thống được thiết kế theo mô hình actor-based để tránh việc mọi người dùng bị gom vào một màn hình chung. Mỗi vai trò có luồng nghiệp vụ riêng, nhưng vẫn dùng chung các chức năng cốt lõi như đăng nhập, xem dashboard, đổi giao diện sáng/tối và đăng xuất.

Điểm nhấn của dự án:

- Dashboard theo từng vai trò, tách riêng logic và giao diện.
- Học viên có lộ trình, bài học, quiz, tiến trình và sân chơi học tập.
- Phụ huynh theo dõi tiến độ, cảnh báo ôn tập và thông báo học tập.
- Giáo viên quản lý nội dung học, theo dõi lớp và học viên cần hỗ trợ.
- Quản trị viên giám sát toàn hệ thống, tài khoản và trạng thái công bố.
- Game hóa trải nghiệm học với pet Pingu, nhiệm vụ ngày, XP, coins và mini game.
- Có hướng mở rộng cho AI nhận diện hình ảnh, gợi ý từ vựng và luyện phát âm.

## Tính năng chính

- Xác thực người dùng và phân quyền theo vai trò.
- Dashboard động theo actor.
- Quản lý lộ trình học, giai đoạn, bài học và quiz.
- Theo dõi tiến trình học và trạng thái mở khóa bài.
- Sân chơi học tập: mini game, pet, nhiệm vụ ngày.
- Gợi ý ôn tập cho phụ huynh.
- Theo dõi lớp học và học viên cần hỗ trợ cho giáo viên.
- Giám sát nội dung và người dùng cho quản trị viên.
- Giao diện sáng/tối.
- Dữ liệu demo sẵn để mở lên là có thể kiểm thử ngay.

## Actor

- Học viên
- Phụ huynh
- Giáo viên
- Quản trị viên

## Công nghệ

- Frontend: Next.js 15, React, TypeScript
- Backend: NestJS, TypeScript
- Cơ sở dữ liệu: PostgreSQL
- ORM: Prisma
- Cache/queue-ready: Redis
- Triển khai local: Docker Compose

## Kiến trúc dự án

```text
apps/web                 Frontend Next.js
apps/api                 Backend NestJS
packages/database        Prisma schema và script CSDL
packages/shared          Hằng số, kiểu dữ liệu và schema dùng chung
docs                     Tài liệu phân tích, sơ đồ, mô tả nghiệp vụ
thiet_ke_csdl_hoc_tieng_anh.sql   File PostgreSQL có schema + dữ liệu mẫu
```

## Màn hình chính

- `/login`
- `/dashboard`
- `/learning-paths`
- `/lessons`
- `/quizzes`
- `/progress`
- `/playground`
- `/students`
- `/admin`

## Yêu cầu hệ thống

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Redis 7+ nếu chạy đầy đủ backend
- Docker Desktop nếu muốn dựng toàn bộ bằng Docker

## Cài đặt và chạy local

### 1. Cài dependency

```bash
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

### 3. Sinh Prisma client

```bash
npm run db:generate
```

### 4. Chạy toàn hệ thống ở chế độ dev

```bash
npm run dev
```

Web: `http://localhost:3000`  
API: `http://localhost:4000/api`

### 5. Chạy bằng Docker

```bash
npm run docker:up
```

Lưu ý: cần bật Docker Desktop trước khi chạy.

## Nạp dữ liệu PostgreSQL

File SQL đã được chuẩn bị sẵn để import trực tiếp:

```bash
npm run db:seed:sql
```

Hoặc import thủ công:

```bash
psql "$DATABASE_URL" -f thiet_ke_csdl_hoc_tieng_anh.sql
```

## Tài khoản mẫu

```text
admin@englishpro.local     / 123456
giaovien@englishpro.local  / 123456
phuhuynh@englishpro.local  / 123456
hocvien1@englishpro.local / 123456
hocvien2@englishpro.local / 123456
```

## Scripts hữu ích

```bash
npm run dev
npm run dev:web
npm run dev:api
npm run build
npm run lint
npm run typecheck
npm run docker:up
npm run docker:down
```

## Ghi chú

- Dự án đang được tối ưu theo hướng portfolio chuyên nghiệp để đưa vào CV.
- Dashboard đã được tách theo actor, không còn gom chung mọi nghiệp vụ vào một trang.
- Cấu trúc dữ liệu và màn hình được thiết kế để dễ mở rộng sang AI, game hóa và phân tích học tập về sau.
