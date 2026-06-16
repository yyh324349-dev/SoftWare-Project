import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '@/lib/api';

interface DashboardStats {
  activeCourses: number;
  overallProgress: number;
  pendingChapters: number;
  certificates: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeCourses: 0,
    overallProgress: 0,
    pendingChapters: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取课程列表
        const coursesData = await get<{ courses: Array<{ id: number; status: string; progress: number; chapters: number; completedChapters: number }> }>('/courses');
        const courses = coursesData.courses || [];

        // 获取证书数据
        const certsData = await get<{ certificates: Array<{ locked: boolean }> }>('/certificates');
        const certs = certsData.certificates || [];

        // 计算统计数据
        const activeCourses = courses.filter(c => c.status === 'active').length;
        const totalChapters = courses.reduce((sum, c) => sum + c.chapters, 0);
        const completedChapters = courses.reduce((sum, c) => sum + c.completedChapters, 0);
        const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
        const pendingChapters = totalChapters - completedChapters;
        const earnedCerts = certs.filter(c => !c.locked).length;

        setStats({
          activeCourses,
          overallProgress,
          pendingChapters,
          certificates: earnedCerts,
        });
      } catch (err) {
        console.error('获取仪表盘数据失败:', err);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="page" style={{ animation: 'pageEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* 页面标题区 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="breadcrumb">首页 / <span>仪表板</span></div>
          <h1>欢迎回来，学习者</h1>
          <p>继续你的学习之旅</p>
        </div>
        <button
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '8px 12px',
            cursor: 'pointer', color: 'var(--text-tertiary)',
            transition: 'var(--transition)', display: 'flex',
            alignItems: 'center', gap: '6px', fontSize: '13px',
          }}
          onClick={() => navigate('/settings')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 2h-1l-.5 1.7a8.5 8.5 0 0 0-2.3 1.3l-1.7-.5-1 1 .5 1.7a8.5 8.5 0 0 0-1.3 2.3l-1.7.5v1l1.7.5c.3.8.7 1.6 1.3 2.3l-.5 1.7 1 1 1.7-.5a8.5 8.5 0 0 0 2.3 1.3l.5 1.7h1l.5-1.7a8.5 8.5 0 0 0 2.3-1.3l1.7.5 1-1-.5-1.7a8.5 8.5 0 0 0 1.3-2.3l1.7-.5v-1l-1.7-.5a8.5 8.5 0 0 0-1.3-2.3l.5-1.7-1-1-1.7.5A8.5 8.5 0 0 0 13 3.7L12.5 2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          设置
        </button>
      </div>

      {/* 导航卡片网格 */}
      <div className="nav-card-grid">
        <div className="nav-card-item" onClick={() => navigate('/courses')}>
          <div className="nc-icon" style={{ background: 'rgba(124,109,240,0.12)', color: 'var(--accent-purple)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <div className="nc-title">我的课程</div>
        </div>
        <div className="nav-card-item" onClick={() => navigate('/courses/new')}>
          <div className="nc-icon" style={{ background: 'rgba(74,143,231,0.12)', color: 'var(--accent-blue)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="nc-title">创建课程</div>
        </div>
        <div className="nav-card-item" onClick={() => navigate('/report')}>
          <div className="nc-icon" style={{ background: 'var(--gold-glow)', color: 'var(--gold)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="nc-title">学习报告</div>
        </div>
        <div className="nav-card-item" onClick={() => navigate('/certificates')}>
          <div className="nc-icon" style={{ background: 'var(--jade-glow)', color: 'var(--jade)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div className="nc-title">我的证书</div>
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div className="stat-value">{loading ? '...' : stats.activeCourses}</div>
          <div className="stat-label">进行中的课程</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-value">{loading ? '...' : `${stats.overallProgress}%`}</div>
          <div className="stat-label">整体完成度</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-value">{loading ? '...' : stats.pendingChapters}</div>
          <div className="stat-label">待学章节</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <div className="stat-value">{loading ? '...' : stats.certificates}</div>
          <div className="stat-label">已获证书</div>
        </div>
      </div>
    </div>
  );
}
