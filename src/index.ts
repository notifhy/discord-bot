import 'dotenv/config';
import '@sentry/tracing';
import '@sapphire/plugin-logger/register';
import process from 'node:process';
import { ExtraErrorData } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import { ErrorHandler } from './errors/ErrorHandler';
import { Client } from './structures/Client';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    integrations: [new ExtraErrorData()],
    tracesSampleRate: 1.0,
});

process.on('unhandledRejection', (error) => {
    new ErrorHandler(
        error,
        'unhandledRejection',
    ).init('fatal');

    process.exit(1);
});

process.on('uncaughtException', (error) => {
    new ErrorHandler(
        error,
        'uncaughtException',
    ).init('fatal');

    process.exit(1);
});

new Client().init();