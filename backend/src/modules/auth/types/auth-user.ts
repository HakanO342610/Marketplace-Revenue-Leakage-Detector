export type OrgRole = 'admin' | 'member' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  orgId?: string;
  orgRole?: OrgRole;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}
