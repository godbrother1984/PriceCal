// path: server/src/main.ts
// version: 2.0 (Database Integration)
// last-modified: 22 กันยายน 2568 10:45

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow frontend to connect
  app.enableCors();

  await app.listen(3001);
  console.log(`🚀 Backend application is running on: http://localhost:3001`);
  console.log(`📊 Database: SQLite (database.sqlite)`);
  console.log(`👤 Default admin user: admin/admin`);
}
bootstrap();