# Sincay Web

Sincay Web là dự án website bán món Hàn Quốc theo mô hình fullstack, gồm:
- `frontend`: giao diện khách hàng và trang quản trị
- `backend`: hệ thống API, xác thực, phân quyền, quản lý dữ liệu và xử lý nghiệp vụ

Dự án được xây dựng theo hướng portfolio thực tập sinh/fullstack junior nhưng bám sát các bài toán thực tế như xác thực người dùng, giỏ hàng, đặt hàng, coupon, quản trị đơn hàng, tồn kho, phân quyền `admin/staff`, đặt bàn, liên hệ khách hàng và tư vấn menu.

## Demo
- Frontend production: `https://besincay.vercel.app`
- Backend production: triển khai trên Render

## Mục tiêu dự án
- Xây dựng một hệ thống đặt món trực tuyến có trải nghiệm thân thiện và responsive.
- Tách biệt rõ frontend và backend để dễ bảo trì, mở rộng và triển khai.
- Thể hiện các kỹ năng cốt lõi của một fullstack developer:
  - thiết kế REST API
  - xác thực và phân quyền
  - quản lý trạng thái người dùng/giỏ hàng
  - làm việc với MongoDB
  - xử lý nghiệp vụ quản trị
  - quản lý biến môi trường và deploy production

## Điểm nổi bật khi giới thiệu trong phỏng vấn
- Kiến trúc tách `Next.js frontend` và `Express backend`
- Xác thực bằng `JWT` kết hợp cookie `httpOnly`
- Phân quyền backend bằng middleware, không chỉ chặn ở UI
- Hỗ trợ giỏ hàng cho khách chưa đăng nhập và đồng bộ sau đăng nhập
- Quản lý đơn hàng có timeline trạng thái và yêu cầu hủy đơn
- Quản trị sản phẩm, danh mục, khách hàng, người dùng, đặt bàn, thư liên hệ, tồn kho
- Dashboard thống kê phục vụ admin/staff
- Chatbox frontend hiện tại đã được tối ưu theo hướng FAQ/preset để demo ổn định hơn khi phỏng vấn

## Công nghệ sử dụng

### Frontend
- Next.js
- React
- Bootstrap
- Bootstrap Icons
- AOS
- Swiper
- GLightbox
- Recharts

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Cookie Parser
- Nodemailer

### Hạ tầng
- Frontend deploy trên Vercel
- Backend deploy trên Render
- Database deploy trên MongoDB Atlas

## Kiến trúc tổng quan

```text
Sincay_web/
|-- backend/
|   |-- public/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- seed/
|   |   |-- services/
|   |   |-- utils/
|   |-- package.json
|   |-- server.js
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- app/
|   |   |   |-- admin/
|   |   |   |-- component/
|   |   |   |-- contexts/
|   |-- package.json
|
|-- README.md
```

## Cấu trúc backend
- `models`: định nghĩa schema Mongoose
- `controllers`: xử lý nghiệp vụ theo module
- `routes`: khai báo endpoint REST
- `middleware`: xác thực và phân quyền
- `services`: tách logic dùng chung theo nghiệp vụ khi cần
- `config`: cấu hình kết nối database
- `seed`: tạo dữ liệu mẫu
- `utils`: hàm hỗ trợ dùng chung

## Tính năng chính

### 1. Khu vực người dùng
- Đăng ký, đăng nhập, đăng xuất
- Hiển thị tài khoản demo trên màn hình đăng nhập
- Quên mật khẩu và đặt lại mật khẩu qua email
- Xem menu theo danh mục
- Tìm kiếm và xem chi tiết sản phẩm
- Thêm món vào giỏ hàng
- Giữ giỏ hàng khi chưa đăng nhập và đồng bộ sau đăng nhập
- Wishlist sản phẩm
- Áp mã giảm giá khi checkout
- Tạo đơn hàng và theo dõi lịch sử đơn hàng
- Gửi yêu cầu hủy đơn kèm lý do
- Xem và cập nhật hồ sơ cá nhân
- Đặt bàn trực tuyến
- Gửi thư liên hệ
- Chatbox hỗ trợ nhanh theo FAQ/preset

