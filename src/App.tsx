import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import AppShell from './components/layout/AppShell';
import DashboardPage from '@/components/dashboard/DashboardPage';
import CoursesPage from '@/components/courses/CoursesPage';
import CreateCoursePage from '@/components/courses/CreateCoursePage';
import CourseDetailLayout from '@/components/course-detail/CourseDetailLayout';
import OutlineTab from '@/components/course-detail/outline/OutlineTab';
import LectureTab from '@/components/course-detail/lecture/LectureTab';
import NotesTab from '@/components/course-detail/notes/NotesTab';
import ChatTab from '@/components/course-detail/chat/ChatTab';
import LabsTab from '@/components/course-detail/labs/LabsTab';
import ProjectsTab from '@/components/course-detail/projects/ProjectsTab';
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
            <Route path="lecture" element={<LectureTab />} />
            <Route path="notes" element={<NotesTab />} />
            <Route path="labs" element={<LabsTab />} />
            <Route path="chat" element={<ChatTab />} />
            <Route path="projects" element={<ProjectsTab />} />
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
