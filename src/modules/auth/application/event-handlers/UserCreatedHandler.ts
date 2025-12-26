import { EventHandler } from "../../../../core/application/EventBus";
import { UserCreatedEvent } from "../../domain/events/UserEvents";

export class UserCreatedHandler implements EventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    console.log(`[UserCreatedHandler] User created: ${event.email}`);

    // Send welcome email
    // await this.emailService.sendWelcomeEmail(event.email);

    // Create default user settings
    // await this.settingsService.createDefaultSettings(event.userId);

    // Add to analytics
    // await this.analyticsService.trackUserSignup(event.userId);
  }
}
