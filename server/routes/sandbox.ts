import { Router, Request, Response } from 'express';

const router = Router();

// ========== 沙箱代码执行路由 ==========
// 挂载在 /api/sandbox 下

/** 执行用户提交的代码 */
router.post('/execute', (req: Request, res: Response) => {
  // TODO: 调用 terminal service 执行代码并返回结果
  const { code, language } = req.body;
  res.json({
    language: language || 'python',
    code: code || '',
    stdout: '',
    stderr: '',
    exitCode: 0,
    timedOut: false,
    message: '代码执行结果占位（mock）',
  });
});

export default router;
