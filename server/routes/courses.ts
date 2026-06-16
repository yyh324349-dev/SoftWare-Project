import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';
import { generateSyllabus } from '../services/generator';

const router = Router();

/** 计算章节完成状态 */
function calculateChapterCompletion(courseId: number, syllabusId: number): boolean {
  // 检查讲义进度
  const lectureProgress = db.prepare(
    "SELECT status FROM lecture_progress WHERE course_id = ? AND syllabus_id = ? AND status = 'completed'"
  ).get(courseId, syllabusId);

  // 检查实验完成状态（通过 order_index 关联）
  const syllabus = db.prepare('SELECT week_number FROM syllabus WHERE id = ?').get(syllabusId) as { week_number: number } | undefined;
  const labCompleted = syllabus ? db.prepare(
    "SELECT id FROM labs WHERE course_id = ? AND order_index = ? AND status = 'completed'"
  ).get(courseId, syllabus.week_number) : null;

  // 如果讲义完成或实验完成，则认为章节完成
  return !!lectureProgress || !!labCompleted;
}

// GET /api/courses - 获取所有课程列表
router.get('/', (_req: AuthRequest, res: Response) => {
  const courses = db.prepare(`
    SELECT id, title, description, style, format, status, created_at, updated_at
    FROM courses ORDER BY created_at DESC
  `).all() as Array<Record<string, unknown>>;

  const result = courses.map((c: Record<string, unknown>) => {
    const courseId = c.id as number;

    // 获取所有章节
    const syllabusList = db.prepare(
      'SELECT id FROM syllabus WHERE course_id = ?'
    ).all(courseId) as Array<{ id: number }>;

    const chapters = syllabusList.length;

    // 计算已完成章节数
    let completedChapters = 0;
    for (const s of syllabusList) {
      if (calculateChapterCompletion(courseId, s.id)) {
        completedChapters++;
      }
    }

    const progress = chapters > 0 ? Math.round((completedChapters / chapters) * 100) : 0;

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      style: c.style,
      format: c.format,
      status: c.status,
      progress,
      chapters,
      completedChapters,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  });

  res.json({ courses: result });
});

// GET /api/courses/:id - 获取单个课程详情
router.get('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    res.status(400).json({ error: '无效的课程 ID' });
    return;
  }
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  // 获取所有章节
  const syllabusList = db.prepare(
    'SELECT id FROM syllabus WHERE course_id = ?'
  ).all(courseId) as Array<{ id: number }>;

  const chapters = syllabusList.length;

  // 计算已完成章节数
  let completedChapters = 0;
  for (const s of syllabusList) {
    if (calculateChapterCompletion(courseId, s.id)) {
      completedChapters++;
    }
  }

  const progress = chapters > 0 ? Math.round((completedChapters / chapters) * 100) : 0;

  res.json({
    id: course.id,
    title: course.title,
    description: course.description,
    style: course.style,
    format: course.format,
    status: course.status,
    progress,
    chapters,
    completedChapters,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  });
});

// POST /api/courses - 创建新课程
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, description, preferences, style, format } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: '课程标题和描述为必填项' });
    return;
  }

  const validStyles = ['minimal', 'academic', 'lively'];
  const courseStyle = validStyles.includes(style) ? style : 'academic';
  const courseFormat = format === 'md-html' ? 'md-html' : 'markdown';

  try {
    // 插入课程
    const result = db.prepare(
      'INSERT INTO courses (title, description, style, format) VALUES (?, ?, ?, ?)'
    ).run(title, description, courseStyle, courseFormat);

    const courseId = Number(result.lastInsertRowid);

    // AI 生成大纲（异步，不阻塞返回）
    generateSyllabus({
      title,
      description: description + (preferences ? `\n学习偏好：${preferences}` : ''),
      style: courseStyle,
      format: courseFormat,
    }).then((syllabusData) => {
      if (syllabusData && syllabusData.weeks) {
        const insertWeek = db.prepare(
          'INSERT INTO syllabus (course_id, week_number, topic, description) VALUES (?, ?, ?, ?)'
        );
        const insertAll = db.transaction(() => {
          for (const week of syllabusData.weeks) {
            insertWeek.run(courseId, week.week_number, week.topic, week.description || '');
          }
        });
        insertAll();
        console.log(`✅ 课程 ${courseId} 大纲已生成，共 ${syllabusData.weeks.length} 周`);
      }
    }).catch((err) => {
      console.error(`❌ 课程 ${courseId} 大纲生成失败:`, err);
    });

    // 返回新创建的课程
    const newCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as Record<string, unknown>;

    res.status(201).json({
      id: newCourse.id,
      title: newCourse.title,
      description: newCourse.description,
      style: newCourse.style,
      format: newCourse.format,
      status: newCourse.status,
      progress: 0,
      chapters: 0,
      completedChapters: 0,
      createdAt: newCourse.created_at,
      updatedAt: newCourse.updated_at,
    });
  } catch (err) {
    console.error('创建课程失败:', err);
    res.status(500).json({ error: '创建课程失败，请稍后重试' });
  }
});

// DELETE /api/courses/:id - 删除课程
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    res.status(400).json({ error: '无效的课程 ID' });
    return;
  }

  const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  res.json({ message: '课程已删除' });
});

export default router;
