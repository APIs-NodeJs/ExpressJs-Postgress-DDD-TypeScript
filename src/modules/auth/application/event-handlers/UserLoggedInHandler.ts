import { EventHandler } from "../../../../core/application/EventBus";
import { UserLoggedInEvent } from "../../domain/events/UserEvents";

export class UserLoggedInHandler implements EventHandler<UserLoggedInEvent> {
  async handle(event: UserLoggedInEvent): Promise<void> {
    console.log(
      `[UserLoggedInHandler] User logged in: ${event.email} from ${
        event.ipAddress || "unknown"
      }`
    );

    // Log authentication event
    // await this.auditService.logLogin(event.userId, event.ipAddress);

    // Track user activity
    // await this.analyticsService.trackLogin(event.userId);

    // Check for suspicious activity
    // await this.securityService.checkLoginPattern(event.userId, event.ipAddress);
  }
}
