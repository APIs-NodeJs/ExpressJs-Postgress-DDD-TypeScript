import { User } from "../entities/User";

/**
 * User Repository Interface
 * Defines all data access operations for User aggregate
 */
export interface IUserRepository {
  /**
   * Find user by email address
   * @param email - User's email (case-insensitive)
   * @returns User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID
   * @param id - User's unique identifier
   * @returns User entity or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find all users in a workspace
   * @param workspaceId - Workspace unique identifier
   * @returns Array of users in the workspace
   */
  findByWorkspaceId(workspaceId: string): Promise<User[]>;

  /**
   * Find all users (admin function)
   * @returns Array of all users
   */
  findAll(): Promise<User[]>;

  /**
   * Find user by verification token
   * @param token - Email verification token
   * @returns User entity or null if not found
   */
  findByVerificationToken(token: string): Promise<User | null>;

  /**
   * Find user by password reset token
   * @param token - Password reset token
   * @returns User entity or null if not found
   */
  findByResetToken(token: string): Promise<User | null>;

  /**
   * Create a new user
   * @param user - User entity to create
   * @param transaction - Optional database transaction
   * @returns Created user entity
   */
  create(user: User, transaction?: any): Promise<User>;

  /**
   * Update existing user
   * @param id - User's unique identifier
   * @param updates - Partial user data to update
   * @param transaction - Optional database transaction
   * @returns Updated user entity or null if not found
   */
  update(
    id: string,
    updates: Partial<User>,
    transaction?: any
  ): Promise<User | null>;

  /**
   * Delete user
   * @param id - User's unique identifier
   * @param transaction - Optional database transaction
   * @returns True if deleted, false if not found
   */
  delete(id: string, transaction?: any): Promise<boolean>;

  /**
   * Check if email exists
   * @param email - Email to check
   * @returns True if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Count total users
   * @returns Total number of users
   */
  count(): Promise<number>;

  /**
   * Count users in workspace
   * @param workspaceId - Workspace unique identifier
   * @returns Number of users in workspace
   */
  countByWorkspace(workspaceId: string): Promise<number>;
}
