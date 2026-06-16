import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/setup — 首次设置密码（已禁用）
router.post('/setup', (_req: Request, res: Response) => {
  res.json({ message: '认证功能已禁用', token: 'disabled' });
});

// POST /api/auth/login — 登录（已禁用）
router.post('/login', (_req: Request, res: Response) => {
  res.json({ message: '认证功能已禁用', token: 'disabled' });
});

// GET /api/auth/status — 检查认证状态
router.get('/status', (_req: Request, res: Response) => {
  res.json({ setup: true, disabled: true });
});

export default router;
