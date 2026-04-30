import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateOrgDto } from './dto/create-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  MemberDto,
  OrgListItem,
  OrgsService,
} from './orgs.service';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  @Get()
  list(
    @Req() req: Request & { user: AuthUser },
  ): Promise<OrgListItem[]> {
    return this.orgs.listMyOrgs(req.user.id);
  }

  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreateOrgDto,
  ): Promise<OrgListItem> {
    return this.orgs.createOrg(req.user.id, dto.name);
  }

  @Get(':orgId/members')
  members(
    @Req() req: Request & { user: AuthUser },
    @Param('orgId') orgId: string,
  ): Promise<MemberDto[]> {
    return this.orgs.listMembers(orgId, req.user.id);
  }

  @Post(':orgId/members')
  invite(
    @Req() req: Request & { user: AuthUser },
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<MemberDto> {
    return this.orgs.inviteMember(orgId, req.user.id, dto.email, dto.role);
  }

  @Patch(':orgId/members/:userId')
  updateRole(
    @Req() req: Request & { user: AuthUser },
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<MemberDto> {
    return this.orgs.updateRole(orgId, req.user.id, userId, dto.role);
  }

  @Delete(':orgId/members/:userId')
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ): Promise<{ removed: true }> {
    return this.orgs.removeMember(orgId, req.user.id, userId);
  }
}
