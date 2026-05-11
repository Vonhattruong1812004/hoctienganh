# Tiến độ dự án - English Learning System

Cập nhật: 2026-05-03

## 1. Mục tiêu dự án

Xây dựng một hệ thống học tiếng Anh trực tuyến theo hướng sản phẩm thực tế, đủ
chặt chẽ để đưa vào CV và có thể phát triển tiếp thành sản phẩm thật.

Hệ thống hướng đến các mục tiêu chính:

- Có lộ trình học rõ ràng, gồm bài học, nhiệm vụ và bài kiểm tra.
- Có nội dung từ vựng, ngữ pháp, tài nguyên audio, hình ảnh và PDF.
- Có cơ chế làm quiz, chấm điểm và lưu kết quả học tập.
- Có tiến trình học tập và điều kiện mở khóa bài tiếp theo.
- Có nhiều vai trò: Học viên, Phụ huynh, Giáo viên, Quản trị viên.
- Có dashboard quản trị nội dung và theo dõi tiến độ.
- Có kiến trúc hiện đại: Next.js, NestJS, PostgreSQL, Prisma, Redis, Docker.

## 2. Trạng thái hiện tại

Đến thời điểm cập nhật, dự án đang ở giai đoạn:

```text
Giai đoạn 3: Đã có nền tảng kỹ thuật và đã khởi động được auth/login/dashboard, tiếp tục đi vào tính năng học tập thực.
```

Tiến độ tổng thể ước tính:

```text
56% hoàn thành
```

Lý do chưa cao hơn là vì nền móng đã khá vững và RBAC lõi đã bắt đầu chạy thật,
nhưng các phần sản phẩm như CRUD quản trị, dashboard phụ huynh nâng cao,
quiz engine nâng cao, báo cáo và deploy vẫn còn cần hoàn thiện thêm.

## 3. Những phần đã hoàn thành

### 3.1. Phân tích yêu cầu và định hướng

Trạng thái: Hoàn thành  
Tiến độ: 100%

Đã có:

- Mục đích dự án.
- Phạm vi dự án.
- Tầm nhìn dự án.
- Chiến lược triển khai.
- Mô tả hệ thống.
- Quy trình nghiệp vụ.
- Yêu cầu chức năng.
- Yêu cầu phi chức năng.
- Quy tắc nghiệp vụ.
- Use Case Diagram.
- Domain Model.
- Activity Diagram.
- Lựa chọn công nghệ theo hướng CV/chuyên nghiệp.

### 3.2. Thiết kế CSDL PostgreSQL

Trạng thái: Hoàn thành nền tảng  
Tiến độ: 100%

Đã có:

- File SQL import trực tiếp vào PostgreSQL.
- Tên bảng và cột bằng tiếng Việt không dấu.
- Khóa chính, khóa ngoại, unique, check constraint.
- Index tối ưu truy vấn.
- Dữ liệu mẫu đủ để demo và kiểm thử.

File chính:

```text
thiet_ke_csdl_hoc_tieng_anh.sql
```

Đã seed sẵn:

- 5 người dùng mẫu.
- 4 vai trò.
- 2 lộ trình học.
- 6 bài học.
- 12 nhiệm vụ.
- 12 từ vựng.
- 5 ngữ pháp.
- 4 bài kiểm tra.
- 17 câu hỏi.
- 31 đáp án.
- Tiến trình học tập, lần làm bài, thông báo, gợi ý ôn tập.

### 3.3. Khởi tạo project monorepo

Trạng thái: Hoàn thành  
Tiến độ: 100%

Đã tạo cấu trúc:

```text
apps/web
apps/api
packages/database
packages/shared
docs
docker-compose.yml
```

Đã có:

- Root `package.json` dùng npm workspaces.
- `.env.example`.
- `.gitignore`.
- `README.md`.
- Docker Compose cho PostgreSQL và Redis.

### 3.4. Backend NestJS nền tảng

Trạng thái: Đã có nền, có luồng học tập cơ bản, RBAC bước đầu và API phụ huynh  
Tiến độ: 80%

Đã có:

- Ứng dụng NestJS API.
- Global prefix `/api`.
- `ValidationPipe`.
- `ConfigModule`.
- `PrismaService`.
- Health endpoint.
- Auth login endpoint.
- Auth me endpoint.
- JWT strategy, guard và roles guard.
- Users summary endpoint.
- Learning paths read endpoint.
- Lesson detail read endpoint.
- Quiz detail read endpoint.
- Quiz submit endpoint.
- Progress read endpoint.
- RBAC cho thống kê người dùng, nộp quiz và xem tiến trình học tập.
- Parents endpoint để phụ huynh xem học viên đã liên kết.

Endpoint hiện có:

```text
GET  /api/health
POST /api/auth/login
GET  /api/users/summary
GET  /api/learning-paths
GET  /api/learning-paths/:id
GET  /api/lessons/:id
GET  /api/quizzes/:id
GET  /api/progress/students/:studentId
```

