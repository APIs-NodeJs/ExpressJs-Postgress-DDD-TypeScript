// src/modules/workspace/domain/entities/workspace.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { WorkspaceName } from '../value-objects/workspace-name.value-object';

export enum WorkspaceStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

export interface WorkspaceProps {
  id?: string;
  name: WorkspaceName;
  slug: string;
  description?: string;
  ownerId: string;
  status: WorkspaceStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Workspace {
  private readonly id: string;
  private name: WorkspaceName;
  private slug: string;
  private description?: string;
  private readonly ownerId: string;
  private status: WorkspaceStatus;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  private constructor(props: WorkspaceProps) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.ownerId = props.ownerId;
    this.status = props.status;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.deletedAt = props.deletedAt;
  }

  static create(
    props: Omit<WorkspaceProps, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Workspace {
    return new Workspace({
      ...props,
      status: WorkspaceStatus.ACTIVE,
    });
  }

  static fromPersistence(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getName(): WorkspaceName {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getStatus(): WorkspaceStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  isActive(): boolean {
    return this.status === WorkspaceStatus.ACTIVE && !this.isDeleted();
  }

  // Business logic methods
  updateName(name: WorkspaceName): void {
    this.name = name;
    this.touch();
  }

  updateDescription(description: string): void {
    this.description = description.trim();
    this.touch();
  }

  suspend(): void {
    this.status = WorkspaceStatus.SUSPENDED;
    this.touch();
  }

  activate(): void {
    this.status = WorkspaceStatus.ACTIVE;
    this.touch();
  }

  archive(): void {
    this.status = WorkspaceStatus.ARCHIVED;
    this.touch();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to plain object for persistence
  toObject(): WorkspaceProps {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      ownerId: this.ownerId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
