// src/core/infrastructure/outbox/models/OutboxEventModel.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../shared/config/database.config';

interface OutboxEventAttributes {
  id: string;
  eventId: string;
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  attemptCount: number;
  lastAttemptAt?: Date;
  publishedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OutboxEventCreationAttributes extends Optional<
  OutboxEventAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class OutboxEventModel
  extends Model<OutboxEventAttributes, OutboxEventCreationAttributes>
  implements OutboxEventAttributes
{
  public id!: string;
  public eventId!: string;
  public eventName!: string;
  public aggregateId!: string;
  public aggregateType!: string;
  public payload!: any;
  public status!: 'PENDING' | 'PUBLISHED' | 'FAILED';
  public attemptCount!: number;
  public lastAttemptAt?: Date;
  public publishedAt?: Date;
  public error?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OutboxEventModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'event_id',
    },
    eventName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'event_name',
    },
    aggregateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'aggregate_id',
    },
    aggregateType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'aggregate_type',
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PUBLISHED', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    attemptCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'attempt_count',
    },
    lastAttemptAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_attempt_at',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at',
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'outbox_events',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['status'] },
      { fields: ['event_name'] },
      { fields: ['aggregate_id'] },
      { fields: ['created_at'] },
      { fields: ['status', 'attempt_count'] },
    ],
  }
);
