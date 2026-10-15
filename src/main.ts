import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { loggerConfig } from './common/logger/logger.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {

    logger: loggerConfig,

  });

  const configService =
    app.get(ConfigService);

  app.use(cookieParser());

  app.use(helmet());

  app.enableCors({
    origin:
      configService.getOrThrow<string>(
        'FRONTEND_URL',
      ),
    methods: [
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  const swaggerConfig =
    new DocumentBuilder()
      .setTitle('PromoApp API')
      .setDescription(
        'API REST para la plataforma PromoApp',
      )
      .setVersion('1.0')
      .build();

  const swaggerDocument =
    SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

  SwaggerModule.setup(
    'api/docs',
    app,
    swaggerDocument,
  );

  await app.listen(
    configService.get<number>(
      'PORT',
      3000,
    ),
  );
}

await bootstrap();