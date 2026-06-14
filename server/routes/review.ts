import { Router, Request, Response } from 'express';
import db from '../db';
import { chat } from '../services/ai';
import { getReviewPrompt } from '../prompts/review';

const router = Router();

// POST /api/review - AI 评审
router.post('/review', async (req: Request, res: Response) => {
  const { courseId, itemId, itemType, code } = req.body;

  if (!code) {
    res.status(400).json({ error: '提交内容不能为空' });
    return;
  }

  try {
    // 获取课程信息
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as Record<string, string>;

    // 获取实验或项目信息
    let item: Record<string, string> | undefined;
    if (itemType === 'lab') {
      item = db.prepare('SELECT * FROM labs WHERE id = ?').get(itemId) as Record<string, string>;
    } else {
      item = db.prepare('SELECT * FROM projects WHERE id = ?').get(itemId) as Record<string, string>;
    }

    if (!item) {
      res.status(404).json({ error: '未找到对应的实验或项目' });
      return;
    }

    // 生成评审提示词
    const { system, user } = getReviewPrompt({
      courseTitle: course?.title || '',
      itemTitle: item.title || '',
      itemDescription: item.description || '',
      itemType: itemType,
      code: code,
      instructions: item.instructions || '',
    });

    // 调用 AI 评审
    const review = await chat(system, [{ role: 'user', content: user }], { maxTokens: 4096 });

    res.json({
      review,
      itemId,
      itemType,
    });
  } catch (err) {
    console.error('AI 评审失败:', err);
    res.status(500).json({ error: 'AI 评审失败，请稍后重试' });
  }
});

// POST /api/review/submit - 提交评审结果并更新状态
router.post('/review/submit', async (req: Request, res: Response) => {
  const { courseId, itemId, itemType, score } = req.body;

  try {
    let activityType = '';
    let durationMinutes = 30;

    if (itemType === 'lab') {
      // 更新实验状态
      db.prepare('UPDATE labs SET status = ? WHERE id = ?').run(
        score >= 60 ? 'completed' : 'in_progress',
        itemId
      );
      activityType = '完成实验';
      durationMinutes = 45;
    } else {
      // 更新项目里程碑状态
      if (req.body.milestoneId) {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(itemId) as Record<string, string>;
        if (project) {
          let milestones = JSON.parse(project.milestones || '[]');
          const milestoneIndex = req.body.milestoneId - 1;
          if (milestoneIndex >= 0 && milestoneIndex < milestones.length) {
            milestones[milestoneIndex].status = score >= 60 ? 'completed' : 'in_progress';
            db.prepare('UPDATE projects SET milestones = ? WHERE id = ?').run(
              JSON.stringify(milestones),
              itemId
            );
          }
        }
      }
      activityType = '完成项目里程碑';
      durationMinutes = 60;
    }

    // 记录学习时长
    if (score >= 60 && courseId) {
      db.prepare(
        "INSERT INTO learning_sessions (course_id, started_at, ended_at, duration_minutes, activity_type) VALUES (?, datetime('now'), datetime('now'), ?, ?)"
      ).run(courseId, durationMinutes, activityType);
    }

    res.json({
      message: '评审结果已保存',
      score,
      passed: score >= 60,
    });
  } catch (err) {
    console.error('保存评审结果失败:', err);
    res.status(500).json({ error: '保存失败' });
  }
});

export default router;
