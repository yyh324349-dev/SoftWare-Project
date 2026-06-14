import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, del } from '@/lib/api';
import type { Course } from '@/types';
import CourseCard from './CourseCard';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setDeletingId] = useState<number | null>(null);

  const fetchCourses = () => {
    get<{ courses: Course[] }>('/courses')
      .then((data) => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (courseId: number) => {
    if (!confirm('确定要删除这个课程吗？删除后无法恢复。')) {
      return;
    }

    setDeletingId(courseId);
    try {
      await del(`/courses/${courseId}`);
      // 从列表中移除
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
        <div className="page-header">
          <div className="breadcrumb">
            <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
            <span className="sep">/</span>
            <span>我的课程</span>
          </div>
          <h1>我的课程</h1>
          <p>管理你所有的学习课程，追踪学习进度</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-text">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
        <div className="page-header">
          <div className="breadcrumb">
            <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
            <span className="sep">/</span>
            <span>我的课程</span>
          </div>
          <h1>我的课程</h1>
          <p>管理你所有的学习课程，追踪学习进度</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-text">加载失败：{error}</div>
          <div className="empty-sub">请检查后端服务是否正常运行</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb">
          <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
          <span className="sep">/</span>
          <span>我的课程</span>
        </div>
        <h1>我的课程</h1>
        <p>管理你所有的学习课程，追踪学习进度</p>
      </div>

      <div className="course-grid">
        {courses.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">📚</div>
            <div className="empty-text">还没有课程</div>
            <div className="empty-sub">点击下方按钮创建你的第一门课程</div>
          </div>
        )}

        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onDelete={handleDelete}
          />
        ))}

        {/* 添加新课程卡片 */}
        <div
          className="course-card"
          onClick={() => navigate('/courses/new')}
          style={{
            border: '1px dashed var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            background: 'transparent',
          }}
        >
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>＋</div>
            <div style={{ fontSize: '14px' }}>添加新课程</div>
          </div>
        </div>
      </div>
    </div>
  );
}
