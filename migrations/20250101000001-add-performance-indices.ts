
export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Users table indices
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true,
    });

    await queryInterface.addIndex('users', ['workspace_id'], {
      name: 'idx_users_workspace',
    });

    await queryInterface.addIndex('users', ['workspace_id', 'email_verified'], {
      name: 'idx_users_workspace_verified',
    });

    // User roles indices
    await queryInterface.addIndex('user_roles', ['user_id'], {
      name: 'idx_user_roles_user',
      unique: true,
    });

    await queryInterface.addIndex('user_roles', ['role'], {
      name: 'idx_user_roles_role',
    });

    // Composite index for role checks
    await queryInterface.addIndex('user_roles', ['user_id', 'role'], {
      name: 'idx_user_roles_user_role',
    });

    // Workspaces indices
    await queryInterface.addIndex('workspaces', ['slug'], {
      name: 'idx_workspaces_slug',
      unique: true,
    });

    await queryInterface.addIndex('workspaces', ['owner_id'], {
      name: 'idx_workspaces_owner',
    });

    // User settings indices
    await queryInterface.addIndex('user_settings', ['user_id'], {
      name: 'idx_user_settings_user',
      unique: true,
    });

    // Add timestamp indices for common queries
    await queryInterface.addIndex('users', ['created_at'], {
      name: 'idx_users_created_at',
    });

    await queryInterface.addIndex('users', ['updated_at'], {
      name: 'idx_users_updated_at',
    });
  },

  down: async (queryInterface: any) => {
    await queryInterface.removeIndex('users', 'idx_users_email');
    await queryInterface.removeIndex('users', 'idx_users_workspace');
    await queryInterface.removeIndex('users', 'idx_users_workspace_verified');
    await queryInterface.removeIndex('user_roles', 'idx_user_roles_user');
    await queryInterface.removeIndex('user_roles', 'idx_user_roles_role');
    await queryInterface.removeIndex('user_roles', 'idx_user_roles_user_role');
    await queryInterface.removeIndex('workspaces', 'idx_workspaces_slug');
    await queryInterface.removeIndex('workspaces', 'idx_workspaces_owner');
    await queryInterface.removeIndex('user_settings', 'idx_user_settings_user');
    await queryInterface.removeIndex('users', 'idx_users_created_at');
    await queryInterface.removeIndex('users', 'idx_users_updated_at');
  },
};

// src/infrastructure/database/queryOptimizer.ts

import { FindOptions } from 'sequelize';

export class QueryOptimizer {
  /**
   * Add pagination to queries
   */
  static paginate<T>(options: FindOptions<T>, page: number = 1, limit: number = 20): FindOptions<T> {
    const offset = (page - 1) * limit;
    return {
      ...options,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    };
  }

  /**
   * Add selective field loading
   */
  static selectFields<T>(options: FindOptions<T>, fields: string[]): FindOptions<T> {
    return {
      ...options,
      attributes: fields,
    };
  }

  /**
   * Optimize eager loading
   */
  static withRelations<T>(options: FindOptions<T>, relations: string[]): FindOptions<T> {
    const include: any[] = [];
    
    if (relations.includes('workspace')) {
      include.push({
        association: 'workspace',
        attributes: ['id', 'name', 'slug'],
      });
    }

    if (relations.includes('role')) {
      include.push({
        association: 'role',
        attributes: ['id', 'role'],
      });
    }

    return {
      ...options,
      include,
    };
  }

  /**
   * Add query timeout
   */
  static withTimeout<T>(options: FindOptions<T>, timeout: number = 5000): FindOptions<T> {
    return {
      ...options,
      timeout,
    };
  }
}

// src/shared/infrastructure/BaseRepository.ts (Enhanced)

import { Model, ModelCtor, FindOptions, CountOptions } from 'sequelize-typescript';
import { QueryOptimizer } from '@infrastructure/database/queryOptimizer';
import { PaginatedResponse } from '@shared/application/PaginatedResponse';
import { PaginationParams } from '@shared/application/PaginationParams';

export abstract class BaseRepository<TDomain, TModel extends Model> {
  constructor(protected model: ModelCtor<TModel>) {}

  protected abstract toDomain(model: TModel): TDomain;
  protected abstract toModel(domain: TDomain): Partial<TModel>;

  async findById(id: string, relations?: string[]): Promise<TDomain | null> {
    let options: FindOptions<TModel> = { where: { id } as any };
    
    if (relations && relations.length > 0) {
      options = QueryOptimizer.withRelations(options, relations);
    }
    
    options = QueryOptimizer.withTimeout(options);
    
    const model = await this.model.findOne(options);
    return model ? this.toDomain(model) : null;
  }

  async findAll(
    pagination?: PaginationParams,
    filter?: any,
    relations?: string[]
  ): Promise<PaginatedResponse<TDomain>> {
    let options: FindOptions<TModel> = {};
    
    if (filter) {
      options.where = filter;
    }

    if (relations && relations.length > 0) {
      options = QueryOptimizer.withRelations(options, relations);
    }

    // Add sorting
    if (pagination?.sortBy) {
      options.order = [[pagination.sortBy, pagination.sortOrder || 'ASC']];
    }

    // Add pagination
    if (pagination) {
      options = QueryOptimizer.paginate(
        options,
        pagination.page || 1,
        pagination.limit || 20
      );
    }

    options = QueryOptimizer.withTimeout(options);

    const [models, total] = await Promise.all([
      this.model.findAll(options),
      this.model.count({ where: options.where } as CountOptions<TModel>),
    ]);

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;

    return {
      data: models.map((model) => this.toDomain(model)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.model.count({ 
      where: { id } as any,
      timeout: 5000,
    });
    return count > 0;
  }

  async save(domain: TDomain): Promise<TDomain> {
    const modelData = this.toModel(domain);
    const [model] = await this.model.upsert(modelData as any, {
      returning: true,
    });
    return this.toDomain(model);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.model.destroy({ 
      where: { id } as any,
      timeout: 5000,
    });
    return deleted > 0;
  }

  async bulkCreate(domains: TDomain[]): Promise<TDomain[]> {
    const modelsData = domains.map((domain) => this.toModel(domain));
    const models = await this.model.bulkCreate(modelsData as any[], {
      returning: true,
    });
    return models.map((model) => this.toDomain(model));
  }

  async count(filter?: any): Promise<number> {
    return this.model.count({
      where: filter,
      timeout: 5000,
    });
  }
}