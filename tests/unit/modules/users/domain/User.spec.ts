import { User } from '@/modules/users/domain/entities/User';
import { Email } from '@/modules/users/domain/valueObjects/Email';
import { UserRole } from '@/modules/users/domain/valueObjects/UserRole';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      const emailResult = Email.create('test@example.com');
      expect(emailResult.isSuccess).toBe(true);

      const userResult = User.create({
        email: emailResult.getValue(),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      });

      expect(userResult.isSuccess).toBe(true);
      const user = userResult.getValue();
      expect(user.getEmail().value).toBe('test@example.com');
      expect(user.getFullName()).toBe('John Doe');
    });

    it('should fail with invalid email', () => {
      const emailResult = Email.create('invalid-email');
      expect(emailResult.isFailure).toBe(true);
    });

    it('should raise UserCreated domain event', () => {
      const emailResult = Email.create('test@example.com');
      const userResult = User.create({
        email: emailResult.getValue(),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      });

      const user = userResult.getValue();
      expect(user.domainEvents.length).toBe(1);
      expect(user.domainEvents[0].eventName).toBe('UserCreated');
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', () => {
      const emailResult = Email.create('admin@example.com');
      const userResult = User.create({
        email: emailResult.getValue(),
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      });

      const user = userResult.getValue();
      expect(user.isAdmin()).toBe(true);
    });
  });
});
