import { IsEmail, IsIn } from 'class-validator';

export type OrgRole = 'admin' | 'member' | 'viewer';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['admin', 'member', 'viewer'])
  role!: OrgRole;
}
