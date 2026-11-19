# Viettel Đồng Nai · Lê Văn Cường

Dự án Next.js từ giao diện v152. Trang khách và `/admin` dùng dữ liệu riêng của anh Cường.

## Chạy cục bộ

Dùng Node.js 22. Chạy trong thư mục này.

~~~powershell
npm ci
Copy-Item .env.example .env.local
~~~

Điền cấu hình rồi chạy.

~~~powershell
npm run db:init
npm run dev
~~~

Mở [trang khách](http://localhost:3000) và [admin](http://localhost:3000/admin). Lệnh khởi tạo giữ các bản ghi đã xuất bản khi chạy lại.

## Các biến môi trường

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối Neon riêng của anh Cường. Chạy `npm run db:init` trên từng nhánh database Preview hoặc Production. |
| `ADMIN_USERNAME` | Tên đăng nhập quản trị. |
| `ADMIN_PASSWORD_HASH` | Hash mật khẩu từ lệnh dưới đây. |
| `BLOB_READ_WRITE_TOKEN` | Token kho Vercel Blob Public kết nối với project. Dùng cho tải ảnh trực tiếp. |
| `RESEND_API_KEY` | API key Resend của project. |
| `RESEND_FROM_EMAIL` | Địa chỉ gửi thuộc domain đã xác minh trong Resend. |

Tạo hash trên PowerShell 7.

~~~powershell
Read-Host -MaskInput 'Mật khẩu 12–200 ký tự' | npm run --silent admin:hash
~~~

## Cập nhật nội dung

- **Liên hệ** chỉnh tên, chức danh, hotline, địa chỉ, email công khai và email nhận tư vấn. Mặc định email nhận là `cuonglv6@viettel.com.vn`. Ảnh đại diện và QR TAMMI có chọn file và xem trước.
- **Trang chủ** sửa nội dung chữ theo từng phần. Nội dung nằm trong ảnh cập nhật bằng thay ảnh.
- **Ảnh trình chiếu** quản lý bốn ảnh gốc, thêm, sửa, ẩn, xóa và đổi thứ tự.
- **Dịch vụ** sửa bốn mục gốc hoặc thêm dịch vụ với trang riêng. Để trống đường dẫn để tạo từ tên. Đổi tên giữ đường dẫn đã lưu.
- **Báo giá** quản lý bốn nhóm dịch vụ. Chữ ký số có USB Token, HSM, Mobile CA theo cá nhân và tổ chức. Combo CA–S-Invoice được quản lý trong S-Invoice rồi hiển thị chung ở hai popup. Thay đổi giá hoặc ẩn gói sẽ áp dụng ở cả hai nơi.
- **Video** nhận ID hoặc link YouTube, playlist và MP4. Khi khách tương tác video, việc tự chuyển dừng để khách xem tiếp.
- **Yêu cầu tư vấn** có trạng thái Mới / Đã liên hệ / Đã xử lý. Lọc theo ngày gửi, tính cả ngày đầu và cuối theo giờ Việt Nam, rồi tải Excel. Bỏ trống hai ô để xuất tất cả.

Bấm lưu từng trường, ảnh hoặc mục để xuất bản phần đó. **Lưu danh sách** áp dụng thứ tự, ẩn và xóa. Ảnh gốc tối đa 10 MB được chuyển WebP trong trình duyệt. Hãy quét lại QR sau khi đổi ảnh.

## Form và email

Cả form trên trang và form popup ghi vào Neon, trả mã yêu cầu rồi gửi email cho anh Cường. Khách có nhập email nhận xác nhận riêng. Khi bỏ trống email, admin hiển thị **Không nhập email**.

Kết quả **Đã gửi** nghĩa là Resend đã chấp nhận và trả ID email. Nếu thiếu cấu hình hoặc gửi lỗi, yêu cầu vẫn lưu trong Neon. Admin có kết quả riêng cho mail anh Cường và mail khách.

## Vercel Preview và Production

1. Đẩy mã nguồn thư mục này lên repo anh Cường, import trong project Vercel riêng.
2. Chọn preset Next.js, root `./`, Node.js 22.x và build `npm run build`. Giữ output mặc định Next.js.
3. Thêm biến cho Preview, kết nối Blob và khởi tạo Neon Preview. Bật **Settings → Deployment Protection → Vercel Authentication** rồi kiểm tra URL bằng cửa sổ chưa đăng nhập. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
4. Dùng khách giả và email thử để nghiệm thu. Sau khi duyệt, cấu hình Production, khởi tạo Neon Production, deploy rồi gán tên miền.
5. Khi chuyển từ Apps Script cũ, tắt trigger `processQueue` và cập nhật các liên kết form về website mới.

## Dữ liệu cần đối chiếu

Bản v152 có `VCONT_10K` ghi số lượng hợp đồng 0 trong khi mô tả ghi 10.000. Bản chuyển đổi giữ giá trị từ nguồn, cần anh Cường đối chiếu bảng được duyệt trước khi công bố.

Các hình banner và slide có chữ hoặc thông tin cá nhân bên trong ảnh. Đổi thông tin liên hệ chỉ cập nhật phần chữ HTML, ảnh mới được cập nhật qua nút chọn file.