### 2. Khu vực quản trị
- Dashboard thống kê
- Quản lý đơn hàng
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý tồn kho và lịch sử nhập kho
- Quản lý user, customer
- Quản lý đặt bàn
- Quản lý thư liên hệ
- Phân quyền theo vai trò `admin` và `staff`

## Các module nghiệp vụ chính

### Xác thực và phân quyền
- Người dùng đăng nhập bằng email/password
- Backend tạo JWT và lưu bằng cookie `httpOnly`
- Middleware backend đọc token từ:
  - `Authorization: Bearer <token>`
  - cookie `token`
  - query `token`
- Sau khi xác thực, backend nạp thông tin user và role để kiểm tra quyền

Vai trò trong hệ thống:
- `customer`: sử dụng các tính năng mua hàng
- `staff`: được truy cập một phần khu vực quản trị
- `admin`: toàn quyền trong hệ thống quản trị

### Giỏ hàng
- Người dùng chưa đăng nhập vẫn có thể thêm sản phẩm vào giỏ hàng bằng local storage
- Sau khi đăng nhập, giỏ hàng local được đồng bộ lên server
- Khi checkout, đơn hàng được tạo từ giỏ hiện tại

### Đơn hàng
- Đơn hàng gồm thông tin khách hàng, danh sách món, phí ship, coupon, tổng tiền, trạng thái và timeline
- Admin/staff có thể cập nhật trạng thái đơn hàng
- Người dùng có thể gửi yêu cầu hủy đơn ở các trạng thái cho phép
- Hệ thống lưu lịch sử trạng thái để dễ theo dõi trong quản trị

### Quản lý tồn kho
- Sản phẩm có số lượng tồn
- Admin có thể nhập kho hoặc cập nhật số lượng thủ công
- Mỗi lần thay đổi tồn kho đều có log lịch sử nhập/điều chỉnh

### Coupon
- Kiểm tra coupon theo điều kiện subtotal
- Tính số tiền giảm giá ở backend
- Tăng `used_count` sau khi đặt đơn thành công

### Chatbox hỗ trợ nhanh hiện tại
- Frontend chatbox hiện được triển khai theo FAQ/preset để phù hợp demo và phỏng vấn
- Người dùng có thể:
  - bấm câu hỏi gợi ý có sẵn
  - nhập câu hỏi tự do
- Nếu nhập câu hỏi ngoài danh sách, chatbox sẽ hướng người dùng liên hệ số điện thoại của quán để được tư vấn thêm

## API chính

### Public / user
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/profile`
- `POST /api/auth/logout`

- `GET /api/products`
- `GET /api/categories`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `PUT /api/orders/:orderId/cancel`

- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/update`
- `DELETE /api/cart/remove`
- `DELETE /api/cart/clear`

- `POST /api/coupons/validate`
- `POST /api/reservations`
- `POST /api/contact-messages`

### Admin / staff
- `GET /api/orders/admin/stats/dashboard`
- `GET /api/orders/admin/all`
- `GET /api/orders/admin/:orderId`
- `PUT /api/orders/:orderId/status`

- `GET /api/products/admin/list`
- `POST /api/products/admin`
- `PUT /api/products/admin/:id`
- `DELETE /api/products/admin/:id`
- `POST /api/products/admin/:id/stock-in`
- `PUT /api/products/admin/:id/stock`
- `GET /api/products/admin/stock-history`

- `GET /api/categories/admin/list`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

- `GET /api/users/admin/all`
- `POST /api/users/admin/create`
- `PUT /api/users/admin/:id`
- `PUT /api/users/admin/:id/role`
- `PUT /api/users/admin/:id/status`
- `GET /api/users/admin/customers`

## Bảo mật và kỹ thuật
- JWT được lưu qua cookie `httpOnly`
- Backend có middleware kiểm tra quyền truy cập theo role
- CORS được cấu hình theo domain frontend
- Biến môi trường nhạy cảm tách khỏi source code
- Một số dữ liệu dùng soft delete thay vì xóa cứng

## Tài khoản mẫu
- Admin: `admin@sincay.com` / `123456`
- Customer: `customer@gmail.com` / `123456`

Lưu ý:
- Tài khoản mẫu phụ thuộc vào dữ liệu đã seed
- Trang đăng nhập frontend có block `Tài khoản demo` để điền nhanh

