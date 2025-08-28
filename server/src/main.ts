import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS to allow frontend to connect
  app.enableCors();

  await app.listen(3000);
  console.log(`🚀 Backend application is running on: http://localhost:3000`);
}
bootstrap();