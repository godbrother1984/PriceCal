// path: server/src/main.ts
// version: 3.0 (Add dotenv configuration)
// last-modified: 14 ตุลาคม 2568 15:50

// ⚠️ IMPORTANT: Load .env BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow frontend to connect
  app.enableCors();

  await app.listen(3000);
  console.log(`🚀 Backend application is running on: http://localhost:3000`);
  console.log(`📊 Database: SQLite (database.sqlite)`);
  console.log(`👤 Default admin user: admin/admin`);
}
bootstrap();