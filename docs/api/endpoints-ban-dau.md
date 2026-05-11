# API endpoints ban đầu

Base URL:

```text
http://localhost:4000/api
```

## Health

```http
GET /health
```

Kiểm tra API đang hoạt động.

## Auth

```http
POST /auth/login
```

Body:

```json
{
  "email": "hocvien1@englishpro.local",
  "password": "123456"
}
```

## Users

```http
GET /users/summary
```

Thống kê số lượng người dùng theo vai trò.

Yêu cầu xác thực JWT. Chỉ vai trò `GiaoVien` và `QuanTriVien` được truy cập.

## Learning paths

```http
GET /learning-paths
GET /learning-paths/:id
```

Lấy danh sách lộ trình đã công bố và chi tiết lộ trình.

Yêu cầu xác thực JWT.

## Lessons

```http
GET /lessons/:id
```

Lấy chi tiết bài học, gồm nhiệm vụ, từ vựng, ngữ pháp, tài nguyên và quiz.

Yêu cầu xác thực JWT.

## Quizzes

```http
GET /quizzes/:id
POST /quizzes/:id/submit
```

Lấy câu hỏi và đáp án của bài kiểm tra. Endpoint hiện tại chưa trả đáp án đúng để tránh lộ đáp án trên client.

`GET /quizzes/:id` yêu cầu xác thực JWT. `POST /quizzes/:id/submit` chỉ cho vai trò `HocVien`.

## Progress

```http
GET /progress/students/:studentId
```

Lấy tiến trình học tập của một học viên.

Yêu cầu xác thực JWT. Hệ thống chỉ cho phép:

- Học viên xem tiến trình của chính mình.
- Phụ huynh xem học viên đã liên kết và được chấp nhận.
- Giáo viên và quản trị viên xem tiến trình để phục vụ quản lý.

## Parents

```http
GET /parents/me/students
```

Lấy danh sách học viên đã liên kết với phụ huynh đang đăng nhập, gồm cấp độ, mục
tiêu học tập, điểm, chuỗi ngày học và tiến độ trung bình.

Yêu cầu xác thực JWT và vai trò `PhuHuynh`.
