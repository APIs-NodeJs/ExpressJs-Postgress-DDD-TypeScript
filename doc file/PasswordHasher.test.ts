import { PasswordHasher } from '../src/modules/auth/infrastructure/security/PasswordHasher';

describe('PasswordHasher', () => {
  let passwordHasher: PasswordHasher;

  beforeEach(() => {
    passwordHasher = new PasswordHasher();
  });

  describe('validate', () => {
    it('should validate a strong password', () => {
      const result = passwordHasher.validate('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = passwordHasher.validate('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = passwordHasher.validate('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = passwordHasher.validate('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = passwordHasher.validate('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for weak password', () => {
      const result = passwordHasher.validate('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('hash and compare', () => {
    it('should hash password and verify it', async () => {
      const password = 'TestPassword123!';
      const hashed = await passwordHasher.hash(password);

      expect(hashed).not.toBe(password);
      expect(hashed).toBeTruthy();

      const isValid = await passwordHasher.compare(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should fail to verify incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await passwordHasher.hash(password);

      const isValid = await passwordHasher.compare(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });
});
