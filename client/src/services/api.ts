// path: client/src/services/api.ts
// version: 5.0 (Add Customer Group Override API Methods - Phase 2)
// last-modified: 29 ตุลาคม 2568 17:45

import axios from 'axios';
import { API_CONFIG, APP_CONFIG } from '../config/env';

// ✅ ใช้ BASE_URL จาก centralized config (แก้ที่ไฟล์ config ที่เดียวแล้วจบ)
const API_BASE_URL = API_CONFIG.BASE_URL;

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
    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
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
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);

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

// ========================================
// 🆕 Version Control API Methods (Phase 1)
// ========================================

/**
 * Version History - Get version history for a specific record
 */
export const getVersionHistory = async (dataType: string, recordId: string) => {
  const endpoints: Record<string, string> = {
    fabCost: '/api/data/fab-costs',
    standardPrice: '/api/data/standard-prices',
    sellingFactor: '/api/data/selling-factors',
    scrapAllowance: '/api/data/scrap-allowances',
    lme: '/api/data/lme-master-data',
    exchangeRate: '/api/data/exchange-rate-master-data',
  };

  const endpoint = endpoints[dataType];
  if (!endpoint) {
    throw new Error(`Unknown data type: ${dataType}`);
  }

  const response = await api.get(`${endpoint}/history/${recordId}`);
  return response.data;
};

/**
 * Approve - Approve a Draft version (change status from Draft → Active)
 */
export const approveVersion = async (dataType: string, recordId: string, username: string = 'admin') => {
  const endpoints: Record<string, string> = {
    fabCost: '/api/data/fab-costs',
    standardPrice: '/api/data/standard-prices',
    sellingFactor: '/api/data/selling-factors',
    scrapAllowance: '/api/data/scrap-allowances',
    lme: '/api/data/lme-master-data',
    exchangeRate: '/api/data/exchange-rate-master-data',
  };

  const endpoint = endpoints[dataType];
  if (!endpoint) {
    throw new Error(`Unknown data type: ${dataType}`);
  }

  const response = await api.put(`${endpoint}/${recordId}/approve`, { username });
  return response.data;
};

/**
 * Rollback - Rollback from Archived version (create new Draft from Archived)
 */
export const rollbackVersion = async (dataType: string, recordId: string, username: string = 'admin') => {
  const endpoints: Record<string, string> = {
    fabCost: '/api/data/fab-costs',
    standardPrice: '/api/data/standard-prices',
    sellingFactor: '/api/data/selling-factors',
    scrapAllowance: '/api/data/scrap-allowances',
    lme: '/api/data/lme-master-data',
    exchangeRate: '/api/data/exchange-rate-master-data',
  };

  const endpoint = endpoints[dataType];
  if (!endpoint) {
    throw new Error(`Unknown data type: ${dataType}`);
  }

  const response = await api.put(`${endpoint}/${recordId}/rollback`, { username });
  return response.data;
};

/**
 * Archive - Manually archive an Active version (for admin use)
 */
export const archiveVersion = async (dataType: string, recordId: string, username: string = 'admin') => {
  const endpoints: Record<string, string> = {
    fabCost: '/api/data/fab-costs',
    standardPrice: '/api/data/standard-prices',
    sellingFactor: '/api/data/selling-factors',
    lme: '/api/data/lme-master-data',
    exchangeRate: '/api/data/exchange-rate-master-data',
  };

  const endpoint = endpoints[dataType];
  if (!endpoint) {
    throw new Error(`Unknown data type: ${dataType}`);
  }

  const response = await api.put(`${endpoint}/archive/${recordId}`, { username });
  return response.data;
};

// ========================================
// 🆕 Customer Group Override API Methods (Phase 2)
// ========================================

/**
 * Customer Group CRUD
 */
export const customerGroupsAPI = {
  // ดึงรายการ Customer Groups ทั้งหมด
  getAll: async () => {
    const response = await api.get('/customer-groups');
    return response.data;
  },

  // ดึง Customer Group ตาม ID
  getById: async (id: string) => {
    const response = await api.get(`/customer-groups/${id}`);
    return response.data;
  },

  // สร้าง Customer Group ใหม่
  create: async (data: any) => {
    const response = await api.post('/customer-groups', data);
    return response.data;
  },

  // อัปเดต Customer Group
  update: async (id: string, data: any) => {
    const response = await api.put(`/customer-groups/${id}`, data);
    return response.data;
  },

  // ลบ Customer Group
  delete: async (id: string) => {
    const response = await api.delete(`/customer-groups/${id}`);
    return response.data;
  },
};

/**
 * Customer Mapping API
 */
export const customerMappingAPI = {
  // ดึงลูกค้าในกลุ่ม
  getCustomersByGroup: async (groupId: string) => {
    const response = await api.get(`/customer-groups/${groupId}/customers`);
    return response.data;
  },

  // เพิ่มลูกค้าเข้ากลุ่ม
  addCustomerToGroup: async (groupId: string, customerId: string) => {
    const response = await api.post(`/customer-groups/${groupId}/customers`, { customerId });
    return response.data;
  },

  // ลบลูกค้าออกจากกลุ่ม
  removeCustomerFromGroup: async (groupId: string, customerId: string) => {
    const response = await api.delete(`/customer-groups/${groupId}/customers/${customerId}`);
    return response.data;
  },
};

/**
 * Override Management API (Generic for all 5 types)
 * Types: 'fab-cost' | 'selling-factor' | 'lme-price' | 'exchange-rate' | 'standard-price'
 */
export const overrideAPI = {
  // ดึง Overrides ทั้งหมดของกลุ่ม (ตามประเภท)
  getAll: async (groupId: string, type: string) => {
    const response = await api.get(`/customer-groups/${groupId}/overrides/${type}`);
    return response.data;
  },

  // ดึง Override ตาม ID
  getById: async (groupId: string, type: string, overrideId: string) => {
    const response = await api.get(`/customer-groups/${groupId}/overrides/${type}/${overrideId}`);
    return response.data;
  },

  // สร้าง Override ใหม่ (Draft)
  create: async (groupId: string, type: string, data: any) => {
    const response = await api.post(`/customer-groups/${groupId}/overrides/${type}`, data);
    return response.data;
  },

  // อัปเดต Override (Draft only)
  update: async (groupId: string, type: string, overrideId: string, data: any) => {
    const response = await api.put(`/customer-groups/${groupId}/overrides/${type}/${overrideId}`, data);
    return response.data;
  },

  // อนุมัติ Override (Draft → Active + Archive เก่า)
  approve: async (groupId: string, type: string, overrideId: string) => {
    const response = await api.put(`/customer-groups/${groupId}/overrides/${type}/${overrideId}/approve`);
    return response.data;
  },

  // ลบ Override (Draft only)
  delete: async (groupId: string, type: string, overrideId: string) => {
    const response = await api.delete(`/customer-groups/${groupId}/overrides/${type}/${overrideId}`);
    return response.data;
  },
};

// Export both default and named exports
export { api };
export default api;
