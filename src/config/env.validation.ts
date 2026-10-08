import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  FRONTEND_URL: Joi.string()
    .uri({
      scheme: ['http', 'https'],
    })
    .required(),

  // Wompi
  WOMPI_API_URL: Joi.string()
    .uri()
    .required(),

  WOMPI_PUBLIC_KEY: Joi.string()
    .required(),

  WOMPI_PRIVATE_KEY: Joi.string()
    .required(),

  WOMPI_EVENTS_SECRET: Joi.string()
    .required(),

  WOMPI_INTEGRITY_SECRET: Joi.string()
    .required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required(),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required(),

  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .default('15m'),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d'),
});