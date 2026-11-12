import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [AuthModule.forRoot({
    auth,
    bodyParser: {
      json: { limit: '24kb' },
      urlencoded: { extended: false, limit: '24kb' }
    }
  })],
  controllers: [HealthController]
})
export class AppModule {}
