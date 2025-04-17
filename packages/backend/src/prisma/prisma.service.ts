import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { AppClsStore } from '../common/interfaces/app-cls-store';
import { createCustomPrismaClient } from '@/prisma/prisma.extensions';

type CustomPrismaClient = ReturnType<typeof createCustomPrismaClient>;

@Injectable()
export class PrismaService extends PrismaClient {
  customPrismaClient: CustomPrismaClient;

  constructor(private readonly clsService: ClsService<AppClsStore>) {
    super({
      transactionOptions: {
        timeout: 300_000, // 5 minutes
        maxWait: 300_000, // 5 minutes
      },
    });
  }

  get client() {
    const userId = this.clsService.get('userId');
    const organizationId = this.clsService.get('organizationId');

    if (!this.customPrismaClient) this.customPrismaClient = createCustomPrismaClient(this, userId, organizationId);

    return this.customPrismaClient;
  }
}
