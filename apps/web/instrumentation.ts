/**
 * Sentry initialisation.
 *
 * Deliberately no-ops when SENTRY_DSN is unset, so local development and CI do
 * not need an account. Errors in a payment path are still thrown and still fail
 * the request — Sentry is a record, never a substitute for failing closed
 * (docs/RULES.md §5).
 */
import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV ?? 'local',
    // Money paths are low volume and high value: sample everything.
    tracesSampleRate: 1.0,
    // Provider payloads and admin sessions pass through this app. Never let
    // request bodies, cookies, or headers be collected automatically.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
      }
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
