import { io } from "socket.io-client";

// URL của Backend Server
const BACKEND_URL = "http://localhost:5000";

// Tạo một kết nối socket duy nhất cho toàn bộ ứng dụng (Singleton pattern)
export const socket = io(BACKEND_URL, {
  autoConnect: false, // Chỉ kết nối khi được gọi thủ công
});
