// src/modules/user/application/dtos/request/update-profile.request.dto.ts

export interface UpdateProfileRequestDto {
  userId: string;
  firstName?: string;
  lastName?: string;
}