Đã kiểm thử:

- API health OK.
- Đăng nhập bằng tài khoản seed OK.
- Users summary OK.
- API typecheck OK.
- API build OK.
- Quiz submit và cập nhật tiến trình OK.
- Smoke test RBAC OK: học viên bị chặn thống kê, giáo viên xem được thống kê,
  phụ huynh chỉ xem được học viên đã liên kết.
- Smoke test phụ huynh OK: phụ huynh lấy được học viên đã duyệt, học viên bị chặn endpoint phụ huynh.

Chưa làm:

- Register.
- Refresh token.
- Mở rộng RBAC cho toàn bộ CRUD quản trị khi các module admin được xây dựng.
- CRUD admin.

### 3.5. Frontend Next.js nền tảng

Trạng thái: Đã có login, dashboard theo vai trò, dashboard phụ huynh cơ bản và luồng học thật  
Tiến độ: 72%

Đã có:

- Ứng dụng Next.js.
- Layout chính.
- Dashboard demo đầu tiên.
- Trang đăng nhập.
- Lưu session access token và user.
- Dashboard lấy dữ liệu thật từ API.
- Trang lộ trình, bài học và quiz.
- Logout.
- Sidebar.
- Khu tổng quan lộ trình.
- Khu chỉ số hệ thống.
- Khu timeline học tập.
- CSS responsive.
- Trang học bài chi tiết.
- Trang làm quiz có submit.
- Dashboard đổi ngữ cảnh theo vai trò Học viên, Phụ huynh, Giáo viên, Quản trị viên.
- Frontend không gọi thống kê hệ thống khi người dùng không đủ quyền.
- Phụ huynh xem được danh sách học viên đã liên kết ngay trên dashboard.
- Build thành công.

Đã kiểm thử:

- Web typecheck OK.
- Web build OK.
- Frontend local HTTP 200 OK.

Chưa làm:

- Điều hướng theo vai trò đúng nghiệp vụ.
- Giao diện phụ huynh.
- Dashboard giáo viên/admin.

### 3.6. Database/Prisma package

Trạng thái: Đã có nền và đã generate client  
Tiến độ: 78%

Đã có:

- Prisma schema map vào bảng PostgreSQL tiếng Việt.
- Prisma generate OK.
- Các model chính: người dùng, vai trò, bài học, quiz, câu hỏi, đáp án, tiến trình.

Chưa làm:

- Bổ sung đầy đủ relation Prisma cho toàn bộ bảng.
- Chuyển dần raw SQL sang repository/service có type tốt hơn.
- Migrate chuẩn từ Prisma nếu muốn chuyển hẳn sang Prisma migrate.

### 3.7. Shared package

Trạng thái: Đã có nền  
Tiến độ: 40%

Đã có:

- Role constants.
- Learning status constants.
- Auth/user response types.
- Login schema bằng Zod.

Chưa làm:

- Shared DTO/schema cho lesson, quiz, progress.
- Error codes.
- Permission constants.

## 4. Bảng tiến độ tổng hợp

| Hạng mục | Trạng thái | Tiến độ |
|---|---:|---:|
| Phân tích yêu cầu và tài liệu | Hoàn thành | 100% |
| Thiết kế CSDL và seed data | Hoàn thành | 100% |
| Cấu trúc monorepo | Hoàn thành | 100% |
| Docker/PostgreSQL/Redis foundation | Đã có | 70% |
| Prisma/database package | Đã có nền | 70% |
| Backend API foundation | Đã có nền, RBAC và API phụ huynh | 65% |
| Auth API | Có login, me và JWT guard | 45% |
| RBAC/phân quyền | Đã có lớp lõi | 35% |
| Frontend dashboard | Có dashboard theo vai trò và phụ huynh cơ bản | 55% |
| Học viên học bài | Chưa hoàn thiện | 10% |
| Quiz engine | Mới có đọc quiz | 15% |
| Chấm điểm và lưu kết quả | Chưa làm | 0% |
| Tiến trình/mở khóa bài học | Mới có đọc dữ liệu | 10% |
| Admin CRUD nội dung | Chưa làm | 0% |
| Phụ huynh theo dõi học viên | Có API và UI cơ bản | 35% |
| Testing | Mới có build/typecheck | 20% |
| Deploy/CI/CD | Chưa làm | 0% |

Tiến độ tổng thể:

```text
56%
```

## 5. Lộ trình tiếp theo

### Sprint 1 - Auth và phân quyền

Mục tiêu: Đăng nhập thật, lưu token, chia giao diện theo vai trò.

Tiến độ hiện tại: 88%

Việc cần làm:

1. Điều hướng theo vai trò: Học viên, Phụ huynh, Giáo viên, Quản trị viên.
2. Mở rộng RBAC cho endpoint quản trị khi bắt đầu CRUD admin.
3. Tạo refresh token nếu cần.
4. Tạo password reset hoặc register nếu phạm vi mở rộng.

