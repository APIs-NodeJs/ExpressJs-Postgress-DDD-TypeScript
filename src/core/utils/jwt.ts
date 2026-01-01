import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '@core/errors/AppError';

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  workspaceId?: string;
  role?: string;
  type?: 'access' | 'refresh';
  [key: string]: any;
}

/**
 * Token Generation Options
 */
interface TokenOptions {
  expiresIn?: string | number;
  audience?: string;
  issuer?: string;
  subject?: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (
  payload: Omit<JwtPayload, 'type'>,
  options?: TokenOptions
): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const signOptions: SignOptions = {
    expiresIn: options?.expiresIn || process.env.JWT_EXPIRES_IN || '15m',
    issuer: options?.issuer || process.env.JWT_ISSUER || 'myapp',
    audience: options?.audience || process.env.JWT_AUDIENCE || 'myapp-users',
    ...(options?.subject && { subject: options.subject }),
  };

  const tokenPayload: JwtPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, secret, signOptions);
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (
  payload: Omit<JwtPayload, 'type'>,
  options?: TokenOptions
): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined');
  }

  const signOptions: SignOptions = {
    expiresIn: options?.expiresIn || process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    issuer: options?.issuer || process.env.JWT_ISSUER || 'myapp',
    audience: options?.audience || process.env.JWT_AUDIENCE || 'myapp-users',
    ...(options?.subject && { subject: options.subject }),
  };

  const tokenPayload: JwtPayload = {
    ...payload,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, secret, signOptions);
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const verifyOptions: VerifyOptions = {
    issuer: process.env.JWT_ISSUER || 'myapp',
    audience: process.env.JWT_AUDIENCE || 'myapp-users',
  };

  try {
    const decoded = jwt.verify(token, secret, verifyOptions) as JwtPayload;
    
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined');
  }

  const verifyOptions: VerifyOptions = {
    issuer: process.env.JWT_ISSUER || 'myapp',
    audience: process.env.JWT_AUDIENCE || 'myapp-users',
  };

  try {
    const decoded = jwt.verify(token, secret, verifyOptions) as JwtPayload;
    
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (
  payload: Omit<JwtPayload, 'type'>
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};