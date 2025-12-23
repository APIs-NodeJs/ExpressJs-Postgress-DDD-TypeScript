import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  AllowNull,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { UserModel } from "./UserModel";

@Table({
  tableName: "workspaces",
  timestamps: true,
})
export class WorkspaceModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  name!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(100))
  slug!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  ownerId!: string;

  @HasMany(() => UserModel)
  users!: UserModel[];

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}
