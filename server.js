const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Trạng thái ban đầu: Chưa cấu hình mã phòng và mật khẩu
let roomState = {
    code: '',       // Sẽ do Admin tự tạo khi vào web
    password: '',   // Sẽ do Admin tự tạo khi vào web
    currentSlide: '0b.png', 
    timers: { 
        timer1: { time: 180, max: 180, isRunning: false }, 
        timer2: { time: 0, max: 0, isRunning: false } 
    }
};

// Vòng lặp đếm ngược thời gian thực trên Server
setInterval(() => {
    let hasChange = false;
    if (roomState.timers.timer1.isRunning && roomState.timers.timer1.time > 0) {
        roomState.timers.timer1.time--;
        hasChange = true;
        if (roomState.timers.timer1.time === 0) roomState.timers.timer1.isRunning = false;
    }
    if (roomState.timers.timer2.isRunning && roomState.timers.timer2.time > 0) {
        roomState.timers.timer2.time--;
        hasChange = true;
        if (roomState.timers.timer2.time === 0) roomState.timers.timer2.isRunning = false;
    }
    if (hasChange) {
        io.emit('updateState', roomState);
    }
}, 1000);

io.on('connection', (socket) => {
    // Gửi dữ liệu phòng hiện tại cho các máy kết nối
    socket.emit('updateState', roomState);

    // 1. XỬ LÝ KHI ADMIN TẠO PHÒNG MỚI
    socket.on('createRoom', (data, callback) => {
        roomState.code = data.code;
        roomState.password = data.pass;
        console.log(`[HỆ THỐNG] Admin đã khởi tạo phòng. Mã: ${data.code} | Khóa: ${data.pass}`);
        callback({ success: true });
    });

    // 2. XỬ LÝ KHI MÁY DISPLAY ĐĂNG NHẬP
    socket.on('joinRoom', (data, callback) => {
        // Nếu admin chưa lập phòng
        if (!roomState.code) {
            callback({ success: false, message: "Trận đấu chưa được Admin khởi tạo!" });
            return;
        }
        // Kiểm tra đúng mã phòng và mật khẩu
        if (data.code === roomState.code && data.pass === roomState.password) {
            console.log(`[HỆ THỐNG] Màn hình hiển thị kết nối thành công vào phòng: ${data.code}`);
            callback({ success: true });
        } else {
            callback({ success: false, message: "Mã phòng hoặc Mật khẩu không chính xác!" });
        }
    });

    // 3. NHẬN CÁC LỆNH ĐIỀU KHIỂN TRẬN ĐẤU TỪ TRANG ADMIN.HTML
    socket.on('adminAction', (action) => {
        if (action.type === 'changeSlide') {
            roomState.currentSlide = action.payload;
        } 
        else if (action.type === 'setTimer') {
            roomState.timers.timer1 = { time: action.payload.t1, max: action.payload.t1, isRunning: false };
            roomState.timers.timer2 = { time: action.payload.t2, max: action.payload.t2, isRunning: false };
        } 
        else if (action.type === 'controlTimer') {
            const { target, command } = action.payload;
            const applyCommand = (timerKey) => {
                if (command === 'start') roomState.timers[timerKey].isRunning = true;
                if (command === 'pause') roomState.timers[timerKey].isRunning = false;
                if (command === 'reset') {
                    roomState.timers[timerKey].time = roomState.timers[timerKey].max;
                    roomState.timers[timerKey].isRunning = false;
                }
            };

            if (target === 'both') {
                applyCommand('timer1');
                applyCommand('timer2');
            } else {
                applyCommand(target);
            }
        }
        io.emit('updateState', roomState);
    });
});

// Thay vì cố định PORT = 3000, hãy đổi thành:
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    console.log(`====================================================`);
    console.log(`  HỆ THỐNG PHÂN QUYỀN SÓNG TEEN ĐANG HOẠT ĐỘNG LAN `);
    console.log(`  -> Vào trang chủ: http://localhost:${PORT}`);
    console.log(`====================================================`);
});