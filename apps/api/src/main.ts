import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ensureEnvironment } from './config.js';

async function bootstrap(): Promise<void> {
  ensureEnvironment();
  // Better Auth needs the original body; the adapter restores parsers for other endpoints.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableShutdownHooks();
  app.enableCors({
    origin: process.env.WEB_ORIGIN!,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
  });
  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0');
}

void bootstrap();
