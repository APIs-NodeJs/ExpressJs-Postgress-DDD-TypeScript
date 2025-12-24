import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env, isProduction } from "../../config/env";
import { Logger } from "../../shared/infrastructure/logger/logger";
import { Application } from "express";

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry(app: Application): void {
  // Skip if Sentry DSN is not configured
  if (!env.SENTRY_DSN) {
    Logger.warn(
      "⚠️  Sentry DSN not configured. Error tracking is disabled."
    );
    return;
  }

  try {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      
      // Integrations
      integrations: [
        // HTTP integration for tracing
        new Sentry.Integrations.Http({ 
          tracing: true,
          breadcrumbs: true,
        }),
        
        // Express integration
        new Sentry.Integrations.Express({ 
          app,
          router: true,
          methods: true,
        }),
        
        // Node profiling (optional, can be resource intensive)
        ...(isProduction ? [nodeProfilingIntegration()] : []),
      ],

      // Performance monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Profiling (only in production to save resources)
      profilesSampleRate: isProduction ? 0.1 : 0,

      // Release tracking
      release: process.env.npm_package_version || "1.0.0",

      // Before sending an event to Sentry
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Don't send operational errors (expected errors)
        if (error && typeof error === "object" && "isOperational" in error) {
          const appError = error as any;
          if (appError.isOperational === true) {
            Logger.debug("Skipping operational error from Sentry", {
              error: appError.message,
              code: appError.code,
            });
            return null; // Don't send to Sentry
          }
        }

        // Filter out certain error types in production
        if (isProduction) {
          // Don't send validation errors
          if (event.exception?.values?.[0]?.type === "ValidationError") {
            return null;
          }

          // Don't send rate limit errors
          if (event.exception?.values?.[0]?.type === "RateLimitError") {
            return null;
          }
        }

        // Sanitize sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
            delete event.request.headers["x-api-key"];
          }

          // Remove sensitive query parameters
          if (event.request.query_string) {
            const sanitizedQuery = event.request.query_string
              .replace(/password=[^&]*/gi, "password=[REDACTED]")
              .replace(/token=[^&]*/gi, "token=[REDACTED]")
              .replace(/api_key=[^&]*/gi, "api_key=[REDACTED]");
            event.request.query_string = sanitizedQuery;
          }
        }

        // Remove sensitive context data
        if (event.contexts?.user) {
          delete event.contexts.user.ip_address;
        }

        return event;
      },

      // Before sending a breadcrumb
      beforeBreadcrumb(breadcrumb, hint) {
        // Don't log sensitive URLs
        if (breadcrumb.category === "http" && breadcrumb.data?.url) {
          const url = breadcrumb.data.url as string;
          
          // Redact sensitive endpoints
          if (url.includes("/auth/login") || url.includes("/auth/signup")) {
            breadcrumb.data.url = url.replace(/password=[^&]*/gi, "password=[REDACTED]");
          }
        }

        return breadcrumb;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Network errors
        "ECONNREFUSED",
        "ENOTFOUND",
        "ETIMEDOUT",
        "ECONNRESET",
        
        // Common client errors
        "NetworkError",
        "AbortError",
        
        // Expected validation errors
        "ValidationError",
        "ZodError",
        
        // Rate limiting
        "TooManyRequests",
        "RateLimitError",
      ],

      // Ignore certain URLs/transactions
      ignoreTransactions: [
        "/health",
        "/health/detailed",
        "/ready",
        "/live",
        "/metrics",
      ],

      // Enable debug mode in development
      debug: !isProduction,

      // Max breadcrumbs to capture
      maxBreadcrumbs: 50,

      // Attach stack trace to messages
      attachStacktrace: true,
    });

    Logger.info("✅ Sentry initialized successfully", {
      environment: env.NODE_ENV,
      tracesSampleRate: isProduction ? 0.1 : 1.0,
    });
  } catch (error) {
    Logger.error("Failed to initialize Sentry", error);
    // Don't throw - allow app to run without Sentry
  }
}

/**
 * Get Sentry middleware handlers for Express
 */
export function getSentryHandlers() {
  return {
    // Request handler - must be first middleware
    requestHandler: Sentry.Handlers.requestHandler({
      ip: false, // Don't capture IP for privacy
      user: true,
      transaction: true,
    }),

    // Tracing handler - must be after request handler
    tracingHandler: Sentry.Handlers.tracingHandler(),

    // Error handler - must be before custom error handlers but after routes
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Only send non-operational errors to Sentry
        if (error && typeof error === "object" && "isOperational" in error) {
          const appError = error as any;
          return appError.isOperational !== true;
        }
        
        // Send all other errors
        return true;
      },
    }),
  };
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.captureException(error, {
    contexts: context
      ? {
          custom: context,
        }
      : undefined,
  });
}

/**
 * Manually capture a message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: context
      ? {
          custom: context,
        }
      : undefined,
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = "info"
) {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}