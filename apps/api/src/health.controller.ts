import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { pool } from './auth.js';
import { verifyMailTransport } from './mail.js';

@Controller('/v1')
export class HealthController {
  @Get('/health')
  @AllowAnonymous()
  status(): { status: 'ok' } {
    // Liveness: this process is running. No dependency checks by design.
    return { status: 'ok' };
  }

  @Get('/ready')
  @AllowAnonymous()
  async readiness(): Promise<{ status: 'ready' }> {
    // Readiness is deliberately strict: a signup requires both DB and SMTP.
    // Do not expose connection details or credentials in HTTP responses.
    const settled = await Promise.allSettled([
      pool.query('SELECT 1'),
      verifyMailTransport()
    ]);
    if (settled.some(result => result.status === 'rejected')) {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    return { status: 'ready' };
  }
}
