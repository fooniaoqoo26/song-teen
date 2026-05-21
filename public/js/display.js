const socket = io(window.location.protocol + '//' + window.location.host);
let localState = {};

const body = document.getElementById('display-body');
const textUngHo = document.getElementById('text-ungho');
const textPhanDoi = document.getElementById('text-phandoi');
const circleUngHo = document.getElementById('circle-ungho');
const circlePhanDoi = document.getElementById('circle-phandoi');

const circumference = 2 * Math.PI * 45; // 282.7

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateUI() {
    if (!localState || !localState.currentSlide) return;

    // 1. Đổi ảnh nền
    body.style.backgroundImage = `url('/images/${localState.currentSlide}')`;

    // 2. Phân phối Layout hiển thị vị trí đồng hồ dựa trên tên file ảnh nền
    body.className = ''; 
    if (localState.currentSlide.includes('1.1') || localState.currentSlide.includes('3.1')) {
        body.classList.add('pos-luot-1-1');
    } else if (localState.currentSlide.includes('1.2') || localState.currentSlide.includes('3.2')) {
        body.classList.add('pos-luot-1-2');
    } else if (localState.currentSlide.includes('2.1')) {
        body.classList.add('pos-luot-2-1');
    } else if (localState.currentSlide.includes('2.2')) {
        body.classList.add('pos-luot-2-2');
    } else {
        body.classList.add('pos-main'); 
    }

    const t1 = localState.timers.timer1;
    const t2 = localState.timers.timer2;

    // 3. Đổ số và chạy kim vòng tròn cho Đồng hồ 1
    textUngHo.innerText = formatTime(t1.time);
    circleUngHo.style.strokeDashoffset = t1.max > 0 ? circumference - (t1.time / t1.max) * circumference : 0;

    // 4. Đổ số và chạy kim vòng tròn cho Đồng hồ 2
    textPhanDoi.innerText = formatTime(t2.time);
    circlePhanDoi.style.strokeDashoffset = t2.max > 0 ? circumference - (t2.time / t2.max) * circumference : 0;
}

// Lắng nghe liên tục cập nhật từ Server
socket.on('updateState', (newState) => {
    localState = newState;
    updateUI();
});