Kết quả mong đợi:

- Đăng nhập bằng tài khoản seed được.
- Học viên vào dashboard học tập.
- Giáo viên/admin vào dashboard quản trị.
- Người chưa đăng nhập không vào được trang cần bảo vệ.

### Sprint 2 - Giao diện học viên

Mục tiêu: Học viên có thể xem lộ trình, xem bài học, xem từ vựng/ngữ pháp/nhiệm vụ.

Việc cần làm:

1. Trang danh sách lộ trình.
2. Trang chi tiết lộ trình.
3. Trang chi tiết bài học.
4. Component từ vựng.
5. Component ngữ pháp.
6. Component tài nguyên học tập.
7. Component nhiệm vụ học tập.
8. Hiển thị trạng thái: Chưa học, Đang học, Hoàn thành, Bị khóa.

### Sprint 3 - Quiz engine

Mục tiêu: Học viên làm bài kiểm tra thật.

Việc cần làm:

1. Trang làm quiz.
2. Hiển thị câu hỏi và đáp án.
3. Xử lý chọn đáp án/điền từ.
4. Tạo endpoint bắt đầu làm bài.
5. Tạo endpoint nộp bài.
6. Chấm điểm backend.
7. Lưu `lanlambai`.
8. Lưu `cautraloihocvien`.
9. Trả kết quả Đạt/Không đạt.

### Sprint 4 - Tiến trình học tập và mở khóa bài

Mục tiêu: Hệ thống tự cập nhật tiến trình sau khi học và làm quiz.

Việc cần làm:

1. Đánh dấu hoàn thành nhiệm vụ.
2. Tính phần trăm hoàn thành bài học.
3. Cập nhật điểm cao nhất.
4. Nếu điểm >= 80 thì đánh dấu Hoàn thành.
5. Mở khóa bài tiếp theo.
6. Tạo gợi ý ôn tập nếu điểm < 80.

### Sprint 5 - Admin/Giáo viên CRUD

Mục tiêu: Quản trị nội dung học tập.

Việc cần làm:

1. CRUD chủ đề học.
2. CRUD lộ trình học.
3. CRUD giai đoạn học.
4. CRUD bài học.
5. CRUD nhiệm vụ.
6. CRUD từ vựng.
7. CRUD ngữ pháp.
8. CRUD bài kiểm tra, câu hỏi, đáp án.
9. Quản lý trạng thái Nháp/Công bố/Ẩn.

### Sprint 6 - Phụ huynh và báo cáo

Mục tiêu: Phụ huynh theo dõi học viên, admin xem thống kê.

Việc cần làm:

1. Trang phụ huynh.
2. Danh sách học viên liên kết.
3. Tiến trình học viên.
4. Kết quả bài kiểm tra.
5. Cảnh báo học viên chưa đạt.
6. Dashboard thống kê admin.

### Sprint 7 - Hoàn thiện CV/production

Mục tiêu: Dự án sẵn sàng đưa vào CV.

Việc cần làm:

1. README chuyên nghiệp bằng tiếng Anh.
2. Ảnh chụp màn hình.
3. ERD/diagram trong docs.
4. API docs.
5. Unit test/service test.
6. Docker run full stack.
7. Deploy frontend/backend.
8. Thêm demo account.
9. Ghi rõ architecture vào CV.

## 6. Việc nên làm ngay tiếp theo

Thứ tự ưu tiên:

```text
1. Thêm CRUD admin cho nội dung học tập.
2. Mở rộng dashboard phụ huynh sang báo cáo chi tiết từng học viên.
3. Mở rộng RBAC cho CRUD admin.
4. Bổ sung test service và e2e cơ bản.
5. Hoàn thiện README và demo flow.
```

Đây là bước quan trọng nhất vì nó biến project từ "có nền tảng" thành "có
luồng sử dụng thật".

## 7. Định nghĩa hoàn thành MVP

MVP được xem là hoàn thành khi:

- Học viên đăng nhập được.
- Học viên xem được lộ trình.
- Học viên mở được bài học.
- Học viên làm quiz được.
- Hệ thống chấm điểm được.
- Điểm >= 80 thì mở khóa bài tiếp theo.
- Phụ huynh xem được tiến trình học viên.
- Giáo viên/admin quản lý được nội dung cơ bản.

Tiến độ MVP hiện tại:

```text
52%
```

## 8. Định nghĩa hoàn thành bản CV

Bản CV được xem là đạt khi:

- Có frontend đẹp, có nhiều vai trò.
- Có backend modular NestJS.
- Có PostgreSQL schema rõ ràng.
- Có auth/RBAC.
- Có quiz engine.
- Có progress tracking.
- Có admin CRUD.
- Có Docker.
- Có README tiếng Anh.
- Có demo URL hoặc video demo.
- Có test cơ bản.

Tiến độ bản CV hiện tại:

```text
45%
```
