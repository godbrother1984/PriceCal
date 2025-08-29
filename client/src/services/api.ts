// path: client/src/services/api.ts
// version: 1.0
// last-modified: 29 สิงหาคม 2568 13:55

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

/*
  3. (เตรียมสำหรับอนาคต) เราสามารถเพิ่ม Interceptor ตรงนี้ได้
  เพื่อจัดการกับ Token สำหรับยืนยันตัวตนโดยอัตโนมัติในทุกๆ Request
  ไม่ต้องไปเขียนโค้ดเพิ่มในทุกหน้า
*/
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default api;
