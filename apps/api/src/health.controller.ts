import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('/v1')
export class HealthController {
  @Get('/health')
  @AllowAnonymous()
  status(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
