import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { env, isProduction } from "../../config/env";

export function initializeSentry(app: any): void {
  if (!env.SENTRY_DSN) {
    console.warn("⚠️  Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 1.0,

    beforeSend(event, hint) {
      // Don't send operational errors to Sentry
      const error = hint.originalException;
      if (error && typeof error === "object" && "isOperational" in error) {
        if ((error as any).isOperational) {
          return null; // Don't send to Sentry
        }
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized");
}

export function getSentryHandlers() {
  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Only send non-operational errors
        if (error && typeof error === "object" && "isOperational" in error) {
          return !(error as any).isOperational;
        }
        return true;
      },
    }),
  };
}
