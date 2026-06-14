import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';
import { generateLectureOutline, generateSectionContent } from '../services/generator';
import type { LectureStyle } from '../prompts/lecture';

const router = Router();

// GET /api/courses/:courseId/lectures - 获取课程所有章节及小节
router.get('/courses/:courseId/lectures', (req: AuthRequest, res: Response) => {
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

  // 获取大纲列表
  const syllabusList = db.prepare(
    'SELECT * FROM syllabus WHERE course_id = ? ORDER BY week_number ASC'
  ).all(courseId) as Array<Record<string, unknown>>;

  // 组装数据：每个大纲项包含其小节列表
  const chapters = syllabusList.map(s => {
    // 获取该章节的小节列表
    const outlines = db.prepare(
      'SELECT * FROM lecture_outlines WHERE syllabus_id = ? ORDER BY section_index ASC'
    ).all(s.id) as Array<Record<string, unknown>>;

    // 获取每个小节的内容状态
    const sections = outlines.map(o => {
      const content = db.prepare(
        'SELECT * FROM lecture_section_contents WHERE outline_id = ?'
      ).get(o.id) as Record<string, unknown> | undefined;

      return {
        id: o.id,
        sectionIndex: o.section_index,
        title: o.section_title,
        estimatedMinutes: o.estimated_minutes || 0,
        hasContent: !!content?.content,
        contentId: content?.id || null,
        status: content?.status || 'not_started',
      };
    });

    return {
      id: s.id,
      weekNumber: s.week_number,
      topic: s.topic,
      description: s.description || '',
      hasOutline: sections.length > 0,
      sections,
    };
  });

  res.json({
    courseId: Number(courseId),
    courseTitle: course.title,
    courseDescription: course.description || '',
    style: course.style || 'academic',
    chapters,
  });
});

// POST /api/courses/:courseId/syllabus/:syllabusId/outline/generate - 生成小节列表
router.post('/courses/:courseId/syllabus/:syllabusId/outline/generate', async (req: AuthRequest, res: Response) => {
  const { courseId, syllabusId } = req.params;
  const cid = Number(courseId);
  const sid = Number(syllabusId);

  if (!Number.isInteger(cid) || cid <= 0 || !Number.isInteger(sid) || sid <= 0) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as Record<string, unknown> | undefined;
  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const syllabus = db.prepare('SELECT * FROM syllabus WHERE id = ? AND course_id = ?').get(syllabusId, courseId) as Record<string, unknown> | undefined;
  if (!syllabus) {
    res.status(404).json({ error: '大纲周次不存在' });
    return;
  }

  try {
    // 检查是否已存在小节列表
    const existing = db.prepare(
      'SELECT COUNT(*) as count FROM lecture_outlines WHERE syllabus_id = ?'
    ).get(syllabusId) as { count: number };

    if (existing.count > 0) {
      // 已存在，直接返回
      const outlines = db.prepare(
        'SELECT * FROM lecture_outlines WHERE syllabus_id = ? ORDER BY section_index ASC'
      ).all(syllabusId) as Array<Record<string, unknown>>;

      res.json({
        syllabusId: Number(syllabusId),
        sections: outlines.map(o => ({
          id: o.id,
          sectionIndex: o.section_index,
          title: o.section_title,
          estimatedMinutes: o.estimated_minutes || 0,
        })),
        message: '小节列表已存在',
      });
      return;
    }

    // 调用 AI 生成小节列表
    const outlineData = await generateLectureOutline({
      courseTitle: course.title as string,
      courseDescription: course.description as string,
      weekNumber: syllabus.week_number as number,
      weekTopic: syllabus.topic as string,
      weekDescription: (syllabus.description as string) || '',
      style: (course.style as string) || 'khanmigo',
    });

    if (!outlineData || !Array.isArray(outlineData)) {
      res.status(500).json({ error: '小节列表生成失败' });
      return;
    }

    // 保存到数据库
    const insertOutline = db.prepare(
      'INSERT INTO lecture_outlines (course_id, syllabus_id, section_index, section_title, estimated_minutes) VALUES (?, ?, ?, ?, ?)'
    );

    const insertAll = db.transaction(() => {
      for (let i = 0; i < outlineData.length; i++) {
        const section = outlineData[i];
        insertOutline.run(
          courseId,
          syllabusId,
          i,
          section.title,
          section.estimated_minutes || 0
        );
      }
    });
    insertAll();

    // 返回生成的小节列表
    const outlines = db.prepare(
      'SELECT * FROM lecture_outlines WHERE syllabus_id = ? ORDER BY section_index ASC'
    ).all(syllabusId) as Array<Record<string, unknown>>;

    res.json({
      syllabusId: Number(syllabusId),
      sections: outlines.map(o => ({
        id: o.id,
        sectionIndex: o.section_index,
        title: o.section_title,
        estimatedMinutes: o.estimated_minutes || 0,
      })),
      message: '小节列表生成成功',
    });
  } catch (err) {
    console.error('生成小节列表失败:', err);
    res.status(500).json({ error: '生成小节列表失败' });
  }
});

