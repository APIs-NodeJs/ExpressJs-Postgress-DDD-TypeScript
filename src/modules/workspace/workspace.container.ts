// src/modules/workspace/workspace.container.ts

import { Router } from 'express';
import { WorkspaceRepository } from './infrastructure/repositories/workspace.repository';
import {
  WorkspaceMemberRepository,
  WorkspaceInvitationRepository,
} from './infrastructure/repositories/workspace-member.repository';
import { AuthContainer } from '@modules/auth/auth.container';
import {
  CreateWorkspaceUseCase,
  GetWorkspaceUseCase,
  ListWorkspacesUseCase,
  AddMemberUseCase,
  RemoveMemberUseCase,
  InviteMemberUseCase,
  AcceptInvitationUseCase,
} from './application/use-cases';
import { WorkspaceController } from './presentation/controllers/workspace.controller';
import { createWorkspaceRoutes } from './presentation/routes/workspace.routes';

export class WorkspaceContainer {
  private static workspaceRepository: WorkspaceRepository;
  private static memberRepository: WorkspaceMemberRepository;
  private static invitationRepository: WorkspaceInvitationRepository;

  private static createWorkspaceUseCase: CreateWorkspaceUseCase;
  private static getWorkspaceUseCase: GetWorkspaceUseCase;
  private static listWorkspacesUseCase: ListWorkspacesUseCase;
  private static addMemberUseCase: AddMemberUseCase;
  private static removeMemberUseCase: RemoveMemberUseCase;
  private static inviteMemberUseCase: InviteMemberUseCase;
  private static acceptInvitationUseCase: AcceptInvitationUseCase;

  private static workspaceController: WorkspaceController;

  static initialize(): void {
    // Repositories
    this.workspaceRepository = new WorkspaceRepository();
    this.memberRepository = new WorkspaceMemberRepository();
    this.invitationRepository = new WorkspaceInvitationRepository();

    // Get user repository from AuthContainer
    const userRepository = AuthContainer.getUserRepository();

    // Use Cases
    this.createWorkspaceUseCase = new CreateWorkspaceUseCase(
      this.workspaceRepository,
      this.memberRepository
    );

    this.getWorkspaceUseCase = new GetWorkspaceUseCase(
      this.workspaceRepository,
      this.memberRepository
    );

    this.listWorkspacesUseCase = new ListWorkspacesUseCase(
      this.memberRepository,
      this.workspaceRepository
    );

    this.addMemberUseCase = new AddMemberUseCase(
      this.workspaceRepository,
      this.memberRepository,
      userRepository
    );

    this.removeMemberUseCase = new RemoveMemberUseCase(
      this.workspaceRepository,
      this.memberRepository
    );

    this.inviteMemberUseCase = new InviteMemberUseCase(
      this.workspaceRepository,
      this.memberRepository,
      this.invitationRepository
    );

    this.acceptInvitationUseCase = new AcceptInvitationUseCase(
      this.invitationRepository,
      this.workspaceRepository,
      this.memberRepository,
      userRepository
    );

    // Controllers
    this.workspaceController = new WorkspaceController(
      this.createWorkspaceUseCase,
      this.getWorkspaceUseCase,
      this.listWorkspacesUseCase,
      this.addMemberUseCase,
      this.removeMemberUseCase,
      this.inviteMemberUseCase,
      this.acceptInvitationUseCase
    );
  }

  static getWorkspaceRoutes(): Router {
    if (!this.workspaceController) {
      this.initialize();
    }
    return createWorkspaceRoutes(this.workspaceController);
  }

  static getWorkspaceRepository(): WorkspaceRepository {
    if (!this.workspaceRepository) {
      this.initialize();
    }
    return this.workspaceRepository;
  }

  static getMemberRepository(): WorkspaceMemberRepository {
    if (!this.memberRepository) {
      this.initialize();
    }
    return this.memberRepository;
  }

  static getInvitationRepository(): WorkspaceInvitationRepository {
    if (!this.invitationRepository) {
      this.initialize();
    }
    return this.invitationRepository;
  }
}
