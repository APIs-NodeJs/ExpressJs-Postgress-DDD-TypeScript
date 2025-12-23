import { Model, ModelCtor } from "sequelize-typescript";

export abstract class BaseRepository<TDomain, TModel extends Model> {
  constructor(protected model: ModelCtor<TModel>) {}

  protected abstract toDomain(model: TModel): TDomain;
  protected abstract toModel(domain: TDomain): Partial<TModel>;

  async findById(id: string): Promise<TDomain | null> {
    const model = await this.model.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findAll(options?: any): Promise<TDomain[]> {
    const models = await this.model.findAll(options);
    return models.map((model) => this.toDomain(model));
  }

  async exists(id: string): Promise<boolean> {
    const count: any = await this.model.count({ where: { id } });
    return count > 0;
  }

  async save(domain: TDomain): Promise<TDomain> {
    const modelData = this.toModel(domain);

    // FIXED: Don't filter out undefined values - let Sequelize handle them
    // This was causing fields to be missing from the INSERT statement
    const [model] = await this.model.upsert(modelData as any);
    return this.toDomain(model);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.model.destroy({ where: { id } });
    return deleted > 0;
  }
}
