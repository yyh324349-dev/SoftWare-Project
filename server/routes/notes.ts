import { Router, Request, Response } from 'express';
import db from '../db';
import { generateNotes } from '../services/generator';

const router = Router();

// GET /api/courses/:id/notes - 获取课程所有笔记列表
router.get('/courses/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const notes = db.prepare(
    'SELECT * FROM topic_notes WHERE course_id = ? ORDER BY week_number ASC'
  ).all(id);
  res.json({
    courseId: Number(id),
    notes: notes || [],
  });
});

// GET /api/courses/:id/notes/:weekNum - 获取指定章节的笔记
router.get('/courses/:id/notes/:weekNum', (req: Request, res: Response) => {
  const { id, weekNum } = req.params;
  const note = db.prepare(
    'SELECT * FROM topic_notes WHERE course_id = ? AND week_number = ?'
  ).get(id, weekNum) as Record<string, any> | undefined;

  if (!note) {
    res.json({
      courseId: Number(id),
      weekNumber: Number(weekNum),
      title: '',
      content: '',
      source: null,
    });
    return;
  }

  res.json({
    id: note.id,
    courseId: Number(id),
    weekNumber: Number(weekNum),
    title: note.title,
    content: note.content,
    source: note.source || 'user',
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  });
});

// PUT /api/courses/:id/notes/:weekNum - 更新笔记
router.put('/courses/:id/notes/:weekNum', (req: Request, res: Response) => {
  const { id, weekNum } = req.params;
  const { content, title } = req.body;

  // 检查笔记是否存在
  const existing = db.prepare(
    'SELECT * FROM topic_notes WHERE course_id = ? AND week_number = ?'
  ).get(id, weekNum);

  if (existing) {
    // 更新现有笔记
    db.prepare(
      "UPDATE topic_notes SET content = ?, title = COALESCE(?, title), source = 'user', updated_at = datetime('now') WHERE course_id = ? AND week_number = ?"
    ).run(content, title, id, weekNum);
  } else {
    // 创建新笔记
    db.prepare(
      "INSERT INTO topic_notes (course_id, week_number, title, content, source) VALUES (?, ?, ?, ?, 'user')"
    ).run(id, weekNum, title || `第 ${weekNum} 周笔记`, content);
  }

  res.json({
    message: '笔记已保存',
    courseId: Number(id),
    weekNumber: Number(weekNum),
  });
});

// POST /api/courses/:id/notes/generate - AI 生成笔记
router.post('/courses/:id/notes/generate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { weekNumber } = req.body;

  try {
    // 获取课程信息
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as Record<string, string>;

    // 获取大纲信息
    const syllabus = db.prepare(
      'SELECT * FROM syllabus WHERE course_id = ? AND week_number = ?'
    ).get(id, weekNumber) as Record<string, string>;

    if (!syllabus) {
      res.status(404).json({ error: '未找到该章节' });
      return;
    }

    // 调用 AI 生成笔记
    const content = await generateNotes({
      courseTitle: course?.title || '',
      weekTopic: syllabus.topic || '',
      weekDescription: syllabus.description || '',
    });

    // 保存到数据库
    const existing = db.prepare(
      'SELECT * FROM topic_notes WHERE course_id = ? AND week_number = ?'
    ).get(id, weekNumber);

    if (existing) {
      // 追加到现有笔记（保留用户笔记）
      db.prepare(
        "UPDATE topic_notes SET content = ?, source = 'ai', updated_at = datetime('now') WHERE course_id = ? AND week_number = ?"
      ).run(content, id, weekNumber);
    } else {
      // 创建新笔记
      db.prepare(
        "INSERT INTO topic_notes (course_id, week_number, title, content, source) VALUES (?, ?, ?, ?, 'ai')"
      ).run(id, weekNumber, `第 ${weekNumber} 周: ${syllabus.topic}`, content);
    }

    res.json({
      content,
      weekNumber,
      source: 'ai',
      message: 'AI 笔记已生成',
    });
  } catch (err) {
    console.error('生成笔记失败:', err);
    res.status(500).json({ error: '生成笔记失败，请检查 API Key 配置' });
  }
});

// POST /api/courses/:id/notes/:weekNum/append - 追加用户笔记
router.post('/courses/:id/notes/:weekNum/append', (req: Request, res: Response) => {
  const { id, weekNum } = req.params;
  const { content } = req.body;

  // 检查笔记是否存在
  const existing = db.prepare(
    'SELECT * FROM topic_notes WHERE course_id = ? AND week_number = ?'
  ).get(id, weekNum) as Record<string, any> | undefined;

  if (existing) {
    // 追加内容
    const newContent = (existing.content || '') + '\n\n---\n\n' + content;
    db.prepare(
      "UPDATE topic_notes SET content = ?, updated_at = datetime('now') WHERE course_id = ? AND week_number = ?"
    ).run(newContent, id, weekNum);
  } else {
    // 创建新笔记
    db.prepare(
      "INSERT INTO topic_notes (course_id, week_number, title, content, source) VALUES (?, ?, ?, ?, 'user')"
    ).run(id, weekNum, `第 ${weekNum} 周笔记`, content);
  }

  res.json({
    message: '笔记已追加',
    courseId: Number(id),
    weekNumber: Number(weekNum),
  });
});

export default router;
