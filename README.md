# 🇨🇳 Hệ Thống Ôn Tập Từ Vựng Tiếng Trung HSK

Một ứng dụng web hiện đại, trực quan và tối ưu giúp học viên ôn tập từ vựng tiếng Trung thông qua thẻ ghi nhớ (Flashcard), tự động phát âm, cùng các tính năng hỗ trợ nhập liệu thông minh từ Pinyin sang chữ Hán và tự động điền âm Hán Việt.

Ứng dụng được thiết kế theo phong cách tối giản, hiện đại với hiệu ứng chuyển động mượt mà, hỗ trợ tối đa cho người học trên máy tính.

---

## 🚀 Các Tính Năng Nổi Bật

### 1. Dashboard Thống Kê Tiến Độ Học Tập
*   **Tổng quan trực quan:** Hiển thị tổng số từ vựng trong kho và phân loại chi tiết theo 3 mức độ nhớ: **Đã nhớ** (màu xanh lá), **Đang nhớ** (màu vàng hổ phách) và **Chưa nhớ** (màu đỏ).
*   **Tích hợp phiên học:** Cho phép bắt đầu phiên ôn tập Flashcard ngay lập tức từ bảng tiến độ.

### 2. Danh Sách Từ Vựng Thông Minh & Tiện Lợi
*   **Lọc & Tìm kiếm mạnh mẽ:** Tìm kiếm thời gian thực theo chữ Hán, Pinyin, Hán Việt hoặc Nghĩa tiếng Việt.
*   **Bộ lọc ngày học (Date Filter):** Mặc định ưu tiên hiển thị các từ vựng học trong ngày **Hôm nay**, hỗ trợ chuyển đổi linh hoạt sang các ngày trước đó hoặc hiển thị **Tất cả các ngày**.
*   **Cấu hình hiển thị linh hoạt:** Cho phép lựa chọn số hàng hiển thị trên mỗi trang (**5, 10, 20 hàng**) giúp giao diện bảng luôn gọn gàng.
*   **Thao tác nhanh rực rỡ:** Các nút chức năng (Phát âm, Sửa, Xóa) luôn hiển thị màu sắc biểu tượng rõ ràng, có hiệu ứng hover tăng độ sáng phản hồi cao cấp.

### 3. Nhập Liệu Thông Minh & Tự Động Điền (Smart Input & Auto-fill)
*   **Gợi ý chữ Hán (Google IME):** Khi gõ Pinyin không dấu (ví dụ: `chengl`), hệ thống gọi API Google Input Tools để gợi ý danh sách chữ Hán tương ứng (`城里`, `成立`...) dưới dạng dropdown để người dùng nhấp chọn nhanh chóng.
*   **Tự động điền chi tiết:** Ngay khi nhập hoặc chọn chữ Hán, Backend sẽ tra cứu trong bộ từ điển thô **10.500+ ký tự Hán Việt** tích hợp sẵn để tự động điền:
    *   **Phiên âm (Pinyin):** Tự động chuyển đổi các ký tự số âm điệu (như `hao3`) thành ký tự có dấu chuẩn tiếng Trung (`hǎo`).
    *   **Hán Việt:** Ghép âm Hán Việt tương ứng của từng chữ (ví dụ: `giao khu` từ `郊区`).
    *   **Nghĩa tiếng Việt:** Tự động điền nghĩa nếu từ nằm trong bộ từ vựng thông dụng sẵn có. Người dùng có toàn quyền chỉnh sửa các thông tin này trước khi lưu.

### 4. Trải Nghiệm Học Flashcard Cao Cấp
*   **Phát âm tự động (Web Speech API):** Tự động đọc chuẩn giọng tiếng Trung phổ thông ngay khi thẻ ghi nhớ xuất hiện, tích hợp nút bấm nghe lại.
*   **Hộp thoại ôn tập gọn gàng:** Hiển thị tiến trình học dưới dạng thanh tiến độ (Progress Bar) và huy hiệu trạng thái sắc nét.
*   **Đóng băng danh sách học:** Đảm bảo danh sách từ trong phiên học được giữ nguyên (không bị co rút hay lệch chỉ số) trong suốt phiên học, cập nhật đồng bộ về bảng chính ngay khi đóng phiên.

### 5. Giao Diện Tương Tác Hiện Đại (Premium UI Components)
*   **Thông báo nổi (Toasts):** Thay thế alert hệ thống bằng các thông báo Toast trượt mượt mà từ góc phải (`Thêm mới thành công`, `Cập nhật thành công`, `Xóa thành công`) với màu sắc và biểu tượng trạng thái trực quan.
*   **Xác nhận xóa tùy chỉnh (Confirm Modal):** Hộp thoại xác nhận xóa từ vựng được thiết kế sang trọng với hiệu ứng làm mờ nền (`backdrop-blur`) và nút xác nhận màu đỏ cảnh báo.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
*   **React 18 + TypeScript**
*   **Vite** (Công cụ đóng gói và chạy dev server cực nhanh)
*   **Tailwind CSS v3** (Hệ thống thiết kế giao diện tùy biến)
*   **Lucide React** (Bộ thư viện icons sắc nét)
*   **Web Speech API** (Hỗ trợ phát âm tiếng Trung phổ thông bản địa)

