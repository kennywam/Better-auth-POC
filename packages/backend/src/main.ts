import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import {
  BadRequestException,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { BearerTokenName, OrganizationIdHeaderName } from './common/constants';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import multiPart from '@fastify/multipart';
import compression from '@fastify/compress';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 1024 * 1024 * 1024 * 10, // 10 GB
    }),
    {
      bufferLogs: true,
    },
  );
  // configure logger
  app.useLogger(app.get(Logger));
  await app.register(multiPart);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // strip away properties that do not have any decorators
      exceptionFactory: (errors) => {
        const result = errors.map((error) => {
          if (error.constraints) {
            return {
              field: error.property,
              constraints: error.constraints,
            };
          } else {
            return error;
          }
        });
        return new BadRequestException(result);
      },
      stopAtFirstError: true,
    }),
  );

  // enable compression
  await app.register(compression, {
    encodings: ['gzip', 'deflate'],
  });

  // use ClassSerializerInterceptor to transform response objects
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // pino error interceptor
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Better Auth POC')
    .setDescription('Better Auth POC API')
    .setVersion('1.0')
    .addTag('Better Auth')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      BearerTokenName,
    )
    .addGlobalParameters({
      name: OrganizationIdHeaderName,
      description: 'Organization ID',
      in: 'header',
    })
    .addSecurityRequirements(BearerTokenName)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  if (process.send) {
    process.send('ready');
  }

  process.on('SIGINT', function () {
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  });
}
bootstrap();
