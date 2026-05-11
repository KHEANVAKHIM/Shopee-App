# Sales App - Ứng dụng Bán Hàng

Ứng dụng bán hàng được xây dựng với React Native và Expo, hỗ trợ cả người dùng và quản trị viên.

## ⚙️ Cài đặt và Cấu hình

### Bước 1: Clone và cài đặt

```bash
git clone https://github.com/KHEANVAKHIM/Shopee-App
cd Sales-App
npm install
```

### Bước 2: Cấu hình Database

1. **Tạo database MySQL**:
   ```bash
   mysql -u root -p
   CREATE DATABASE doan;
   ```

2. **Tạo file `.env`**:
   ```bash
   cp .env.example .env
   ```
   
   Chỉnh sửa file `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=doan
   DB_PORT=3306
   SERVER_PORT=3000
   ```

3. **Tạo các bảng database** (xem file SQL hoặc chạy schema trong database)

### Bước 3: Cấu hình IP Server

1. **Tìm IP của máy chạy backend**:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

2. **Cập nhật IP trong `ipconfig.ts`**:
   ```typescript
   let currentIP = "192.168.1.100"; // Thay bằng IP của bạn
   ```

## 🚀 Chạy ứng dụng

### Chạy Backend Server

```bash
# Development (auto-reload)
npm run server:dev

# Production
npm run server
```

Server sẽ chạy tại: `http://localhost:3000`

### Chạy Frontend App

```bash
# Khởi động Expo
npm start
```

Sau đó:
1. Mở **Expo Go** trên điện thoại
2. Quét **QR code** hiển thị trong terminal
3. App sẽ tự động load

### Chạy trên Emulator/Simulator

```bash
# Android
npm run android

# iOS (chỉ trên macOS)
npm run ios

# Web
npm run web
```
