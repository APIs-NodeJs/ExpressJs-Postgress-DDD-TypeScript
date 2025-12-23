import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  CreatedAt,
  UpdatedAt,
  Index,
} from "sequelize-typescript";

@Table({
  tableName: "user_settings",
  timestamps: true,
})
export class UserSettingsModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.UUID)
  @Index
  userId!: string;

  @Default("system")
  @Column(DataType.ENUM("light", "dark", "system"))
  theme!: string;

  @Default("en")
  @Column(DataType.STRING(10))
  language!: string;

  @Default("UTC")
  @Column(DataType.STRING(50))
  timezone!: string;

  @Default("YYYY-MM-DD")
  @Column(DataType.STRING(20))
  dateFormat!: string;

  @Default(1)
  @Column(DataType.INTEGER)
  weekStartsOn!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  emailNotifications!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  pushNotifications!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  compactMode!: boolean;

  @Default({})
  @Column(DataType.JSONB)
  notificationPreferences!: any;

  @Default(false)
  @Column(DataType.BOOLEAN)
  twoFactorEnabled!: boolean;

  @Column(DataType.STRING(255))
  twoFactorSecret?: string;

  @Column(DataType.ARRAY(DataType.STRING))
  backupCodes?: string[];

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}
