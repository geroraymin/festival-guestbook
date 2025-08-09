const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 및 성능 미들웨어
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(compression());
app.use(cors());

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우터
app.use('/api', apiRouter);

// 정적 파일 서빙
app.use(express.static(path.join(__dirname)));

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'festival.html'));
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`📱 내부 네트워크 접속: http://localhost:${PORT}`);
    console.log(`🌐 외부 접속: http://[서버IP]:${PORT}`);
});

module.exports = app;
