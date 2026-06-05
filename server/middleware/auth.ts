import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: { id: number };
}

/**
 * 认证中间件（已禁用）
 * 直接放行所有请求，无需认证令牌
 */
export function authMiddleware(
  _req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  next();
}
