const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll, dbRun } = require('../database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 미들웨어: JWT 토큰 검증
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 로그인 API
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await dbGet(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ error: '잘못된 사용자명 또는 비밀번호입니다.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, booth_id: user.booth_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                booth_id: user.booth_id
            }
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 부스 목록 조회
router.get('/booths', async (req, res) => {
    try {
        const booths = await dbAll('SELECT * FROM booths ORDER BY name');
        res.json(booths);
    } catch (error) {
        console.error('부스 목록 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 부스 추가 (관리자만)
router.post('/booths', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }

        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: '부스 이름을 입력해주세요.' });
        }

        const result = await dbRun(
            'INSERT INTO booths (name) VALUES (?)',
            [name.trim()]
        );

        const newBooth = await dbGet('SELECT * FROM booths WHERE id = ?', [result.id]);
        res.status(201).json(newBooth);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: '이미 존재하는 부스 이름입니다.' });
        } else {
            console.error('부스 추가 오류:', error);
            res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    }
});

// 부스 삭제 (관리자만)
router.delete('/booths/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }

        const { id } = req.params;
        const result = await dbRun('DELETE FROM booths WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: '부스를 찾을 수 없습니다.' });
        }

        res.json({ message: '부스가 삭제되었습니다.' });
    } catch (error) {
        console.error('부스 삭제 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 방명록 엔트리 추가
router.post('/guestbook', async (req, res) => {
    try {
        const { booth_id, name, gender, school_level, birth_date } = req.body;

        // 유효성 검사
        if (!booth_id || !name || !gender || !school_level || !birth_date) {
            return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
        }

        if (!['남성', '여성'].includes(gender)) {
            return res.status(400).json({ error: '올바른 성별을 선택해주세요.' });
        }

        if (!['초등', '중등', '고등', '기타'].includes(school_level)) {
            return res.status(400).json({ error: '올바른 교급을 선택해주세요.' });
        }

        // 생년월일 형식 검사 (YYYYMMDD)
        if (!/^\d{8}$/.test(birth_date)) {
            return res.status(400).json({ error: '생년월일을 YYYYMMDD 형식으로 입력해주세요.' });
        }

        const result = await dbRun(
            'INSERT INTO guestbook_entries (booth_id, name, gender, school_level, birth_date) VALUES (?, ?, ?, ?, ?)',
            [booth_id, name, gender, school_level, birth_date]
        );

        res.status(201).json({ 
            id: result.id, 
            message: '방명록이 성공적으로 저장되었습니다.' 
        });
    } catch (error) {
        console.error('방명록 저장 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 통계 조회 - 전체 (관리자)
router.get('/stats/all', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }

        const totalParticipants = await dbGet(
            'SELECT COUNT(*) as count FROM guestbook_entries'
        );

        const totalBooths = await dbGet(
            'SELECT COUNT(*) as count FROM booths'
        );

        const genderStats = await dbAll(
            'SELECT gender, COUNT(*) as count FROM guestbook_entries GROUP BY gender'
        );

        const schoolLevelStats = await dbAll(
            'SELECT school_level, COUNT(*) as count FROM guestbook_entries GROUP BY school_level'
        );

        const timelineStats = await dbAll(`
            SELECT 
                strftime('%H:00', created_at) as hour,
                COUNT(*) as count 
            FROM guestbook_entries 
            WHERE date(created_at) = date('now', 'localtime')
            GROUP BY strftime('%H', created_at)
            ORDER BY hour
        `);

        res.json({
            totalParticipants: totalParticipants.count,
            totalBooths: totalBooths.count,
            genderStats: genderStats.reduce((acc, item) => {
                acc[item.gender] = item.count;
                return acc;
            }, {}),
            schoolLevelStats: schoolLevelStats.reduce((acc, item) => {
                acc[item.school_level] = item.count;
                return acc;
            }, {}),
            timelineStats: timelineStats
        });
    } catch (error) {
        console.error('전체 통계 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 통계 조회 - 부스별
router.get('/stats/booth/:boothId', async (req, res) => {
    try {
        const { boothId } = req.params;

        const totalParticipants = await dbGet(
            'SELECT COUNT(*) as count FROM guestbook_entries WHERE booth_id = ?',
            [boothId]
        );

        const recentParticipants = await dbGet(
            `SELECT COUNT(*) as count FROM guestbook_entries 
             WHERE booth_id = ? AND created_at >= datetime('now', '-10 minutes')`,
            [boothId]
        );

        const genderStats = await dbAll(
            'SELECT gender, COUNT(*) as count FROM guestbook_entries WHERE booth_id = ? GROUP BY gender',
            [boothId]
        );

        const schoolLevelStats = await dbAll(
            'SELECT school_level, COUNT(*) as count FROM guestbook_entries WHERE booth_id = ? GROUP BY school_level',
            [boothId]
        );

        res.json({
            totalParticipants: totalParticipants.count,
            recentParticipants: recentParticipants.count,
            genderStats: genderStats.reduce((acc, item) => {
                acc[item.gender] = item.count;
                return acc;
            }, {}),
            schoolLevelStats: schoolLevelStats.reduce((acc, item) => {
                acc[item.school_level] = item.count;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('부스 통계 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
