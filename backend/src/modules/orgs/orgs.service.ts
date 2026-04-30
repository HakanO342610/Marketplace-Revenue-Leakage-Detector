import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { OrgRole } from './dto/invite-member.dto';

export interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
  createdAt: Date;
  memberCount: number;
}

export interface OrgLite {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
}

export interface MemberDto {
  userId: string;
  email: string;
  name: string | null;
  role: OrgRole;
  createdAt: Date;
}

const SLUG_RETRIES = 5;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'org';
}

function asRole(role: string): OrgRole {
  if (role === 'admin' || role === 'member' || role === 'viewer') {
    return role;
  }
  return 'member';
}

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyOrgs(userId: string): Promise<OrgListItem[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        org: {
          include: {
            _count: { select: { memberships: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: asRole(m.role),
      createdAt: m.org.createdAt,
      memberCount: m.org._count.memberships,
    }));
  }

  async listMyOrgsLite(userId: string): Promise<OrgLite[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { org: true },
    });
    return memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: asRole(m.role),
    }));
  }

  async createOrg(userId: string, name: string): Promise<OrgListItem> {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      throw new BadRequestException('name must be 2-80 chars');
    }

    const base = slugify(trimmed);

    let lastErr: unknown = null;
    for (let i = 0; i < SLUG_RETRIES; i++) {
      const suffix = randomBytes(3).toString('hex');
      const slug = `${base}-${suffix}`;
      try {
        const org = await this.prisma.organization.create({
          data: {
            name: trimmed,
            slug,
            memberships: {
              create: { userId, role: 'admin' },
            },
          },
          include: {
            _count: { select: { memberships: true } },
          },
        });
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: 'admin',
          createdAt: org.createdAt,
          memberCount: org._count.memberships,
        };
      } catch (e) {
        lastErr = e;
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue;
        }
        throw e;
      }
    }
    throw new BadRequestException(
      `could not allocate unique slug${lastErr ? '' : ''}`,
    );
  }

  async createPersonalOrgForUser(
    userId: string,
    displayName: string,
  ): Promise<OrgLite> {
    const item = await this.createOrg(userId, displayName);
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      role: 'admin',
    };
  }

  async listMembers(orgId: string, userId: string): Promise<MemberDto[]> {
    await this.requireMember(orgId, userId);
    const rows = await this.prisma.membership.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return rows.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: asRole(m.role),
      createdAt: m.createdAt,
    }));
  }

  async inviteMember(
    orgId: string,
    actorId: string,
    email: string,
    role: OrgRole,
  ): Promise<MemberDto> {
    await this.requireAdmin(orgId, actorId);

    const lower = email.toLowerCase();
    const target = await this.prisma.user.findFirst({
      where: { email: { equals: lower, mode: 'insensitive' } },
      select: { id: true, email: true, name: true },
    });
    if (!target) {
      throw new NotFoundException('user not registered');
    }

    const existing = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: target.id, orgId } },
    });
    if (existing) {
      throw new BadRequestException('user is already a member');
    }

    const created = await this.prisma.membership.create({
      data: { userId: target.id, orgId, role },
    });
    return {
      userId: target.id,
      email: target.email,
      name: target.name,
      role: asRole(created.role),
      createdAt: created.createdAt,
    };
  }

  async updateRole(
    orgId: string,
    actorId: string,
    targetUserId: string,
    role: OrgRole,
  ): Promise<MemberDto> {
    await this.requireAdmin(orgId, actorId);

    const current = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: targetUserId, orgId } },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!current) {
      throw new NotFoundException('member not found');
    }

    if (current.role === 'admin' && role !== 'admin') {
      const adminCount = await this.prisma.membership.count({
        where: { orgId, role: 'admin' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'cannot demote the last admin of the org',
        );
      }
    }

    const updated = await this.prisma.membership.update({
      where: { userId_orgId: { userId: targetUserId, orgId } },
      data: { role },
    });
    return {
      userId: current.user.id,
      email: current.user.email,
      name: current.user.name,
      role: asRole(updated.role),
      createdAt: updated.createdAt,
    };
  }

  async removeMember(
    orgId: string,
    actorId: string,
    targetUserId: string,
  ): Promise<{ removed: true }> {
    await this.requireAdmin(orgId, actorId);

    const current = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
    if (!current) {
      throw new NotFoundException('member not found');
    }

    if (current.role === 'admin') {
      const adminCount = await this.prisma.membership.count({
        where: { orgId, role: 'admin' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'cannot remove the last admin of the org',
        );
      }
    }

    await this.prisma.membership.delete({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
    return { removed: true };
  }

  async requireAdmin(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!m) {
      throw new ForbiddenException('not a member of this org');
    }
    if (m.role !== 'admin') {
      throw new ForbiddenException('admin role required');
    }
  }

  async requireMember(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!m) {
      throw new ForbiddenException('not a member of this org');
    }
  }
}
