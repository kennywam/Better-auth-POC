import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getRoot(@Res() reply: FastifyReply) {
    return reply.send({
      status: 'success',
      message: 'Better Auth POC API is running',
      documentation: '/api',
      timestamp: new Date().toISOString()
    });
  }
}
