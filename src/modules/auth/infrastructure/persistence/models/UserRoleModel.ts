import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from "sequelize-typescript";
import { UserModel } from "./UserModel";

@Table({
  tableName: "user_roles",
  timestamps: true,
})
export class UserRoleModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => UserModel)
  user!: UserModel;

  @AllowNull(false)
  @Default("user")
  @Index
  @Column(DataType.ENUM("owner", "admin", "moderator", "user"))
  role!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}
