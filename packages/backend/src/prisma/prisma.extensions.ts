import { softDeleteModels } from '@/prisma/soft-deletions';
import { PrismaClient } from '@prisma/client';
import { createPaginator } from 'prisma-extension-pagination';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';

const paginate = createPaginator();

export const createCustomPrismaClient = (
  prismaClient: PrismaClient,
  userId?: string,
  organizationId?: string,
) => {
  return prismaClient
    .$extends({
      query: {
        $allModels: {
          async $allOperations({ args, operation, query }) {
            // add configs for write operations only
            if (
              [
                'create',
                'update',
                'upsert',
                'createMany',
                'updateMany',
                'delete',
                'deleteMany',
              ].includes(operation)
            ) {
              return await prismaClient.$transaction(async (tx) => {
                await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, TRUE)`;
                await tx.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, TRUE)`;
                return query(args);
              });
            }

            return query(args);
          },
        },
      },
      model: {},
    })
    .$extends(
      createSoftDeleteExtension({
        models: {
          ...softDeleteModels,
        },
        defaultConfig: {
          field: 'deletedAt',
          allowToOneUpdates: true,
          createValue: (deleted) => {
            if (deleted) return new Date();
            return null;
          },
        },
      }),
    );
};
