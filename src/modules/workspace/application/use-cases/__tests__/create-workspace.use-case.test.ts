// src/modules/workspace/application/use-cases/__tests__/create-workspace.use-case.test.ts

import { CreateWorkspaceUseCase } from '../create-workspace.use-case';
import { IWorkspaceRepository } from '../../../domain/repositories/workspace.repository.interface';
import { IWorkspaceMemberRepository } from '../../../domain/repositories/workspace-member.repository.interface';
import { Workspace } from '../../../domain/entities/workspace.entity';
import { WorkspaceName } from '../../../domain/value-objects/workspace-name.value-object';
import { ConflictError } from '@core/errors';

describe('CreateWorkspaceUseCase', () => {
  let createWorkspaceUseCase: CreateWorkspaceUseCase;
  let mockWorkspaceRepository: jest.Mocked<IWorkspaceRepository>;
  let mockMemberRepository: jest.Mocked<IWorkspaceMemberRepository>;

  beforeEach(() => {
    mockWorkspaceRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByOwnerId: jest.fn(),
      existsBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    mockMemberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByWorkspaceAndUser: jest.fn(),
      findByWorkspaceId: jest.fn(),
      findByUserId: jest.fn(),
      existsByWorkspaceAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByWorkspaceAndUser: jest.fn(),
      countByWorkspaceId: jest.fn(),
      countOwnersByWorkspaceId: jest.fn(),
    };

    createWorkspaceUseCase = new CreateWorkspaceUseCase(
      mockWorkspaceRepository,
      mockMemberRepository
    );
  });

  describe('execute', () => {
    it('should successfully create a workspace', async () => {
      const input = {
        name: 'My Workspace',
        description: 'Test workspace',
        ownerId: 'user-123',
      };

      mockWorkspaceRepository.existsBySlug.mockResolvedValue(false);
      mockWorkspaceRepository.findBySlug.mockResolvedValue(null);
      mockWorkspaceRepository.save.mockImplementation(async (workspace) => workspace);
      mockMemberRepository.save.mockImplementation(async (member) => member);

      const result = await createWorkspaceUseCase.execute(input);

      expect(result.name).toBe('My Workspace');
      expect(result.slug).toBe('my-workspace');
      expect(result.ownerId).toBe('user-123');
      expect(mockWorkspaceRepository.save).toHaveBeenCalledTimes(1);
      expect(mockMemberRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should generate unique slug when duplicate exists', async () => {
      const input = {
        name: 'My Workspace',
        ownerId: 'user-123',
      };

      mockWorkspaceRepository.existsBySlug.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      mockWorkspaceRepository.findBySlug.mockResolvedValue(null);
      mockWorkspaceRepository.save.mockImplementation(async (workspace) => workspace);
      mockMemberRepository.save.mockImplementation(async (member) => member);

      const result = await createWorkspaceUseCase.execute(input);

      expect(result.slug).toBe('my-workspace-1');
    });

    it('should throw ConflictError if workspace with slug exists', async () => {
      const input = {
        name: 'My Workspace',
        ownerId: 'user-123',
      };

      const existingWorkspace = Workspace.create({
        name: WorkspaceName.create('My Workspace'),
        slug: 'my-workspace',
        ownerId: 'other-user',
      });

      mockWorkspaceRepository.existsBySlug.mockResolvedValue(false);
      mockWorkspaceRepository.findBySlug.mockResolvedValue(existingWorkspace);

      await expect(createWorkspaceUseCase.execute(input)).rejects.toThrow(ConflictError);
    });
  });
});

// src/modules/workspace/application/use-cases/__tests__/add-member.use-case.test.ts

import { AddMemberUseCase } from '../add-member.use-case';
import { IWorkspaceRepository } from '../../../domain/repositories/workspace.repository.interface';
import { IWorkspaceMemberRepository } from '../../../domain/repositories/workspace-member.repository.interface';
import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { Workspace } from '../../../domain/entities/workspace.entity';
import { WorkspaceMember } from '../../../domain/entities/workspace-member.entity';
import { WorkspaceName } from '../../../domain/value-objects/workspace-name.value-object';
import { WorkspaceRole } from '../../../domain/value-objects/workspace-role.value-object';
import { User, UserStatus } from '@modules/auth/domain/entities/user.entity';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { NotFoundError, ForbiddenError, ConflictError } from '@core/errors';

