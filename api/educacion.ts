import { NestFactory } from '@nestjs/common';
import { AppModule } from '../server-educacion/src/app.module';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/educacion');
    // Cors settings for Vercel
    app.enableCors();
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  return app(req, res);
}
