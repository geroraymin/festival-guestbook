// API 호출 관련 함수들
class ApiService {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
    }

    // 인증 헤더 설정
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 에러 처리
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
            throw new Error(error.error || '서버 오류가 발생했습니다.');
        }
        return response.json();
    }

    // 로그인
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await this.handleResponse(response);
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            return data;
        } catch (error) {
            console.error('로그인 오류:', error);
            throw error;
        }
    }

    // 로그아웃
    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // 부스 목록 조회
    async getBooths() {
        try {
            const response = await fetch(`${this.baseURL}/booths`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('부스 목록 조회 오류:', error);
            throw error;
        }
    }

    // 부스 추가
    async createBooth(name) {
        try {
            const response = await fetch(`${this.baseURL}/booths`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ name })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('부스 추가 오류:', error);
            throw error;
        }
    }

    // 부스 삭제
    async deleteBooth(id) {
        try {
            const response = await fetch(`${this.baseURL}/booths/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('부스 삭제 오류:', error);
            throw error;
        }
    }

    // 방명록 추가
    async createGuestbookEntry(data) {
        try {
            const response = await fetch(`${this.baseURL}/guestbook`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('방명록 저장 오류:', error);
            throw error;
        }
    }

    // 전체 통계 조회 (관리자)
    async getAllStats() {
        try {
            const response = await fetch(`${this.baseURL}/stats/all`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('전체 통계 조회 오류:', error);
            throw error;
        }
    }

    // 부스별 통계 조회
    async getBoothStats(boothId) {
        try {
            const response = await fetch(`${this.baseURL}/stats/booth/${boothId}`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('부스 통계 조회 오류:', error);
            throw error;
        }
    }
}

// 전역 API 서비스 인스턴스
const apiService = new ApiService();
