# Question Search Application

Ứng dụng tìm kiếm câu hỏi và trả lời dựa trên từ khóa, sử dụng Next.js và MongoDB.

## Tính năng

- Tìm kiếm thông minh với nhiều từ khóa
- Hỗ trợ tìm kiếm cụm từ (ví dụ: "tai biến")
- Cho phép chọn nhiều từ khóa cùng lúc
- Hiển thị câu hỏi và câu trả lời liên quan
- Giao diện người dùng thân thiện

## Yêu cầu hệ thống

- Node.js 18.x trở lên
- MongoDB 4.x trở lên
- NPM hoặc Yarn

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd qka
```

2. Cài đặt dependencies:
```bash
npm install
# hoặc
yarn install
```

3. Tạo file `.env.local` và cấu hình MongoDB:
```env
MONGODB_URI=mongodb://username:password@localhost:27017/pharmatech?authSource=admin
```

4. Khởi chạy ứng dụng:
```bash
npm run dev
# hoặc
yarn dev
```

5. Truy cập ứng dụng tại: http://localhost:3000

## Cấu trúc dữ liệu

### Collection: questionkeywordanswer

```typescript
interface Question {
  _id: string;
  question: string;
  keyword: string[];
  answer: string;
}
```

## API Endpoints

### GET /api/questions/keyword
- Tìm kiếm từ khóa dựa trên câu hỏi
- Query params: `question` (string)
- Response: Mảng các từ khóa liên quan

### GET /api/questions/search
- Tìm kiếm câu hỏi dựa trên từ khóa
- Query params: `keywords` (string, các từ khóa phân cách bằng dấu phẩy)
- Response: Mảng các câu hỏi và câu trả lời

## Hướng dẫn sử dụng

1. Nhập câu hỏi vào ô tìm kiếm
2. Hệ thống sẽ hiển thị các từ khóa liên quan
3. Chọn một hoặc nhiều từ khóa để xem câu hỏi và câu trả lời
4. Có thể bấm vào từ khóa một lần nữa để bỏ chọn
5. Sử dụng nút "Clear" để xóa kết quả tìm kiếm

## Tính năng tìm kiếm

- Tìm kiếm theo từ đơn (độ dài > 2 ký tự)
- Tìm kiếm theo cụm từ (2-3 từ liên tiếp)
- Sắp xếp kết quả theo độ liên quan
- Giới hạn 10 từ khóa phổ biến nhất

## Xử lý lỗi

- Hiển thị thông báo khi không tìm thấy từ khóa
- Hiển thị thông báo khi không tìm thấy câu hỏi
- Log chi tiết lỗi trong console cho việc debug

## Phát triển

### Cấu trúc thư mục

```
qka/
├── app/
│   ├── api/
│   │   ├── questions/
│   │   │   ├── keyword/
│   │   │   │   └── route.ts
│   │   │   └── search/
│   │   │       └── route.ts
│   │   │
│   │   ├── page.tsx
│   │   └── components/
│   │       └── QuestionSearch.tsx
│   ├── lib/
│   │   └── mongodb.ts
│   ├── models/
│   │   └── Question.ts
│   ├── .env.local
│   └── package.json
```

### Công nghệ sử dụng

- Next.js 13 (App Router)
- MongoDB với Mongoose
- Material-UI (MUI)
- TypeScript

## Contributing

1. Fork repository
2. Tạo branch mới
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License 