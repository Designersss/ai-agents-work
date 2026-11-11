import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { AllowAnonymous, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { WorkspacesService } from './workspaces.service.js';
import { AgentService } from './agent.service.js';

@Controller('v1')
export class ApiController {
  constructor(
    @Inject(WorkspacesService) private readonly workspaces: WorkspacesService,
    @Inject(AgentService) private readonly agent: AgentService,
  ) {}
  @Get('health')
  @AllowAnonymous()
  health() { return { ok: true, service: 'aimock-spike' }; }

  @Get('workspaces')
  list(@Session() session: UserSession) { return this.workspaces.list(session.user.id); }

  @Post('workspaces')
  create(@Session() session: UserSession, @Body() body: unknown) {
    const name = body && typeof body === 'object' && 'name' in body ? body.name : undefined;
    return this.workspaces.create(session.user.id, name);
  }

  @Post('agent/ask')
  ask(@Session() session: UserSession, @Body() body: unknown) {
    return this.agent.ask(session.user.id, body);
  }
}
