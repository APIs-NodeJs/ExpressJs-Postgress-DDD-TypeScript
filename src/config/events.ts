import { eventBus } from "../core/application/EventBus";
import { UserCreatedHandler } from "../modules/auth/application/event-handlers/UserCreatedHandler";
import { UserLoggedInHandler } from "../modules/auth/application/event-handlers/UserLoggedInHandler";

export function setupEventHandlers(): void {
  // Register event handlers
  eventBus.subscribe("UserCreated", new UserCreatedHandler());
  eventBus.subscribe("UserLoggedIn", new UserLoggedInHandler());

  console.log("✅ Event handlers registered");
}
