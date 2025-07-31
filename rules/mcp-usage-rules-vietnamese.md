# Quy tắc sử dụng MCP Interactive Feedback - Tiếng Việt
Lưu ý: Tôi chỉ cấu hình rules đơn giản để không tốn tài nguyên cho rules này  quá nhiều mà tập trung vào các rules khác của dự án.
Bạn nên trả lời ai là sau khi làm nhiệm vụ này xong hãy trả hỏi tôi lại 1 lần nữa trước khi kết thúc. Điều này sẽ tối ưu hơn!
Đây là rules mà ai tạo ra trong quá hình tôi demo. Có có thể dễ cho người mới, còn nếu bạn đã quen dùng rules của các ide thì hãy tùy biến theo ý bạn.
## Tổng quan

Tài liệu này định nghĩa các quy tắc bắt buộc và được khuyến nghị cho AI assistants khi làm việc với Interactive Feedback MCP server trong các AI IDEs như Cursor, Claude Desktop, Cline, và Windsurf.

## Nguyên tắc cốt lõi

**Quy trình human-in-the-loop**: Luôn luôn có sự tham gia của người dùng trong các quyết định quan trọng để ngăn chặn các lỗi tốn kém và tối ưu hóa việc sử dụng tài nguyên.

## Quy tắc sử dụng bắt buộc

### 🔴 HÀNH ĐỘNG QUAN TRỌNG (LUÔN LUÔN bắt buộc)

AI assistants BẮT BUỘC sử dụng `interactive_feedback` trước khi:

1. **Thay đổi Code quan trọng**
   - Sửa đổi nhiều file (3+ files)
   - Thay đổi chức năng cốt lõi hoặc kiến trúc
   - Refactoring các phần code lớn
   - Sửa đổi file cấu hình

2. **Lệnh hệ thống**
   - Cài đặt/cập nhật/gỡ bỏ packages (`npm install`, `pip install`, v.v.)
   - Chạy lệnh build (`npm run build`, `docker build`, v.v.)
   - Các thao tác triển khai
   - Database migrations
   - Thao tác file system (tạo/xóa thư mục)

3. **Thay đổi môi trường**
   - Sửa đổi biến môi trường
   - Thay đổi cấu hình server
   - Cập nhật CI/CD pipelines
   - Thao tác Docker/container

4. **Giải quyết lỗi**
   - Khi gặp lỗi compilation
   - Lỗi runtime cần debugging
   - Xung đột dependencies
   - Vấn đề về quyền truy cập

5. **Hoàn thành tác vụ**
   - Trước khi hoàn thiện bất kỳ phản hồi nào
   - Khi đánh dấu tác vụ hoàn thành
   - Trước khi đóng phiên làm việc

### 🟡 HÀNH ĐỘNG ĐƯỢC KHUYẾN NGHỊ (Rất nên làm)

AI assistants NÊN sử dụng `interactive_feedback` khi:

1. **Yêu cầu không rõ ràng**
   - Yêu cầu của người dùng mơ hồ
   - Có nhiều cách tiếp cận triển khai
   - Cần làm rõ phạm vi hoặc ưu tiên

2. **Tạo file mới**
   - Tạo file cấu hình mới
   - Thêm module hoặc component mới
   - Tạo file tài liệu
   - Thiết lập cấu trúc dự án mới

3. **Thay đổi Breaking**
   - Sửa đổi API
   - Thay đổi database schema
   - Cập nhật phiên bản dependency
   - Sửa đổi interface

4. **Thao tác liên quan bảo mật**
   - Làm việc với API keys hoặc secrets
   - Code authentication/authorization
   - Thao tác database
   - Cấu hình bảo mật mạng

### 🟢 HÀNH ĐỘNG TÙY CHỌN (Sử dụng khi có lợi)

AI assistants CÓ THỂ sử dụng `interactive_feedback` cho:

1. **Cập nhật tiến độ**
   - Tác vụ chạy lâu
   - Thao tác phức tạp nhiều bước
   - Báo cáo trạng thái

2. **Phản hồi tối ưu hóa**
   - Cải thiện hiệu suất
   - Gợi ý chất lượng code
   - Khuyến nghị best practices

3. **Mục đích giáo dục**
   - Giải thích các khái niệm phức tạp
   - Dạy công nghệ mới
   - Phiên review code

## Định dạng Tool Call

```javascript
{
  "tool": "interactive_feedback",
  "arguments": {
    "project_directory": "/đường/dẫn/tuyệt/đối/đến/dự/án",
    "summary": "Mô tả rõ ràng, ngắn gọn về những gì bạn sắp làm và tại sao cần input từ người dùng"
  }
}
```

## Best Practices

1. **Tóm tắt rõ ràng** - Giải thích những gì bạn dự định làm và tại sao cần xác nhận từ người dùng
2. **Thời điểm phù hợp** - Gọi trước khi thực hiện hành động, không phải sau
3. **Cung cấp ngữ cảnh** - Bao gồm đường dẫn file liên quan và hệ thống/component bị ảnh hưởng

## Lợi ích tối ưu hóa chi phí

- **Giảm 80-90% lệnh gọi tool** - Từ 15-25 lệnh gọi đầy suy đoán xuống 2-5 lệnh gọi được hướng dẫn mỗi tác vụ
- **Giảm việc sử dụng token** - Ít khám phá và rollback hơn
- **Cải thiện độ chính xác** - Hướng dẫn của con người ngăn chặn các lỗi tốn kém
- **Sắp xếp quy trình làm việc** - Loại bỏ xung đột hệ thống từ thao tác không được hướng dẫn

---

**Phiên bản tài liệu**: 1.0  
**Cập nhật lần cuối**: 2024  
**Được duy trì bởi**: STMMO Project Team  
**Liên hệ**: nguyenhop530@gmail.com