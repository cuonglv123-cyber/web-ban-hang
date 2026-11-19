# Phạm vi và nghiệm thu web anh Lê Văn Cường

| Phần hiện có | Dữ liệu ban đầu | Quản lý | Kiểm tra |
|---|---|---|---|
| Giới thiệu và chân trang | Tên, vai trò, hotline, địa chỉ và email | Liên hệ và Trang chủ, lưu từng phần | Đổi hotline và tải lại. Đối chiếu link gọi, chân trang, popup tư vấn. |
| Chân dung và QR TAMMI | Hai ảnh gốc | Chọn file, xem trước và lưu riêng | Quét QR sau chuyển WebP. Popup có hướng dẫn kết nối. |
| Trình chiếu | Bốn ảnh | Thêm/sửa/ẩn/xóa/đổi thứ tự | Xem chuyển ảnh, chọn ảnh, tạm dừng và kiểm tra điện thoại. |
| Dịch vụ | Bốn thẻ | Sửa nội dung và ảnh, ẩn/sắp xếp. Thêm dịch vụ có trang riêng | Để trống đường dẫn khi thêm tên tiếng Việt. Thử URL trùng và đổi tên. |
| Chữ ký số | 30 bản ghi USB/HSM/Mobile CA | Nhóm cá nhân/tổ chức, cấp mới/gia hạn | Kiểm tra chuyển nhóm và chọn gói trong popup. |
| S-Invoice | 6 gói đơn lẻ, 30 combo | Cập nhật gói, giá, số hóa đơn, thời hạn, giảm giá | Một combo cập nhật ở cả popup S-Invoice và CA. |
| Hợp đồng và Internet | 6 vContract, 18 Internet | Gói, số hợp đồng, thông số IP/Mesh, giá | Chọn gói giữ giá và dịch vụ khi gửi. |
| Video | Hai YouTube, hai MP4 | Thêm/sửa/ẩn/xóa/đổi thứ tự | Tự chuyển và dừng khi tương tác, chọn dịch vụ tư vấn từ video. |
| Form và yêu cầu | Form trên trang và popup | Neon, mail anh Cường, xác nhận cho khách nhập email | Có/không email, lỗi gửi, gửi lặp, gói vừa ẩn, cập nhật trạng thái. |
| Xuất Excel | Tất cả yêu cầu trong Neon | Lọc theo khoảng ngày và tải file | Thử đúng 00:00 ngày đầu và hết ngày cuối theo giờ Việt Nam. Kiểm tra số 0 đầu điện thoại. |

## Kết quả

- Build production Next.js thành công.
- Chrome 1440 px và 390 px đối chiếu với v152 gốc. Kiểm tra bốn popup, các nhóm CA, 30 combo ở cả hai popup, sáu gói vContract, 18 Internet, bốn video và bốn ảnh trình chiếu.
- Đã thử lưu riêng hotline và QR, chạy lại khởi tạo giữ chỉnh sửa, chọn gói combo và gửi form, form không có email, email sai, thiếu đồng ý, Resend chấp nhận hoặc từ chối, gửi lặp và gói bị ẩn.
- Đã thử tạo dịch vụ từ tên tiếng Việt, chặn đường dẫn trùng, ẩn dịch vụ và ẩn ảnh trình chiếu.
- Đã tải Excel từ giao diện, kiểm tra khoảng ngày Việt Nam bằng dữ liệu tại 00:00 ngày đầu, 23:59:59.999 ngày cuối và 00:00 ngày kế tiếp. File được đọc lại bằng thư viện độc lập, giữ số 0 đầu điện thoại.
- QR JPEG gốc và QR WebP từ thao tác tải ảnh trong admin giải mã cùng nội dung.
- Neon được mô phỏng bằng Postgres cục bộ, Blob và Resend dùng phản hồi mô phỏng. Tài khoản dịch vụ thật, Vercel Preview riêng tư, domain và hộp thư thật cần cấu hình khi triển khai.
