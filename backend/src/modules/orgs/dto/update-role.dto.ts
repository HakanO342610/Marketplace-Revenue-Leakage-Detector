import { IsIn } from 'class-validator';
import type { OrgRole } from './invite-member.dto';

export class UpdateRoleDto {
  @IsIn(['admin', 'member', 'viewer'])
  role!: OrgRole;
}
