import { Router, Request, Response } from 'express';
import db from '../db';
import { chat } from '../services/ai';

const router = Router();

// ========== 聊天 & 对话主题路由 ==========
// 挂载在 /api 下，包含 /courses/:id/topics 和 /chat 两组端点

/** 获取课程下的所有对话主题 */
router.get('/courses/:id/topics', (req: Request, res: Response) => {
  const { id } = req.params;
  const topics = db.prepare(
    'SELECT * FROM topics WHERE course_id = ? ORDER BY created_at DESC'
  ).all(id);
  res.json({
    courseId: Number(id),
    topics: topics || [],
  });
});

/** 创建新对话主题 */
router.post('/courses/:id/topics', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, mode } = req.body;

  const result = db.prepare(
    'INSERT INTO topics (course_id, title, mode) VALUES (?, ?, ?)'
  ).run(id, title || '新对话', mode || 'tutor');

  res.status(201).json({
    id: result.lastInsertRowid,
    courseId: Number(id),
    title: title || '新对话',
    mode: mode || 'tutor',
    message: '对话主题已创建',
  });
});

/** 获取某个主题下的所有消息记录 */
router.get('/topics/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = db.prepare(
    'SELECT * FROM messages WHERE topic_id = ? ORDER BY created_at ASC'
  ).all(id);
  res.json({
    topicId: Number(id),
    messages: messages || [],
  });
});

/** 发送聊天消息 */
router.post('/chat', async (req: Request, res: Response) => {
  const { topicId, content } = req.body;

  // 保存用户消息
  db.prepare(
    'INSERT INTO messages (topic_id, role, content) VALUES (?, ?, ?)'
  ).run(topicId, 'user', content);

  try {
    // 获取课程信息
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId) as Record<string, string> | undefined;
    const course = topic ? db.prepare('SELECT * FROM courses WHERE id = ?').get(topic.course_id) as Record<string, string> : null;

    // 获取历史消息
    const history = db.prepare(
      'SELECT role, content FROM messages WHERE topic_id = ? ORDER BY created_at ASC'
    ).all(topicId) as Array<{ role: string; content: string }>;

    // 构建系统提示词
    const systemPrompt = `你是「墨智学堂」的 AI 学习助手，专门帮助学生学习「${course?.title || '未知课程'}」。

你的职责：
1. 耐心解答学生的问题
2. 用简单易懂的语言解释复杂概念
3. 提供具体的例子和类比帮助理解
4. 鼓励学生思考，引导他们自己发现答案
5. 使用中文回复

请根据学生的提问提供详细、有帮助的回答。`;

    // 调用 AI 生成回复
    const messages = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const reply = await chat(systemPrompt, messages, { maxTokens: 4096 });

    // 保存 AI 回复
    db.prepare(
      'INSERT INTO messages (topic_id, role, content) VALUES (?, ?, ?)'
    ).run(topicId, 'assistant', reply);

    res.json({
      topicId,
      content,
      reply,
    });
  } catch (err) {
    console.error('AI 回复失败:', err);
    const errorMsg = '抱歉，AI 服务暂时不可用。请检查 API Key 是否已配置。';

    // 保存错误消息
    db.prepare(
      'INSERT INTO messages (topic_id, role, content) VALUES (?, ?, ?)'
    ).run(topicId, 'assistant', errorMsg);

    res.json({
      topicId,
      content,
      reply: errorMsg,
    });
  }
});

export default router;