describe('AddMemberUseCase', () => {
  let addMemberUseCase: AddMemberUseCase;
  let mockWorkspaceRepository: jest.Mocked<IWorkspaceRepository>;
  let mockMemberRepository: jest.Mocked<IWorkspaceMemberRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockWorkspaceRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByOwnerId: jest.fn(),
      existsBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    mockMemberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByWorkspaceAndUser: jest.fn(),
      findByWorkspaceId: jest.fn(),
      findByUserId: jest.fn(),
      existsByWorkspaceAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByWorkspaceAndUser: jest.fn(),
      countByWorkspaceId: jest.fn(),
      countOwnersByWorkspaceId: jest.fn(),
    };

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    addMemberUseCase = new AddMemberUseCase(
      mockWorkspaceRepository,
      mockMemberRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should successfully add a member', async () => {
      const workspace = Workspace.create({
        name: WorkspaceName.create('Test Workspace'),
        slug: 'test-workspace',
        ownerId: 'owner-123',
      });

      const requesterMember = WorkspaceMember.create(
        workspace.getId(),
        'owner-123',
        WorkspaceRole.owner()
      );

      const user = User.create({
        email: Email.create('newmember@example.com'),
        passwordHash: 'hashed',
        firstName: 'New',
        lastName: 'Member',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockWorkspaceRepository.findById.mockResolvedValue(workspace);
      mockMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(requesterMember)
        .mockResolvedValueOnce(null);
      mockUserRepository.findById.mockResolvedValue(user);
      mockMemberRepository.save.mockImplementation(async (member) => member);

      const result = await addMemberUseCase.execute({
        workspaceId: workspace.getId(),
        userId: user.getId(),
        role: 'member',
        addedBy: 'owner-123',
      });

      expect(result.userId).toBe(user.getId());
      expect(result.role).toBe('member');
      expect(mockMemberRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenError if requester is not admin', async () => {
      const workspace = Workspace.create({
        name: WorkspaceName.create('Test Workspace'),
        slug: 'test-workspace',
        ownerId: 'owner-123',
      });

      const requesterMember = WorkspaceMember.create(
        workspace.getId(),
        'member-456',
        WorkspaceRole.guest()
      );

      mockWorkspaceRepository.findById.mockResolvedValue(workspace);
      mockMemberRepository.findByWorkspaceAndUser.mockResolvedValue(requesterMember);

      await expect(
        addMemberUseCase.execute({
          workspaceId: workspace.getId(),
          userId: 'new-user',
          role: 'member',
          addedBy: 'member-456',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError if user is already a member', async () => {
      const workspace = Workspace.create({
        name: WorkspaceName.create('Test Workspace'),
        slug: 'test-workspace',
        ownerId: 'owner-123',
      });

      const requesterMember = WorkspaceMember.create(
        workspace.getId(),
        'owner-123',
        WorkspaceRole.owner()
      );

      const existingMember = WorkspaceMember.create(
        workspace.getId(),
        'existing-user',
        WorkspaceRole.member()
      );

      const user = User.create({
        email: Email.create('existing@example.com'),
        passwordHash: 'hashed',
        firstName: 'Existing',
        lastName: 'Member',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockWorkspaceRepository.findById.mockResolvedValue(workspace);
      mockMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(requesterMember)
        .mockResolvedValueOnce(existingMember);
      mockUserRepository.findById.mockResolvedValue(user);

      await expect(
        addMemberUseCase.execute({
          workspaceId: workspace.getId(),
          userId: user.getId(),
          role: 'member',
          addedBy: 'owner-123',
        })
      ).rejects.toThrow(ConflictError);
    });
  });
});
