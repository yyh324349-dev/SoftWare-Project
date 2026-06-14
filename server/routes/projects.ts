import { Router, Request, Response } from 'express';
import db from '../db';
import { generateProject } from '../services/generator';

const router = Router();

// ========== 项目（Project）路由 ==========
// 挂载在 /api 下，路径以 /courses/:id/projects 开头

/** 获取课程下的所有项目列表 */
router.get('/courses/:id/projects', (req: Request, res: Response) => {
  const { id } = req.params;
  const projects = db.prepare(
    'SELECT * FROM projects WHERE course_id = ? ORDER BY id ASC'
  ).all(id);
  res.json({
    courseId: Number(id),
    projects: projects || [],
  });
});

/** 生成项目（AI 智能生成） */
router.post('/courses/:id/projects/generate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { weekNumber, topic, description } = req.body;

  // 检查是否已存在（通过 order_index 检查唯一性）
  const existing = db.prepare(
    'SELECT * FROM projects WHERE course_id = ? AND order_index = ?'
  ).get(id, weekNumber) as Record<string, any> | undefined;

  if (existing) {
    res.json({ message: '项目已存在', projectId: existing.id });
    return;
  }

  try {
    // 获取课程信息
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as Record<string, string>;

    // 调用 AI 生成项目内容
    const projectData = await generateProject({
      courseTitle: course?.title || '',
      courseDescription: course?.description || '',
      weekTopic: topic,
      weekDescription: description || '',
    });

    // 处理里程碑数据
    let milestones = projectData.milestones || [];
    if (projectData.deliverables) {
      // 非编程项目，将交付物也加入里程碑描述
      milestones = milestones.map((m: any, i: number) => ({
        ...m,
        deliverable: projectData.deliverables[i] || null,
      }));
    }

    // 创建新项目
    const result = db.prepare(
      'INSERT INTO projects (course_id, title, description, milestones, starter_code, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      projectData.title || `第 ${weekNumber} 周项目: ${topic}`,
      projectData.description || description || '',
      JSON.stringify(milestones),
      projectData.starter_code || `# 第 ${weekNumber} 周项目: ${topic}\n\n`,
      weekNumber
    );

    res.json({
      message: '项目创建成功',
      projectId: result.lastInsertRowid,
      isCode: projectData.is_code,
    });
  } catch (err) {
    console.error('生成项目失败:', err);
    // 降级处理：创建基础项目
    const result = db.prepare(
      'INSERT INTO projects (course_id, title, description, milestones, starter_code) VALUES (?, ?, ?, ?, ?)'
    ).run(
      id,
      `第 ${weekNumber} 周项目: ${topic}`,
      description || '',
      JSON.stringify([
        { title: '理解核心概念', description: `深入理解 ${topic} 的基本概念和原理` },
        { title: '完成基础任务', description: '完成项目的基础部分' },
        { title: '总结与提升', description: '总结学习成果，提升理解' },
      ]),
      `# 第 ${weekNumber} 周项目: ${topic}\n\n`
    );

    res.json({
      message: '项目创建成功（基础版）',
      projectId: result.lastInsertRowid,
      isCode: false,
    });
  }
});

/** 获取单个项目详情（含里程碑） */
router.get('/courses/:id/projects/:projId', (req: Request, res: Response) => {
  const { id, projId } = req.params;
  const project = db.prepare(
    'SELECT * FROM projects WHERE id = ? AND course_id = ?'
  ).get(projId, id) as Record<string, any> | undefined;

  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  // 解析里程碑
  let milestonesData = [];
  try {
    milestonesData = JSON.parse(project.milestones || '[]');
  } catch {
    milestonesData = [];
  }

  // 处理里程碑数据，确保格式正确
  const milestones = milestonesData.map((m: any, index: number) => {
    // 处理嵌套的 title 对象
    if (typeof m.title === 'object' && m.title !== null) {
      return {
        id: index + 1,
        title: m.title.title || `里程碑 ${index + 1}`,
        description: m.title.description || m.description || '',
        deliverable: m.title.deliverable || null,
        status: 'pending',
      };
    }
    return {
      id: index + 1,
      title: m.title || `里程碑 ${index + 1}`,
      description: m.description || '',
      deliverable: m.deliverable || null,
      status: 'pending',
    };
  });

  res.json({
    id: project.id,
    title: project.title,
    description: project.description,
    milestones,
    starterCode: project.starter_code,
  });
});

/** 更新项目里程碑状态 */
router.put(
  '/courses/:id/projects/:projId/milestones/:msId',
  (req: Request, res: Response) => {
    const { id, projId, msId } = req.params;
    const { status } = req.body;

    // 获取项目
    const project = db.prepare(
      'SELECT * FROM projects WHERE id = ? AND course_id = ?'
    ).get(projId, id) as Record<string, any> | undefined;

    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    // 解析里程碑
    let milestones = [];
    try {
      milestones = JSON.parse(project.milestones || '[]');
    } catch {
      milestones = [];
    }

    // 更新对应里程碑的状态
    const milestoneIndex = parseInt(msId) - 1;
    if (milestoneIndex >= 0 && milestoneIndex < milestones.length) {
      // 保存原始数据用于更新
      const original = milestones[milestoneIndex];
      milestones[milestoneIndex] = {
        ...original,
        status: status,
      };

      // 更新数据库
      db.prepare(
        'UPDATE projects SET milestones = ? WHERE id = ?'
      ).run(JSON.stringify(milestones), projId);

      res.json({
        message: '里程碑状态已更新',
        milestoneId: Number(msId),
        status: status,
      });
    } else {
      res.status(400).json({ error: '里程碑不存在' });
    }
  },
);

export default router;