// POST /api/lecture-outlines/:outlineId/content/generate - 生成小节详细内容
router.post('/lecture-outlines/:outlineId/content/generate', async (req: AuthRequest, res: Response) => {
  const { outlineId } = req.params;
  const oid = Number(outlineId);

  if (!Number.isInteger(oid) || oid <= 0) {
    res.status(400).json({ error: '无效的小节 ID' });
    return;
  }

  const outline = db.prepare('SELECT * FROM lecture_outlines WHERE id = ?').get(outlineId) as Record<string, unknown> | undefined;
  if (!outline) {
    res.status(404).json({ error: '小节不存在' });
    return;
  }

  // 获取课程和大纲信息
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(outline.course_id) as Record<string, unknown> | undefined;
  const syllabus = db.prepare('SELECT * FROM syllabus WHERE id = ?').get(outline.syllabus_id) as Record<string, unknown> | undefined;

  if (!course || !syllabus) {
    res.status(404).json({ error: '关联数据不存在' });
    return;
  }

  try {
    // 检查是否强制重新生成
    const forceRegenerate = req.query.force === 'true';

    // 检查是否已存在内容
    const existing = db.prepare(
      'SELECT * FROM lecture_section_contents WHERE outline_id = ?'
    ).get(outlineId) as Record<string, unknown> | undefined;

    if (existing?.content && !forceRegenerate) {
      res.json({
        id: existing.id,
        outlineId: Number(outlineId),
        content: existing.content,
        status: existing.status,
        message: '内容已存在',
      });
      return;
    }

    // 如果强制重新生成，删除旧内容
    if (forceRegenerate && existing) {
      db.prepare('DELETE FROM lecture_section_contents WHERE id = ?').run(existing.id);
    }

    // 获取该章节的总小节数
    const totalSections = db.prepare(
      'SELECT COUNT(*) as count FROM lecture_outlines WHERE syllabus_id = ?'
    ).get(outline.syllabus_id) as { count: number };

    // 调用 AI 生成该小节的详细内容
    const content = await generateSectionContent({
      courseTitle: course.title as string,
      courseDescription: course.description as string,
      weekNumber: syllabus.week_number as number,
      weekTopic: syllabus.topic as string,
      weekDescription: (syllabus.description as string) || '',
      sectionTitle: outline.section_title as string,
      sectionIndex: outline.section_index as number,
      totalSections: totalSections.count,
      style: ((course.style as string) || 'khanmigo') as LectureStyle,
    });

    if (!content) {
      res.status(500).json({ error: '内容生成失败' });
      return;
    }

    // 保存到数据库
    if (existing) {
      // 更新现有记录
      db.prepare(
        'UPDATE lecture_section_contents SET content = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).run(content, 'in_progress', existing.id);

      res.json({
        id: existing.id,
        outlineId: Number(outlineId),
        content: content,
        status: 'in_progress',
        message: '内容生成成功',
      });
    } else {
      // 创建新记录
      const result = db.prepare(
        'INSERT INTO lecture_section_contents (outline_id, content, status) VALUES (?, ?, ?)'
      ).run(outlineId, content, 'in_progress');

      res.json({
        id: result.lastInsertRowid,
        outlineId: Number(outlineId),
        content: content,
        status: 'in_progress',
        message: '内容生成成功',
      });
    }
  } catch (err) {
    console.error('生成小节内容失败:', err);
    res.status(500).json({ error: '生成小节内容失败' });
  }
});

// GET /api/lecture-section-contents/:contentId - 获取小节内容
router.get('/lecture-section-contents/:contentId', (req: AuthRequest, res: Response) => {
  const { contentId } = req.params;
  const cid = Number(contentId);

  if (!Number.isInteger(cid) || cid <= 0) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }

  const content = db.prepare(
    'SELECT * FROM lecture_section_contents WHERE id = ?'
  ).get(contentId) as Record<string, unknown> | undefined;

  if (!content) {
    res.status(404).json({ error: '内容不存在' });
    return;
  }

  res.json({
    id: content.id,
    outlineId: content.outline_id,
    content: content.content,
    status: content.status,
  });
});

