# Sincay Web

Hệ thống website bán món Hàn Quốc theo mô hình fullstack, gồm giao diện khách hàng và trang quản trị dành cho `admin`/`staff`. Dự án tập trung vào các nghiệp vụ thực tế như xác thực người dùng, giỏ hàng, đặt hàng, wishlist, coupon, quản lý đơn hàng, quản lý sản phẩm, khách hàng, tồn kho và dashboard thống kê.

## Demo
- Frontend production: `https://besincay.vercel.app`
- Backend production: triển khai trên Render

## Mục tiêu dự án
- Xây dựng hệ thống đặt món trực tuyến có giao diện thân thiện, responsive và dễ sử dụng.
- Áp dụng mô hình tách lớp frontend/backend rõ ràng.
- Thể hiện các kiến thức cốt lõi của thực tập sinh fullstack: xác thực, phân quyền, CRUD, dashboard, làm việc với MongoDB, deploy và quản lý biến môi trường.

## Công nghệ sử dụng
### Frontend
- Next.js
- React
- Bootstrap
- Bootstrap Icons
- AOS
- Swiper
- GLightbox

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

## Tính năng chính
### Khu vực người dùng
- Đăng ký, đăng nhập, đăng xuất
- Quên mật khẩu và đặt lại mật khẩu
- Xem danh sách sản phẩm theo danh mục
- Tìm kiếm và phân trang sản phẩm
- Xem chi tiết sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Giữ giỏ hàng khi chưa đăng nhập và đồng bộ sau đăng nhập
- Wishlist sản phẩm
- Áp mã giảm giá khi đặt hàng
- Checkout và tạo đơn hàng
- Theo dõi lịch sử đơn hàng
- Hủy đơn hàng kèm lý do
- Xem và cập nhật hồ sơ cá nhân

### Khu vực quản trị
- Dashboard thống kê
- Quản lý đơn hàng
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý tồn kho và lịch sử nhập hàng
- Quản lý người dùng, khách hàng
- Quản lý đặt bàn
- Quản lý thư liên hệ
- Phân quyền `admin` và `staff`

## Điểm kỹ thuật nổi bật
- Xác thực bằng JWT kết hợp cookie `httpOnly`
- Phân quyền backend bằng middleware, không chỉ ẩn giao diện ở frontend
- API backend xử lý lọc, phân trang và thống kê
- Sử dụng soft delete cho một số dữ liệu quan trọng
- Tách biệt frontend và backend để thuận tiện triển khai
- Cấu hình môi trường rõ ràng cho local và production

## Kiến trúc dự án
```
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

## Mô hình backend
- `models`: định nghĩa schema Mongoose
- `controllers`: xử lý nghiệp vụ
- `routes`: khai báo endpoint
- `middleware`: xác thực, phân quyền
- `config`: cấu hình kết nối database
- `seed`: tạo dữ liệu mẫu
- `utils`: hàm hỗ trợ dùng chung

## Tài khoản mẫu
- Admin: `admin@sincay.com` / `123456`
- Customer: `customer@gmail.com` / `123456`

Lưu ý: tài khoản mẫu phụ thuộc vào dữ liệu đã seed trong database.

## Yêu cầu môi trường
- Node.js LTS
- npm
- MongoDB local hoặc MongoDB Atlas

## Hướng dẫn cài đặt local
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
### Chạy backend
```bash
cd backend
npm start
```

Hoặc chạy development mode:
```bash
cd backend
npm run dev
```

### Chạy frontend
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
- Một số file seed có thể xóa dữ liệu cũ trước khi tạo dữ liệu mẫu.
- Không nên chạy seed bừa trên môi trường production nếu đang dùng dữ liệu thật.

## Quy trình nghiệp vụ chính
### Đăng nhập
- Người dùng gửi email và mật khẩu
- Backend kiểm tra tài khoản, tạo JWT
- JWT được trả về và lưu bằng cookie `httpOnly`
- Middleware backend dùng JWT để xác thực các request cần quyền truy cập

### Giỏ hàng
- Khách chưa đăng nhập vẫn có thể thêm sản phẩm
- Khi đăng nhập, giỏ hàng local được đồng bộ với server
- Khi checkout, backend tạo đơn hàng từ giỏ hiện tại

### Đơn hàng
- Tạo đơn hàng từ trang checkout
- Áp coupon nếu hợp lệ
- Quản trị viên cập nhật trạng thái đơn hàng
- Người dùng có thể xem chi tiết đơn và gửi yêu cầu hủy

### Phân quyền
- `customer`: dùng chức năng mua hàng
- `staff`: xem và thao tác trong phạm vi quản trị được cấp
- `admin`: toàn quyền quản trị hệ thống

## API và bảo mật
- Backend dùng JWT để xác thực
- Cookie `httpOnly` hỗ trợ bảo vệ tốt hơn so với lưu token hoàn toàn ở `localStorage`
- Middleware backend kiểm tra quyền truy cập theo role
- CORS được cấu hình theo domain frontend
- Các biến nhạy cảm được tách ra bằng `.env`

## Triển khai production
### Frontend
- Deploy trên Vercel
- Domain hiện tại: `https://besincay.vercel.app`

### Backend
- Deploy trên Render
- Kết nối database MongoDB Atlas

### Biến môi trường production cần chú ý
- `MONGODB_URI`
- `JWT_SECRET`
- `RESET_PASSWORD_SECRET`
- `FRONTEND_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `APP_MAIL_USER`
- `APP_MAIL_PASS`

## Hướng dẫn nộp dự án
Khi gửi dự án cho giảng viên hoặc nhà tuyển dụng, nên:
- Không gửi `node_modules`
- Không gửi `.next`
- Không gửi `.env` thật
- Giữ lại source code, `package.json`, `package-lock.json`, `README.md`
- Cung cấp tài khoản demo hoặc dữ liệu seed mẫu

## Các thư mục/file không nên commit
- `backend/.env`
- `frontend/.env.local`
- `backend/node_modules`
- `frontend/node_modules`
- `frontend/.next`

## Hướng mở rộng trong tương lai
- Upload ảnh sản phẩm qua dịch vụ lưu trữ ngoài thay vì base64
- Thêm unit test / integration test
- Tối ưu hiệu năng dashboard
- Hoàn thiện quy trình email production ổn định hơn
- Tách service gửi mail và logging

## Tình trạng hiện tại
- Dự án đã có frontend production
- Dự án đã có backend deploy
- Hệ thống đã có đầy đủ các nghiệp vụ chính cho một bài tập fullstack hoặc portfolio thực tập sinh

## Tác giả
- Họ tên: Huỳnh Trần Tiến Khải
- Vai trò: Fullstack Developer 

## Ghi chú bảo mật
 - Không chia sẻ public các biến môi trường production
- Nên tạo `.env.example` cho người chấm chạy lại hệ thống
