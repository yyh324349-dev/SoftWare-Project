import { Router, Request, Response } from 'express';

const router = Router();

// ========== 课程笔记路由 ==========
// 挂载在 /api 下，路径以 /courses/:id/notes 开头

/** 获取课程所有周次的笔记列表 */
router.get('/courses/:id/notes', (req: Request, res: Response) => {
  // TODO: 查询课程下所有笔记
  const { id } = req.params;
  res.json({
    courseId: Number(id),
    notes: [],
  });
});

/** 获取某一周的笔记详情 */
router.get('/courses/:id/notes/:week', (req: Request, res: Response) => {
  // TODO: 查询指定周次的笔记内容
  const { id, week } = req.params;
  res.json({
    courseId: Number(id),
    weekNumber: Number(week),
    title: '',
    content: '',
    message: '笔记内容占位（mock）',
  });
});

/** 更新某一周的笔记 */
router.put('/courses/:id/notes/:week', (req: Request, res: Response) => {
  // TODO: 更新指定周次笔记的标题和内容
  const { id, week } = req.params;
  const { title, content } = req.body;
  res.json({
    courseId: Number(id),
    weekNumber: Number(week),
    title: title || '',
    content: content || '',
    message: '笔记已更新（mock）',
  });
});

/** AI 生成笔记 */
router.post('/courses/:id/notes/generate', (req: Request, res: Response) => {
  // TODO: 调用 AI 根据课程大纲和聊天记录自动生成笔记
  const { id } = req.params;
  res.json({
    courseId: Number(id),
    message: '笔记正在生成中（mock）',
  });
});

export default router;
