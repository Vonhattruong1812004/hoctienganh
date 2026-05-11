# Kiến trúc hệ thống

Hệ thống được xây dựng theo mô hình full-stack monorepo, tách rõ frontend, backend,
database và shared code.

## Thanh phan chinh

- `apps/web`: Ứng dụng Next.js phục vụ học viên, phụ huynh, giáo viên và quản trị viên.
- `apps/api`: API NestJS xử lý xác thực, phân quyền, bài học, quiz và tiến trình.
- `packages/database`: Prisma schema map vào PostgreSQL đã thiết kế bằng tiếng Việt không dấu.
- `packages/shared`: constants, types và validation schema dùng chung.
- `docker-compose.yml`: PostgreSQL và Redis cho môi trường local.

## Luong du lieu co ban

1. Người dùng đăng nhập từ frontend.
2. Backend xác thực tài khoản trong bảng `nguoidung`.
3. Backend trả token và thông tin vai trò.
4. Học viên chọn lộ trình học đã công bố.
5. Hệ thống tải bài học, nhiệm vụ, từ vựng, ngữ pháp và bài kiểm tra.
6. Học viên làm quiz, backend chấm điểm và lưu `lanlambai`.
7. Nếu điểm đạt từ 80%, backend cập nhật `tientrinhhoctap` và mở khóa bài tiếp theo.
8. Phụ huynh xem tiến trình của học viên thông qua liên kết đã duyệt.

## Huong mo rong

- Thêm refresh token và RBAC guard.
- Thêm dashboard quản trị CRUD nội dung.
- Thêm upload media bằng S3-compatible storage.
- Thêm Redis queue cho thông báo/email.
- Thêm AI chatbot, sửa lỗi ngữ pháp và speech-to-text.
