// path: client/src/config/env.ts
// version: 1.0 (Centralized Environment Configuration)
// last-modified: 28 ตุลาคม 2568 18:10

/**
 * Centralized Environment Configuration
 * แก้ไขที่ไฟล์นี้ที่เดียวแล้วจบ - ไม่ต้องแก้ไขทุกไฟล์
 */

// ✅ Backend API Configuration
export const API_CONFIG = {
  // พอร์ตของ Backend Server (แก้ที่นี่ที่เดียว)
  PORT: 3001,

  // Base URL (สร้างอัตโนมัติจาก PORT)
  get BASE_URL() {
    return `http://localhost:${this.PORT}`;
  },

  // API Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',

    // Setup
    SETUP_STATUS: '/setup/status',
    SETUP_INITIALIZE: '/setup/initialize',

    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    DASHBOARD_TASKS: '/dashboard/my-tasks',
    DASHBOARD_ACTIVITY: '/dashboard/recent-activity',

    // Data
    REQUESTS: '/api/data/requests',
    CUSTOMERS: '/api/data/customers',
    PRODUCTS: '/api/data/products',
    MASTER_DATA: '/api/data',
  },

  // Helper function to get full URL
  getUrl(endpoint: string): string {
    return `${this.BASE_URL}${endpoint}`;
  },
};

// ✅ Frontend Configuration
export const APP_CONFIG = {
  // Session Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    IS_AUTHENTICATED: 'isAuthenticated',
    SETUP_COMPLETE: 'setupComplete',
  },

  // Request Timeout (milliseconds)
  REQUEST_TIMEOUT: 30000,

  // Retry Configuration
  MAX_RETRIES: 3,
};

// ✅ Development Mode Check
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

console.log('[Config] Backend API:', API_CONFIG.BASE_URL);
console.log('[Config] Environment:', IS_DEV ? 'Development' : 'Production');
