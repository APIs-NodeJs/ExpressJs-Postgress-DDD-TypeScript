import { UserSettings } from "../entities/UserSettings";

export interface ISettingsRepository {
  findByUserId(userId: string): Promise<UserSettings | null>;
  save(settings: UserSettings): Promise<UserSettings>;
  delete(userId: string): Promise<boolean>;
  exists(userId: string): Promise<boolean>;
}
