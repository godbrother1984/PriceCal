// path: server/src/main.ts
// version: 4.0 (Use centralized ENV_CONFIG)
// last-modified: 28 ตุลาคม 2568 18:10

// ⚠️ IMPORTANT: Load .env BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV_CONFIG, validateConfig } from './config/env.config';

async function bootstrap() {
  // Validate configuration
  validateConfig();

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  if (ENV_CONFIG.CORS.ENABLED) {
    app.enableCors({
      origin: ENV_CONFIG.CORS.ORIGIN,
    });
  }

  // ✅ ใช้ PORT จาก ENV_CONFIG (แก้ที่ไฟล์ config ที่เดียวแล้วจบ)
  await app.listen(ENV_CONFIG.SERVER_PORT);

  console.log(`🚀 Backend application is running on: http://localhost:${ENV_CONFIG.SERVER_PORT}`);
  console.log(`📊 Database: ${ENV_CONFIG.DATABASE.TYPE} (${ENV_CONFIG.DATABASE.DATABASE_PATH})`);
  console.log(`👤 Default admin user: admin/admin`);
}
bootstrap();
