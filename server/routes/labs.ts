import { Router, Request, Response } from 'express';
import db from '../db';
import { generateLab } from '../services/generator';

const router = Router();

// ========== 实验（Lab）路由 ==========
// 挂载在 /api 下，路径以 /courses/:id/labs 开头

/** 获取课程下的所有实验列表 */
router.get('/courses/:id/labs', (req: Request, res: Response) => {
  const { id } = req.params;
  const labs = db.prepare(
    'SELECT * FROM labs WHERE course_id = ? ORDER BY order_index ASC'
  ).all(id);
  res.json({
    courseId: Number(id),
    labs: labs || [],
  });
});

/** 生成实验（AI 智能生成） */
router.post('/courses/:id/labs/generate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { weekNumber, topic, description } = req.body;

  // 检查是否已存在
  const existing = db.prepare(
    'SELECT * FROM labs WHERE course_id = ? AND order_index = ?'
  ).get(id, weekNumber);

  if (existing) {
    res.json({ message: '实验已存在', labId: existing.id });
    return;
  }

  try {
    // 获取课程信息
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as Record<string, string>;

    // 调用 AI 生成实验内容
    const labData = await generateLab({
      courseTitle: course?.title || '',
      courseDescription: course?.description || '',
      weekTopic: topic,
      weekDescription: description || '',
    });

    // 根据是否为代码类实验存储不同数据
    const testCases = labData.is_code
      ? JSON.stringify(labData.test_cases || [])
      : JSON.stringify(labData.questions || []);

    // 创建新实验
    const result = db.prepare(
      'INSERT INTO labs (course_id, title, description, instructions, starter_code, test_cases, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      labData.title || `第 ${weekNumber} 周实验: ${topic}`,
      labData.description || description || '',
      labData.instructions || '',
      labData.starter_code || `# 第 ${weekNumber} 周实验: ${topic}\n\n`,
      testCases,
      weekNumber
    );

    res.json({
      message: '实验创建成功',
      labId: result.lastInsertRowid,
      isCode: labData.is_code,
    });
  } catch (err) {
    console.error('生成实验失败:', err);
    // 降级处理：创建基础实验
    const result = db.prepare(
      'INSERT INTO labs (course_id, title, description, instructions, starter_code, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      `第 ${weekNumber} 周实验: ${topic}`,
      description || '',
      `# ${topic}\n\n## 实验目标\n${description || '完成本实验'}`,
      `# 第 ${weekNumber} 周实验: ${topic}\n\n`,
      weekNumber
    );

    res.json({
      message: '实验创建成功（基础版）',
      labId: result.lastInsertRowid,
      isCode: false,
    });
  }
});

/** 获取单个实验详情（含文件列表） */
router.get('/courses/:id/labs/:labId', (req: Request, res: Response) => {
  const { id, labId } = req.params;
  const lab = db.prepare(
    'SELECT * FROM labs WHERE id = ? AND course_id = ?'
  ).get(labId, id);

  if (!lab) {
    res.status(404).json({ error: '实验不存在' });
    return;
  }

  res.json({
    id: lab.id,
    title: lab.title,
    description: lab.description,
    instructions: lab.instructions,
    starterCode: lab.starter_code,
    testCases: lab.test_cases,
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
