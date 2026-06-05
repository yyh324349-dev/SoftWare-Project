import { Router, Request, Response } from 'express';

const router = Router();

// ========== 实验（Lab）路由 ==========
// 挂载在 /api 下，路径以 /courses/:id/labs 开头

/** 获取课程下的所有实验列表 */
router.get('/courses/:id/labs', (req: Request, res: Response) => {
  // TODO: 查询指定课程的实验列表
  const { id } = req.params;
  res.json({
    courseId: Number(id),
    labs: [],
  });
});

/** 获取单个实验详情（含文件列表） */
router.get('/courses/:id/labs/:labId', (req: Request, res: Response) => {
  // TODO: 查询实验详情，包含说明、起始代码、测试用例
  const { id, labId } = req.params;
  res.json({
    courseId: Number(id),
    labId: Number(labId),
    title: '',
    description: '',
    instructions: '',
    starterCode: '',
    files: [],
    message: '实验详情占位（mock）',
  });
});

/** 更新实验文件内容 */
router.put('/courses/:id/labs/:labId/files', (req: Request, res: Response) => {
  // TODO: 保存学生编辑后的实验文件
  const { id, labId } = req.params;
  const { files } = req.body;
  res.json({
    courseId: Number(id),
    labId: Number(labId),
    filesCount: Array.isArray(files) ? files.length : 0,
    message: '文件已保存（mock）',
  });
});

/** 运行实验代码 */
router.post('/courses/:id/labs/:labId/run', (req: Request, res: Response) => {
  // TODO: 执行学生实验代码并返回运行结果
  const { id, labId } = req.params;
  res.json({
    courseId: Number(id),
    labId: Number(labId),
    stdout: '',
    stderr: '',
    exitCode: 0,
    message: '代码执行结果占位（mock）',
  });
});

export default router;
