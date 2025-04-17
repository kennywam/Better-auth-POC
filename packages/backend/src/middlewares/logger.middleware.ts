import { Injectable, NestMiddleware } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
@ApiBearerAuth('access-token')
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    next();
  }
}
