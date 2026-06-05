import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import AppShell from './components/layout/AppShell';
import DashboardPage from '@/components/dashboard/DashboardPage';
import CoursesPage from '@/components/courses/CoursesPage';
import CreateCoursePage from '@/components/courses/CreateCoursePage';
import CourseDetailLayout from '@/components/course-detail/CourseDetailLayout';
import OutlineTab from '@/components/course-detail/outline/OutlineTab';
import ReportPage from '@/components/report/ReportPage';
import CertificatesPage from '@/components/certificates/CertificatesPage';
import SettingsPage from '@/components/settings/SettingsPage';
import '@/globals.css';

// ========== 加载占位 ==========

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-secondary)',
      fontSize: '1rem',
    }}>
      加载中...
    </div>
  );
}

// ========== Tab 占位（队友 C 实现） ==========

function TabPlaceholder({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="course-tab-panel active" style={{ padding: '32px' }}>
      <div className="empty-state">
        <div className="empty-icon">{icon}</div>
        <div className="empty-text">{title} Tab</div>
        <div className="empty-sub">此功能由队友 C 实现</div>
      </div>
    </div>
  );
}

// ========== 路由配置 ==========

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 主应用（带 AppShell 侧边栏） */}
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/new" element={<CreateCoursePage />} />
          <Route path="/courses/:courseId" element={<CourseDetailLayout />}>
            <Route index element={<Navigate to="outline" replace />} />
            <Route path="outline" element={<OutlineTab />} />
            <Route path="notes" element={<TabPlaceholder title="笔记" icon="📝" />} />
            <Route path="labs" element={<TabPlaceholder title="实验" icon="🧪" />} />
            <Route path="chat" element={<TabPlaceholder title="对话" icon="💬" />} />
            <Route path="projects" element={<TabPlaceholder title="项目" icon="🔧" />} />
          </Route>
          <Route path="/report" element={<ReportPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 兜底 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