### Backend
*   **Node.js + Express** (RESTful API endpoints)
*   **MySQL Pool Connection** (Sử dụng driver `mysql2` hỗ trợ `dateStrings` giúp triệt tiêu hoàn toàn lỗi lệch múi giờ UTC/GMT+7 khi lưu và lọc ngày).
*   **Từ điển Hán Việt offline:** Tích hợp bộ dữ liệu CSV thô trên server giúp tra cứu cực nhanh dưới 5ms.

---

## 💾 Cấu Trúc Bảng Database MySQL

Ứng dụng sử dụng một bảng duy nhất `vocabularies` được thiết kế tối ưu:

```sql
CREATE TABLE vocabularies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chinese VARCHAR(255) NOT NULL,                                       -- Chữ Hán
  pinyin VARCHAR(255) NOT NULL,                                        -- Phiên âm Pinyin có dấu
  han_viet VARCHAR(255) NOT NULL,                                      -- Âm Hán Việt
  meaning TEXT NOT NULL,                                               -- Nghĩa tiếng Việt
  memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ',                -- Mức độ nhớ ('Chưa nhớ', 'Đang nhớ', 'Đã nhớ')
  study_date DATE NULL,                                                -- Ngày học/ôn tập gần nhất
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                      -- Thời gian tạo từ
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Thời gian cập nhật từ
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn bị Database
1. Khởi động MySQL local của bạn (đảm bảo đang chạy ở cổng mặc định `3306`).
2. Tạo database mới hoặc chạy file script [schema.sql](file:///c:/Users/Tam/Desktop/HSK5/server/schema.sql) để khởi tạo cấu trúc bảng:
   ```bash
   mysql -u root -p < server/schema.sql
   ```

### 2. Thiết lập & Khởi chạy Backend Server
1. Truy cập thư mục `server/`:
   ```bash
   cd server
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` trong thư mục `server/` (đã có sẵn cấu hình mặc định):
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=hsk_vocab
   ```
4. Khởi chạy Backend:
   ```bash
   node server.js
   ```
   *Server sẽ chạy tại `http://localhost:5000` và tự động seed một số từ vựng mẫu nếu database của bạn đang trống.*

### 3. Thiết lập & Khởi chạy Frontend
1. Mở một terminal mới và truy cập thư mục `web/`:
   ```bash
   cd web
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Khởi chạy Frontend ở môi trường phát triển (Vite Dev Server):
   ```bash
   npm run dev
   ```
4. Truy cập trình duyệt tại địa chỉ mặc định của Vite: `http://localhost:5173`.

---

## 📁 Sơ Đồ Cấu Trúc Thư Mục Dự Án

```text
HSK5/
├── server/                     # Backend Source Code
│   ├── db.js                   # Kết nối cơ sở dữ liệu MySQL (Pool & dateStrings)
│   ├── server.js               # Các API router chính & logic nạp từ điển CSV
│   ├── pinyinUtils.js          # Tiện ích chuyển đổi thanh điệu Pinyin có số sang có dấu
│   ├── hanviet.csv             # Tệp từ điển thô chữ Hán - Hán Việt (~10.500 chữ)
│   ├── schema.sql              # Script khởi tạo cấu trúc cơ sở dữ liệu
│   └── package.json            
│
├── web/                        # Frontend React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── StatsCard.tsx       # Khối thống kê & Nút ôn tập
│   │   │   ├── VocabularyTable.tsx # Bảng hiển thị danh sách từ vựng & phân trang
│   │   │   ├── WordModal.tsx       # Popup thêm/sửa từ có gợi ý Pinyin và auto-fill
│   │   │   ├── ConfirmModal.tsx    # Modal cảnh báo xóa vĩnh viễn tùy chỉnh
│   │   │   └── StudySession.tsx    # Phiên học thẻ Flashcard
│   │   ├── utils/
│   │   │   ├── api.ts              # Các hàm gọi API Axios/Fetch lên Backend
│   │   │   └── speech.ts           # Hàm phát âm tiếng Trung phổ thông
│   │   ├── App.tsx                 # Quản lý luồng trạng thái chính của ứng dụng
│   │   ├── index.css               # Nạp Google Fonts (Inter, Noto Sans) & Core CSS
│   │   └── main.tsx
│   ├── tailwind.config.js      # Cấu hình Tokens & Màu sắc thương hiệu
│   └── package.json
└── README.md                   # Hướng dẫn chi tiết dự án
```
