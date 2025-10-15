// path: client/src/services/api.ts
// version: 2.0 (Enable JWT Authentication Interceptor)
// last-modified: 14 ตุลาคม 2568 16:15

import axios from 'axios';

// 1. กำหนด Base URL ของ Backend ที่นี่ที่เดียว
const API_BASE_URL = 'http://localhost:3000';

// 2. สร้าง instance ของ axios พร้อมตั้งค่าพื้นฐาน
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. ✅ เปิดใช้งาน Interceptor เพื่อแนบ JWT token ในทุก request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Attaching JWT token to request:', config.url);
    } else {
      console.warn('[API] No JWT token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. ✅ เพิ่ม Response Interceptor เพื่อจัดการ 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized - Token expired or invalid');

      // ลบ token และ auth state
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('isAuthenticated');

      // แสดงข้อความแจ้งเตือน (optional)
      if (!window.location.pathname.includes('/login')) {
        console.warn('[API] Session expired. Redirecting to login...');
      }

      // Reload หน้าเพื่อกลับไปหน้า Login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
