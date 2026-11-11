import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.js';
import { ApiController } from './api.controller.js';
import { AgentService } from './agent.service.js';
import { WorkspacesService } from './workspaces.service.js';

@Module({
  imports: [AuthModule.forRoot({ auth })],
  controllers: [ApiController],
  providers: [AgentService, WorkspacesService],
})
export class AppModule {}
