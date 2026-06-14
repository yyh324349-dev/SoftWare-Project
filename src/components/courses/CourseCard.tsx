import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onDelete?: (courseId: number) => void;
}

const STYLE_COLORS: Record<string, { bg: string; banner: string }> = {
  minimal: { bg: 'linear-gradient(135deg,#1a2a3a,#0d1b2a)', banner: '' },
  academic: { bg: 'linear-gradient(135deg,#1a2a2a,#0d1b1b)', banner: '' },
  lively: { bg: 'linear-gradient(135deg,#2a1a3a,#1a0d2a)', banner: '' },
};

const STATUS_TAG_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: 'var(--gold-glow)', color: 'var(--gold)' },
  completed: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)' },
};

export default function CourseCard({ course, onDelete }: CourseCardProps) {
  const navigate = useNavigate();
  const colors = STYLE_COLORS[course.style] || STYLE_COLORS.minimal;
  const tagStyle = STATUS_TAG_STYLES[course.status] || STATUS_TAG_STYLES.active;
  const tagLabel = course.status === 'completed' ? '已结课' : '进行中';
  const isCompleted = course.status === 'completed';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(course.id);
    }
  };

  return (
    <div className="course-card" onClick={() => navigate(`/courses/${course.id}`)}>
      <div className="card-banner">
        <div className="banner-bg" style={{ background: colors.bg }} />
        <div className="banner-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        {onDelete && (
          <button className="card-delete-btn" onClick={handleDelete} title="删除课程">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
      <div className="card-body">
        <span className="course-tag" style={tagStyle}>{tagLabel}</span>
        <h3>{course.title}</h3>
        <div className="course-desc">{course.description}</div>
        <div className="course-stats">
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            {' '}{course.chapters} 章
          </span>
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {' '}{isCompleted ? '已获证书' : `${course.completedChapters}/${course.chapters} 已完成`}
          </span>
        </div>
      </div>
    </div>
  );
}
