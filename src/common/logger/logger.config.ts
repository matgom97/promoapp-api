import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const logDirectory = 'logs';

const applicationTransport = new winston.transports.DailyRotateFile({
  dirname: logDirectory,
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
});

const errorTransport = new winston.transports.DailyRotateFile({
  dirname: logDirectory,
  filename: 'errors-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),

  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        utilities.format.nestLike('PromoApp', {
          prettyPrint: true,
        }),
      ),
    }),

    applicationTransport,
    errorTransport,
  ],
});