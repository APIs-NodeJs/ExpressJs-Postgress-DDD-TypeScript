import bcrypt from 'bcrypt';
import { APP_CONSTANTS } from '../../../../config/constants';

export class PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, APP_CONSTANTS.SECURITY.BCRYPT_ROUNDS);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < APP_CONSTANTS.SECURITY.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${APP_CONSTANTS.SECURITY.PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