## Yêu cầu môi trường
- Node.js LTS
- npm
- MongoDB local hoặc MongoDB Atlas

## Cài đặt local

### 1. Clone dự án
```bash
git clone <repository-url>
cd Sincay_web
```

### 2. Cài dependencies backend
```bash
cd backend
npm install
```

### 3. Cài dependencies frontend
```bash
cd ../frontend
npm install
```

## Biến môi trường

### Backend: `backend/.env`
```env
PORT=4000
MONGODB_URI=
JWT_SECRET=
RESET_PASSWORD_SECRET=
FRONTEND_URL=http://localhost:3000
APP_MAIL_USER=
APP_MAIL_PASS=
SYSTEM_MAIL_NAME=Sincay System
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_CONNECTION_TIMEOUT=20000
SMTP_GREETING_TIMEOUT=15000
SMTP_SOCKET_TIMEOUT=30000
BODY_LIMIT=25mb
```

### Frontend: `frontend/.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## Chạy dự án ở local

### Backend
```bash
cd backend
npm run dev
```

Hoặc:
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run dev
```

### Địa chỉ mặc định
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check backend: `http://localhost:4000/api/health`

## Seed dữ liệu mẫu

### Seed user
```bash
cd backend
node src/seed/user.seed.js
```

### Seed sản phẩm và danh mục
```bash
cd backend
node src/seed/seed.js
```

### Seed coupon
```bash
cd backend
node src/seed/coupon.seed.js
```

Lưu ý:
- Một số file seed có thể xóa dữ liệu cũ trước khi tạo dữ liệu mới
- Không nên chạy seed trên production nếu đang dùng dữ liệu thật

## Production / Deploy

### Frontend
- Deploy trên Vercel
- Domain hiện tại: `https://besincay.vercel.app`

### Backend
- Deploy trên Render
- Database sử dụng MongoDB Atlas

### Biến môi trường production quan trọng
- `MONGODB_URI`
- `JWT_SECRET`
- `RESET_PASSWORD_SECRET`
- `FRONTEND_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `APP_MAIL_USER`
- `APP_MAIL_PASS`

## Hạn chế hiện tại
- Chưa có bộ unit test / integration test hoàn chỉnh
- Lint frontend hiện còn ảnh hưởng bởi một số file vendor và cấu hình rule cũ
- Ảnh sản phẩm hiện vẫn có thể lưu theo dạng base64 ở một số luồng quản trị
- Chatbox frontend hiện được thiết kế theo FAQ/preset để đảm bảo tính ổn định trong demo

## Hướng phát triển tiếp theo
- Tách riêng service gửi mail, logging và monitoring
- Bổ sung test cho backend và frontend
- Tối ưu ảnh sản phẩm bằng dịch vụ lưu trữ ngoài
- Tối ưu hiệu năng dashboard và truy vấn thống kê
- Chuẩn hóa logging hoạt động của admin/staff
- Nếu cần mở rộng trong tương lai, có thể nâng cấp chatbox thành AI assistant động

## Gợi ý trình bày khi phỏng vấn
- Bài toán tôi giải quyết là một hệ thống đặt món online có cả phía khách hàng và trang quản trị.
- Tôi chọn kiến trúc tách frontend/backend để dễ deploy độc lập và dễ mở rộng.
- Điểm tôi tập trung nhất là xác thực, phân quyền, giỏ hàng, đơn hàng và dashboard quản trị.
- Tôi xử lý phân quyền ở backend thay vì chỉ ẩn giao diện để tránh bypass từ client.
- Với chatbox, tôi chọn hướng FAQ/preset để trải nghiệm ổn định và dễ kiểm soát khi demo.
- Nếu có thêm thời gian, tôi sẽ bổ sung test và tối ưu media storage.

## Các file/thư mục không nên commit
- `backend/.env`
- `frontend/.env.local`
- `backend/node_modules`
- `frontend/node_modules`
- `frontend/.next`

## Ghi chú bảo mật
- Không chia sẻ public biến môi trường production
- Không commit `.env` thật
- Nên cung cấp `.env.example` để người khác có thể chạy lại hệ thống

## Tác giả
- Họ tên: Huỳnh Trần Tiến Khải
- Vai trò: Fullstack Developer
