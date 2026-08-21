import { NestFactory } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/educacion');
  // Habilitar CORS si es necesario en local
  app.enableCors();
  // Puerto local distinto al de Express (8787)
  await app.listen(8788);
  console.log(`NestJS Educacion Service is running on: http://localhost:8788`);
}
bootstrap();
