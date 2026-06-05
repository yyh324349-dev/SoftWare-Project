import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/certificates - 获取所有证书
router.get('/', (_req: AuthRequest, res: Response) => {
  const certs = db.prepare(`
    SELECT c.id, c.title, c.description, c.issued_at, c.grade,
           COALESCE(c.course_title, co.title) as course_title
    FROM certificates c
    LEFT JOIN courses co ON c.course_id = co.id
    ORDER BY c.issued_at DESC
  `).all() as Array<Record<string, unknown>>;

  // 获取所有课程（用于未获得证书的课程）
  const certCourseIds = db.prepare(
    'SELECT DISTINCT course_id FROM certificates'
  ).all() as Array<{ course_id: number }>;

  const certIds = certCourseIds.map(c => c.course_id);
  let inProgressCourses: Array<Record<string, unknown>> = [];

  if (certIds.length > 0) {
    const placeholders = certIds.map(() => '?').join(',');
    inProgressCourses = db.prepare(
      `SELECT id, title FROM courses WHERE id NOT IN (${placeholders}) AND status = 'active'`
    ).all(...certIds) as Array<Record<string, unknown>>;
  } else {
    inProgressCourses = db.prepare(
      "SELECT id, title FROM courses WHERE status = 'active'"
    ).all() as Array<Record<string, unknown>>;
  }

  // 已获得证书 - 从数据库读取成绩
  const earnedCerts = certs.map((c: Record<string, unknown>) => ({
    id: c.id,
    courseTitle: c.course_title || c.title,
    issuedAt: c.issued_at as string,
    grade: c.grade || '良好 (B+)',
    verified: true,
    locked: false,
  }));

  // 未获得证书
  const lockedCerts = inProgressCourses.map((c: Record<string, unknown>) => {
    const syllabusCount = db.prepare(
      'SELECT COUNT(*) as count FROM syllabus WHERE course_id = ?'
    ).get(c.id) as { count: number };
    const completedCount = db.prepare(
      "SELECT COUNT(*) as count FROM syllabus WHERE course_id = ? AND status = 'done'"
    ).get(c.id) as { count: number };

    const progress = syllabusCount.count > 0
      ? Math.round((completedCount.count / syllabusCount.count) * 100)
      : 0;

    const remaining = syllabusCount.count - completedCount.count;
    const months = remaining > 6 ? '2' : '1';

    return {
      id: -(c.id as number), // 负数表示未获得
      courseTitle: c.title,
      issuedAt: '',
      grade: '',
      verified: false,
      progress,
      estimatedCompletion: `2026 年 ${String(Number(months) + 6).padStart(2, '0')} 月`,
      locked: true,
    };
  });

  const result = [...earnedCerts, ...lockedCerts];
  res.json({ certificates: result });
});

export default router;
