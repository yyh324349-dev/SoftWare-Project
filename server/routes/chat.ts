import { Router, Request, Response } from 'express';

const router = Router();

// ========== 聊天 & 对话主题路由 ==========
// 挂载在 /api 下，包含 /courses/:id/topics 和 /chat 两组端点

/** 获取课程下的所有对话主题 */
router.get('/courses/:id/topics', (req: Request, res: Response) => {
  // TODO: 查询课程下的对话主题列表
  const { id } = req.params;
  res.json({
    courseId: Number(id),
    topics: [],
  });
});

/** 创建新对话主题 */
router.post('/courses/:id/topics', (req: Request, res: Response) => {
  // TODO: 在指定课程下创建新的对话主题
  const { id } = req.params;
  const { title, mode } = req.body;
  res.status(201).json({
    id: 1,
    courseId: Number(id),
    title: title || '新对话',
    mode: mode || 'tutor',
    message: '对话主题已创建（mock）',
  });
});

/** 获取某个主题下的所有消息记录 */
router.get('/topics/:id/messages', (req: Request, res: Response) => {
  // TODO: 查询指定主题的历史消息
  const { id } = req.params;
  res.json({
    topicId: Number(id),
    messages: [],
  });
});

/** 发送聊天消息（SSE 流式响应） */
router.post('/chat', (req: Request, res: Response) => {
  // TODO: 接收用户消息 → 调用 AI → 以 SSE 流式返回回复
  // 目前返回 mock 响应
  const { topicId, content } = req.body;
  res.json({
    topicId,
    content: content || '',
    reply: '这是一条 mock 回复，正式版将使用 SSE 流式输出',
  });
});

export default router;
