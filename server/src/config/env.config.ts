// path: server/src/config/env.config.ts
// version: 1.0 (Centralized Environment Configuration)
// last-modified: 28 ตุลาคม 2568 18:10

/**
 * Centralized Environment Configuration for Backend
 * แก้ไขที่ไฟล์นี้ที่เดียวแล้วจบ - ไม่ต้องแก้ไข main.ts
 */

export const ENV_CONFIG = {
  // ✅ Server Configuration (แก้ที่นี่ที่เดียว)
  SERVER_PORT: 3001,

  // Database Configuration
  DATABASE: {
    TYPE: 'sqlite',
    DATABASE_PATH: 'database.sqlite',
  },

  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'fg-pricing-secret-key-2024',
    EXPIRES_IN: '24h',
  },

  // CORS Configuration
  CORS: {
    ENABLED: true,
    ORIGIN: '*', // Allow all origins in development
  },

  // Logging
  LOGGING: {
    ENABLED: true,
    LEVEL: 'debug',
  },
};

// Helper function to validate configuration
export function validateConfig() {
  if (!ENV_CONFIG.SERVER_PORT) {
    throw new Error('SERVER_PORT is not configured');
  }

  console.log('✅ Environment configuration loaded successfully');
  console.log(`📡 Server Port: ${ENV_CONFIG.SERVER_PORT}`);
  console.log(`🗄️  Database: ${ENV_CONFIG.DATABASE.TYPE}`);
  console.log(`🔐 JWT Expiration: ${ENV_CONFIG.JWT.EXPIRES_IN}`);
}
