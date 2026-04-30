import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, OrgRole } from './types/auth-user';

const BCRYPT_ROUNDS = 10;
const SLUG_RETRIES = 5;

export interface AuthOrgLite {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
}

export interface AuthResponse {
  user: { id: string; email: string; name: string | null };
  access_token: string;
  orgs: AuthOrgLite[];
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org'
  );
}

function asRole(role: string): OrgRole {
  if (role === 'admin' || role === 'member' || role === 'viewer') {
    return role;
  }
  return 'member';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name: name ?? null },
      select: { id: true, email: true, name: true },
    });

    const orgName = name?.trim()
      ? `${name.trim()}'s workspace`
      : `${email.split('@')[0]}'s workspace`;
    const personalOrg = await this.createPersonalOrg(user.id, orgName);

    const access_token = await this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    return {
      user,
      access_token,
      orgs: [personalOrg],
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { org: true },
    });
    const orgs: AuthOrgLite[] = memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: asRole(m.role),
    }));

    const access_token = await this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    return {
      user: { id: user.id, email: user.email, name: user.name },
      access_token,
      orgs,
    };
  }

  async signToken(user: AuthUser): Promise<string> {
    const secret = this.config.get<string>('JWT_SECRET');
    const expiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '7d') as unknown as number;
    return this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret, expiresIn },
    );
  }

  private async createPersonalOrg(
    userId: string,
    name: string,
  ): Promise<AuthOrgLite> {
    const trimmed = name.trim().slice(0, 80) || 'workspace';
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
        });
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: 'admin',
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
    throw lastErr instanceof Error
      ? lastErr
      : new Error('failed to create personal org');
  }
}
