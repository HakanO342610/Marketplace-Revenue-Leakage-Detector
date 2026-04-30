import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser, OrgRole } from '../types/auth-user';

function asRole(role: string): OrgRole {
  if (role === 'admin' || role === 'member' || role === 'viewer') {
    return role;
  }
  return 'member';
}

@Injectable()
export class OrgContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const headerVal = req.headers['x-org-id'];
    const requestedOrgId = Array.isArray(headerVal) ? headerVal[0] : headerVal;

    if (requestedOrgId && requestedOrgId.length > 0) {
      const m = await this.prisma.membership.findUnique({
        where: { userId_orgId: { userId: user.id, orgId: requestedOrgId } },
      });
      if (!m) {
        throw new ForbiddenException('not a member of the requested org');
      }
      user.orgId = requestedOrgId;
      user.orgRole = asRole(m.role);
      return true;
    }

    const fallback = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!fallback) {
      throw new ForbiddenException('user has no organization');
    }
    user.orgId = fallback.orgId;
    user.orgRole = asRole(fallback.role);
    return true;
  }
}
