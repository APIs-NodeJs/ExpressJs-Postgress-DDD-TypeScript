// src/modules/auth/infrastructure/GoogleOAuthProvider.ts
import axios from 'axios';
import { config } from '../../../shared/config/env.config';
import { Result } from '../../../core/domain/Result';

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export class GoogleOAuthProvider {
  private static readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static readonly GOOGLE_USERINFO_URL =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  private static validateConfig(): Result<void> {
    if (!config.GOOGLE_CLIENT_ID) {
      return Result.fail('Google Client ID is not configured');
    }
    if (!config.GOOGLE_CLIENT_SECRET) {
      return Result.fail('Google Client Secret is not configured');
    }
    if (!config.GOOGLE_REDIRECT_URI) {
      return Result.fail('Google Redirect URI is not configured');
    }
    return Result.ok();
  }

  public static async exchangeCodeForTokens(code: string): Promise<
    Result<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>
  > {
    const configValidation = this.validateConfig();
    if (configValidation.isFailure) {
      return Result.fail(configValidation.getErrorValue());
    }

    try {
      const response = await axios.post(this.GOOGLE_TOKEN_URL, {
        code,
        client_id: config.GOOGLE_CLIENT_ID!,
        client_secret: config.GOOGLE_CLIENT_SECRET!,
        redirect_uri: config.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      });

      return Result.ok(response.data);
    } catch (error: any) {
      return Result.fail<any>(
        error.response?.data?.error_description || 'Failed to exchange code for tokens'
      );
    }
  }

  public static async getUserInfo(accessToken: string): Promise<Result<GoogleUserInfo>> {
    try {
      const response = await axios.get(this.GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return Result.ok<GoogleUserInfo>(response.data);
    } catch (error: any) {
      return Result.fail<GoogleUserInfo>(
        error.response?.data?.error || 'Failed to fetch user info from Google'
      );
    }
  }

  public static getAuthorizationUrl(state: string): string {
    const configValidation = this.validateConfig();
    if (configValidation.isFailure) {
      throw new Error(configValidation.getErrorValue());
    }

    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID!,
      redirect_uri: config.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      state,
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}
