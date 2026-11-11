import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { workspaces, members, wallets } from './db/schema.js';

@Injectable()
export class WorkspacesService {
  async create(userId: string, value: unknown) {
    if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 80)
      throw new BadRequestException('Workspace name must contain 2–80 characters');
    return db.transaction(async tx => {
      const [workspace] = await tx.insert(workspaces).values({ name: value.trim(), createdBy: userId }).returning();
      if (!workspace) throw new Error('Workspace insert failed');
      await tx.insert(members).values({ workspaceId: workspace.id, userId, role: 'owner' });
      await tx.insert(wallets).values({ workspaceId: workspace.id, availableKopecks: 0, reservedKopecks: 0 });
      return { id: workspace.id, name: workspace.name, availableKopecks: 0, reservedKopecks: 0 };
    });
  }
  async list(userId: string) {
    return db.select({
      id: workspaces.id, name: workspaces.name, role: members.role,
      availableKopecks: wallets.availableKopecks, reservedKopecks: wallets.reservedKopecks,
    }).from(members)
      .innerJoin(workspaces, eq(workspaces.id, members.workspaceId))
      .innerJoin(wallets, eq(wallets.workspaceId, workspaces.id))
      .where(eq(members.userId, userId));
  }
  async assertMember(userId: string, workspaceId: string) {
    const [member] = await db.select({ userId: members.userId }).from(members)
      .where(and(eq(members.userId, userId), eq(members.workspaceId, workspaceId))).limit(1);
    if (!member) throw new ForbiddenException('Workspace access denied');
  }
}