// PUT /api/lecture-section-contents/:contentId/progress - 更新小节进度
router.put('/lecture-section-contents/:contentId/progress', (req: AuthRequest, res: Response) => {
  const { contentId } = req.params;
  const { status } = req.body;

  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    res.status(400).json({ error: '无效的状态值' });
    return;
  }

  const content = db.prepare(
    'SELECT * FROM lecture_section_contents WHERE id = ?'
  ).get(contentId) as Record<string, unknown> | undefined;

  if (!content) {
    res.status(404).json({ error: '内容不存在' });
    return;
  }

  // 更新小节状态
  db.prepare(
    'UPDATE lecture_section_contents SET status = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(status, contentId);

  // 获取该小节所属的 outline
  const outline = db.prepare(
    'SELECT * FROM lecture_outlines WHERE id = ?'
  ).get(content.outline_id) as Record<string, unknown> | undefined;

  if (outline) {
    // 检查该章节的所有小节是否都完成
    const allOutlines = db.prepare(
      'SELECT id FROM lecture_outlines WHERE syllabus_id = ?'
    ).all(outline.syllabus_id) as Array<{ id: number }>;

    const completedContents = db.prepare(
      "SELECT id FROM lecture_section_contents WHERE outline_id IN (SELECT id FROM lecture_outlines WHERE syllabus_id = ?) AND status = 'completed'"
    ).all(outline.syllabus_id) as Array<{ id: number }>;

    // 如果所有小节都完成，更新 lecture_progress
    if (allOutlines.length > 0 && completedContents.length >= allOutlines.length) {
      db.prepare(
        "INSERT OR REPLACE INTO lecture_progress (course_id, syllabus_id, status, completed_at) VALUES (?, ?, 'completed', datetime('now'))"
      ).run(outline.course_id, outline.syllabus_id);

      // 记录学习时长（完成一个章节约2小时）
      db.prepare(
        "INSERT INTO learning_sessions (course_id, started_at, ended_at, duration_minutes, activity_type) VALUES (?, datetime('now'), datetime('now'), 120, '完成章节讲义')"
      ).run(outline.course_id);
    } else if (completedContents.length > 0) {
      // 部分完成
      db.prepare(
        "INSERT OR REPLACE INTO lecture_progress (course_id, syllabus_id, status) VALUES (?, ?, 'in_progress')"
      ).run(outline.course_id, outline.syllabus_id);
    }
  }

  res.json({ message: '进度已更新', status });
});

export default router;
