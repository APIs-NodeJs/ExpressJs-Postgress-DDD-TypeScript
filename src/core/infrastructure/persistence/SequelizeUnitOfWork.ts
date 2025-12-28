import { Transaction, Sequelize } from 'sequelize';
import { IUnitOfWork } from '../../application/ports/IUnitOfWork';

export class SequelizeUnitOfWork implements IUnitOfWork {
  private transaction: Transaction | null = null;

  constructor(private readonly sequelize: Sequelize) {}

  public async start(): Promise<void> {
    if (this.transaction) {
      throw new Error('Transaction already started');
    }
    this.transaction = await this.sequelize.transaction();
  }

  public async commit(): Promise<void> {
    if (!this.transaction) {
      throw new Error('No transaction to commit');
    }
    await this.transaction.commit();
    this.transaction = null;
  }

  public async rollback(): Promise<void> {
    if (!this.transaction) {
      throw new Error('No transaction to rollback');
    }
    await this.transaction.rollback();
    this.transaction = null;
  }

  public isActive(): boolean {
    return this.transaction !== null;
  }

  public getTransaction(): Transaction {
    if (!this.transaction) {
      throw new Error('No active transaction');
    }
    return this.transaction;
  }
}
