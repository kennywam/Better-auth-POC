import { ClsStore } from 'nestjs-cls';

export interface AppClsStore extends ClsStore {
  userId?: string;
  organizationId?: string;
}
