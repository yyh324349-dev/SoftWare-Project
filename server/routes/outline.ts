import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';
import { generateSyllabus } from '../services/generator';

const router = Router();

// GET /api/courses/:courseId/syllabus - 获取课程大纲
router.get('/:courseId/syllabus', (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const id = Number(courseId);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: '无效的课程 ID' });
    return;
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as Record<string, unknown> | undefined;
  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const weeks = db.prepare(
    'SELECT * FROM syllabus WHERE course_id = ? ORDER BY week_number ASC'
  ).all(courseId) as Array<Record<string, unknown>>;

  const labCount = db.prepare(
    'SELECT COUNT(*) as count FROM labs WHERE course_id = ?'
  ).get(courseId) as { count: number };

  const projectCount = db.prepare(
    'SELECT COUNT(*) as count FROM projects WHERE course_id = ?'
  ).get(courseId) as { count: number };

  const sections: Array<{ title: string; weeks: Array<Record<string, unknown>> }> = [];
  const WEEKS_PER_SECTION = 3;
  const sectionNames = ['入门基础', '核心进阶', '高级专题', '实战项目'];

  for (let i = 0; i < weeks.length; i += WEEKS_PER_SECTION) {
    const chunk = weeks.slice(i, i + WEEKS_PER_SECTION);
    const sectionIndex = Math.floor(i / WEEKS_PER_SECTION);
    sections.push({
      title: `${i + 1} — ${Math.min(i + WEEKS_PER_SECTION, weeks.length)} 周 · ${sectionNames[sectionIndex] || '专题学习'}`,
      weeks: chunk.map((w: Record<string, unknown>) => ({
        id: w.id,
        weekNumber: w.week_number,
        topic: w.topic,
        description: w.description || '',
        status: w.status || 'not_started',
      })),
    });
  }

  res.json({
    courseId: Number(courseId),
    courseTitle: course.title,
    totalWeeks: weeks.length,
    labCount: labCount.count,
    projectCount: projectCount.count,
    sections,
  });
});

// POST /api/courses/:courseId/syllabus/refresh - 重新生成大纲
router.post('/:courseId/syllabus/refresh', async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const id = Number(courseId);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: '无效的课程 ID' });
    return;
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as Record<string, unknown> | undefined;
  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  try {
    const syllabusData = await generateSyllabus({
      title: course.title as string,
      description: course.description as string,
      style: (course.style as string) || 'academic',
      format: (course.format as string) || 'markdown',
    });

    if (!syllabusData || !syllabusData.weeks) {
      res.status(500).json({ error: '大纲生成失败' });
      return;
    }

    // 删除旧大纲
    db.prepare('DELETE FROM syllabus WHERE course_id = ?').run(courseId);

    const insertWeek = db.prepare(
      'INSERT INTO syllabus (course_id, week_number, topic, description) VALUES (?, ?, ?, ?)'
    );
    const insertAll = db.transaction(() => {
      for (const week of syllabusData.weeks) {
        insertWeek.run(courseId, week.week_number, week.topic, week.description || '');
      }
    });
    insertAll();

    const weeks = db.prepare(
      'SELECT * FROM syllabus WHERE course_id = ? ORDER BY week_number ASC'
    ).all(courseId);

    res.json({
      message: '大纲已重新生成',
      courseId: Number(courseId),
      totalWeeks: syllabusData.weeks.length,
      weeks,
    });
  } catch (err) {
    console.error('重新生成大纲失败:', err);
    res.status(500).json({ error: '重新生成大纲失败' });
  }
});

export default router;
