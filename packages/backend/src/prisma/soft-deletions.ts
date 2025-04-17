import { Prisma } from '@prisma/client';
import { ModelConfig } from 'prisma-extension-soft-delete';

export const softDeleteModels: Partial<
  Record<Prisma.ModelName, boolean | ModelConfig>
> = {};
