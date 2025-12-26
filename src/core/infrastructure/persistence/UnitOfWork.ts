import { Transaction } from "sequelize";
import { sequelize } from "../../../config/database";

export class UnitOfWork {
  private transaction: Transaction | null = null;

  public async start(): Promise<void> {
    this.transaction = await sequelize.transaction();
  }

  public async commit(): Promise<void> {
    if (!this.transaction) {
      throw new Error("No transaction started");
    }
    await this.transaction.commit();
    this.transaction = null;
  }

  public async rollback(): Promise<void> {
    if (!this.transaction) {
      throw new Error("No transaction started");
    }
    await this.transaction.rollback();
    this.transaction = null;
  }

  public getTransaction(): Transaction {
    if (!this.transaction) {
      throw new Error("No transaction started");
    }
    return this.transaction;
  }

  public isActive(): boolean {
    return this.transaction !== null;
  }
}
