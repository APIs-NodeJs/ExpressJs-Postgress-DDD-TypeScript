import { User } from "../aggregates/User.aggregate";
import { Email } from "../value-objects/Email.vo";
import { Result } from "../../../../core/domain/Result";

export class UserDomainService {
  public static canChangeEmail(user: User, newEmail: Email): Result<void> {
    if (!user.emailVerified) {
      return Result.fail<void>(
        "Cannot change email until current email is verified"
      );
    }

    if (user.email.equals(newEmail)) {
      return Result.fail<void>(
        "New email must be different from current email"
      );
    }

    return Result.ok();
  }

  public static canDeleteAccount(user: User): Result<void> {
    // Add business rules for account deletion
    // For example: check if user has pending orders, subscriptions, etc.
    return Result.ok();
  }
}
