import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

/** 计算章节完成状态 */
function isChapterCompleted(courseId: number, syllabusId: number): boolean {
  // 检查讲义进度
  const lectureProgress = db.prepare(
    "SELECT id FROM lecture_progress WHERE course_id = ? AND syllabus_id = ? AND status = 'completed'"
  ).get(courseId, syllabusId);

  // 检查实验完成状态
  const syllabus = db.prepare('SELECT week_number FROM syllabus WHERE id = ?').get(syllabusId) as { week_number: number } | undefined;
  const labCompleted = syllabus ? db.prepare(
    "SELECT id FROM labs WHERE course_id = ? AND order_index = ? AND status = 'completed'"
  ).get(courseId, syllabus.week_number) : null;

  return !!lectureProgress || !!labCompleted;
}

// GET /api/report - 获取学习报告数据
router.get('/', (_req: AuthRequest, res: Response) => {
  // 统计：总学习章节数
  const allSyllabus = db.prepare(
    'SELECT course_id, id FROM syllabus'
  ).all() as Array<{ course_id: number; id: number }>;

  let totalChapters = 0;
  for (const s of allSyllabus) {
    if (isChapterCompleted(s.course_id, s.id)) {
      totalChapters++;
    }
  }

  // 统计：总学习时长（从 learning_sessions 表）
  const totalDuration = db.prepare(
    'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM learning_sessions'
  ).get() as { total: number };

  // 如果没有学习记录，根据完成的任务估算时长
  let totalHours = Math.round((totalDuration.total / 60) * 10) / 10;
  if (totalHours === 0) {
    // 估算：每个完成的章节约2小时，每个实验约1小时
    const completedLabsCount = db.prepare(
      "SELECT COUNT(*) as count FROM labs WHERE status = 'completed'"
    ).get() as { count: number };
    totalHours = totalChapters * 2 + completedLabsCount.count;
  }

  // 统计：已完成实验数
  const completedLabs = db.prepare(
    "SELECT COUNT(*) as count FROM labs WHERE status = 'completed'"
  ).get() as { count: number };

  // 统计：已获得证书数
  const certificates = db.prepare(
    'SELECT COUNT(*) as count FROM certificates'
  ).get() as { count: number };

  // 统计：AI 问答次数
  const aiQueries = db.prepare(
    "SELECT COUNT(*) as count FROM messages WHERE role = 'user'"
  ).get() as { count: number };

  // 统计：连续学习天数（基于消息和学习记录）
  const messageDays = db.prepare(`
    SELECT COUNT(DISTINCT date(created_at)) as count
    FROM messages
    WHERE created_at >= datetime('now', '-30 days')
  `).get() as { count: number };

  const sessionDays = db.prepare(`
    SELECT COUNT(DISTINCT date(started_at)) as count
    FROM learning_sessions
    WHERE started_at >= datetime('now', '-30 days')
  `).get() as { count: number };

  const streakDays = Math.max(messageDays.count, sessionDays.count);

  // 本周学习时长分布
  const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  let weeklyHours = DAY_NAMES.map(day => ({ day, hours: 0 }));

  // 从 learning_sessions 获取真实数据
  const weeklyRaw = db.prepare(`
    SELECT CAST(strftime('%w', started_at) AS INTEGER) as day_of_week,
           ROUND(SUM(COALESCE(duration_minutes, 0)) / 60.0, 1) as hours
    FROM learning_sessions
    WHERE started_at >= datetime('now', '-7 days')
    GROUP BY day_of_week
    ORDER BY day_of_week
  `).all() as Array<{ day_of_week: number; hours: number }>;

  weeklyRaw.forEach(r => {
    if (r.day_of_week >= 0 && r.day_of_week < 7) {
      weeklyHours[r.day_of_week].hours = r.hours;
    }
  });

  // 如果没有真实数据，根据消息活动估算
  const hasWeeklyData = weeklyRaw.some(r => r.hours > 0);
  if (!hasWeeklyData) {
    const recentMessages = db.prepare(`
      SELECT CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
             COUNT(*) as msg_count
      FROM messages
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY day_of_week
    `).all() as Array<{ day_of_week: number; msg_count: number }>;

    recentMessages.forEach(m => {
      if (m.day_of_week >= 0 && m.day_of_week < 7) {
        // 每10条消息约等于1小时学习
        weeklyHours[m.day_of_week].hours = Math.round((m.msg_count / 10) * 10) / 10;
      }
    });
  }

  // 课程完成进度
  const courses = db.prepare('SELECT id, title FROM courses ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const colors = ['var(--gold)', 'var(--jade)', 'var(--accent-purple)', 'var(--warning)', 'var(--accent-blue)'];
  const courseProgress = courses.map((c: Record<string, unknown>, i: number) => {
    const courseId = c.id as number;
    const syllabusList = db.prepare(
      'SELECT id FROM syllabus WHERE course_id = ?'
    ).all(courseId) as Array<{ id: number }>;

    let completedCount = 0;
    for (const s of syllabusList) {
      if (isChapterCompleted(courseId, s.id)) {
        completedCount++;
      }
    }

    const progress = syllabusList.length > 0
      ? Math.round((completedCount / syllabusList.length) * 100)
      : 0;

    return { name: c.title as string, progress, color: colors[i % colors.length] };
  });

  // 最近学习记录
  let recentRecords: Array<{ date: string; content: string; duration: string; status: string }> = [];

  // 从 learning_sessions 获取
  const recentSessions = db.prepare(`
    SELECT ls.started_at, ls.duration_minutes, ls.activity_type,
           COALESCE(c.title, '') as course_title
    FROM learning_sessions ls
    LEFT JOIN courses c ON ls.course_id = c.id
    ORDER BY ls.started_at DESC
    LIMIT 5
  `).all() as Array<{ started_at: string; duration_minutes: number; activity_type: string; course_title: string }>;

  recentSessions.forEach(r => {
    recentRecords.push({
      date: r.started_at.slice(0, 10),
      content: r.activity_type || r.course_title || '学习活动',
      duration: `${Math.round((r.duration_minutes || 0) / 6) / 10}h`,
      status: 'completed',
    });
  });

  // 从消息记录补充
  if (recentRecords.length < 5) {
    const recentMsgs = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count,
             MIN(created_at) as first_msg
      FROM messages
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 5
    `).all() as Array<{ date: string; count: number; first_msg: string }>;

    recentMsgs.forEach(m => {
      if (!recentRecords.find(r => r.date === m.date)) {
        recentRecords.push({
          date: m.date,
          content: `AI 对话学习 (${m.count} 条消息)`,
          duration: `${Math.round((m.count / 10) * 10) / 10}h`,
          status: 'completed',
        });
      }
    });
  }

  // 从讲义完成记录补充
  if (recentRecords.length < 5) {
    const recentLectures = db.prepare(`
      SELECT date(completed_at) as date, COUNT(*) as count
      FROM lecture_progress
      WHERE status = 'completed' AND completed_at IS NOT NULL
      GROUP BY date(completed_at)
      ORDER BY date DESC
      LIMIT 5
    `).all() as Array<{ date: string; count: number }>;

    recentLectures.forEach(l => {
      if (!recentRecords.find(r => r.date === l.date)) {
        recentRecords.push({
          date: l.date,
          content: `完成 ${l.count} 个章节讲义`,
          duration: `${l.count * 2}h`,
          status: 'completed',
        });
      }
    });
  }

  // 按日期排序
  recentRecords.sort((a, b) => b.date.localeCompare(a.date));
  recentRecords = recentRecords.slice(0, 10);

  res.json({
    stats: {
      totalChapters,
      totalHours,
      completedLabs: completedLabs.count,
      certificates: certificates.count,
      aiQueries: aiQueries.count,
      streakDays,
    },
    weeklyHours,
    courseProgress,
    recentRecords,
  });
});

export default router;
