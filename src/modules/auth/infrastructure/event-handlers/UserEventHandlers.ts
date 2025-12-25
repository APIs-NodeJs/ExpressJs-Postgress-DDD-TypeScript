import { DomainEvents } from "../../../../shared/domain/DomainEvents";
import {
  UserCreatedEvent,
  UserLoggedInEvent,
  UserEmailVerifiedEvent,
  AccountLockedEvent,
} from "../../domain/events/UserEvents";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { AuditLogger } from "../../../../infrastructure/AuditLogger";

export class UserEventHandlers {
  static register(): void {
    // User Created Handler
    DomainEvents.register("UserCreated", async (event: DomainEvents) => {
      const e = event as UserCreatedEvent;

      Logger.info("User created event", {
        userId: e.userId,
        email: e.email,
        workspaceId: e.workspaceId,
      });

      // Log audit trail
      await AuditLogger.log({
        userId: e.userId,
        workspaceId: e.workspaceId,
        action: "USER_CREATED",
        resourceType: "user",
        resourceId: e.userId,
        metadata: { email: e.email, role: e.role },
      });

      // TODO: Send welcome email
    });

    // User Logged In Handler
    DomainEvents.register("UserLoggedIn", async (event: DomainEvents) => {
      const e = event as UserLoggedInEvent;

      Logger.info("User logged in event", {
        userId: e.userId,
        sessionId: e.sessionId,
        ipAddress: e.ipAddress,
      });

      // TODO: Send login notification email if from new device
    });

    // Email Verified Handler
    DomainEvents.register("UserEmailVerified", async (event: DomainEvents) => {
      const e = event as UserEmailVerifiedEvent;

      Logger.info("Email verified event", {
        userId: e.userId,
        email: e.email,
      });

      // TODO: Update user onboarding progress
    });

    // Account Locked Handler
    DomainEvents.register("AccountLocked", async (event: DomainEvents) => {
      const e = event as AccountLockedEvent;

      Logger.security("Account locked event", {
        userId: e.userId,
        email: e.email,
        reason: e.reason,
        lockedUntil: e.lockedUntil,
      });

      // TODO: Send security alert email
    });
  }
}
