import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { get } from '@/lib/api';

const TABS = [
  {
    key: 'outline',
    label: '大纲',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
    ),
  },
  {
    key: 'lecture',
    label: '讲义',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: 'notes',
    label: '笔记',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'labs',
    label: '实验',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <path d="M8.5 2h7" />
      </svg>
    ),
  },
  {
    key: 'chat',
    label: '对话',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    key: 'projects',
    label: '项目',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      </svg>
    ),
  },
];

interface CourseInfo {
  id: number;
  title: string;
}

export default function CourseDetailLayout() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [fabOpen, setFabOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');

  // 从 URL 中提取当前 tab
  const currentTab = location.pathname.split('/').pop() || 'outline';

  // 获取课程名称
  useEffect(() => {
    if (!courseId) return;
    get<CourseInfo>(`/courses/${courseId}`)
      .then((res) => {
        setCourseTitle(res.title);
      })
      .catch(() => {
        setCourseTitle('课程详情');
      });
  }, [courseId]);

  const switchTab = (tab: string) => {
    setFabOpen(false);
    navigate(`/courses/${courseId}/${tab}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', animation: 'pageEnter 0.4s ease' }}>
      <div className="course-fullscreen-content">
        {/* Tab 栏 */}
        <div className="course-visible-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`vt-tab ${currentTab === tab.key ? 'active' : ''}`}
              onClick={() => switchTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="course-tab-panel active">
          <Outlet context={{ courseTitle }} />
        </div>

        {/* FAB 浮动导航 */}
        <div className={`course-fab ${fabOpen ? 'open' : ''}`}>
          <button className="fab-trigger" onClick={() => setFabOpen(!fabOpen)}>
            {fabOpen ? '✕' : '☰'}
          </button>
          <div className="fab-menu">
            <button className="fab-back" onClick={() => navigate('/courses')}>
              ← 返回课程列表
            </button>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`fab-item ${currentTab === tab.key ? 'active' : ''}`}
                onClick={() => switchTab(tab.key)}
              >
                <span className="fab-item-icon">{tab.icon}</span>
                <span className="fab-item-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
