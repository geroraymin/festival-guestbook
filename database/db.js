const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'festival.db');

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        initializeDatabase();
    }
});

// 데이터베이스 초기화
function initializeDatabase() {
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    db.exec(initSql, (err) => {
        if (err) {
            console.error('데이터베이스 초기화 실패:', err.message);
        } else {
            console.log('데이터베이스가 초기화되었습니다.');
        }
    });
}

// Promise 래퍼 함수들
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

module.exports = {
    db,
    dbGet,
    dbAll,
    dbRun
};
