import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '@/lib/api';
import type { CreateCourseInput, Course } from '@/types';
import StyleSelector from '@/components/ui/StyleSelector';
import ModeToggle from '@/components/ui/ModeToggle';

export default function CreateCoursePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferences, setPreferences] = useState('');
  const [style, setStyle] = useState('minimal');
  const [format, setFormat] = useState('md');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入课程题目');
      return;
    }
    if (!description.trim()) {
      setError('请输入学习主要内容');
      return;
    }

    setSubmitting(true);

    try {
      const input: CreateCourseInput = {
        title: title.trim(),
        description: description.trim(),
        preferences: preferences.trim() || undefined,
        style: style as CreateCourseInput['style'],
        format: format as CreateCourseInput['format'],
      };

      const course = await post<Course>('/courses', input);
      navigate(`/courses/${course.id}/outline`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb">
          <button className="back-btn" onClick={() => navigate('/courses')}>← 返回</button>
          <span className="sep">/</span>
          <span>添加课程</span>
        </div>
        <h1>创建新课程</h1>
        <p>填写课程信息，AI 将为你生成个性化的学习内容</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px',
            color: 'var(--danger)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div className="form-section">
          <div className="form-title">基本信息</div>
          <div className="form-group">
            <label htmlFor="courseTitle">课程题目 *</label>
            <input
              className="form-input"
              id="courseTitle"
              placeholder="例如：Python 核心编程"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="courseContent">学习主要内容 *</label>
            <textarea
              className="form-textarea"
              id="courseContent"
              placeholder="描述你想学习的知识领域、目标水平、重点方向等……"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div className="hint">描述越详细，AI 生成的课程越精准</div>
          </div>
          <div className="form-group">
            <label htmlFor="coursePreference">学习偏好</label>
            <textarea
              className="form-textarea"
              id="coursePreference"
              placeholder="例如：偏重实践、每天可投入 1-2 小时、希望有更多编码练习……"
              style={{ minHeight: '60px' }}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-title">讲义风格与展示模式</div>
          <div className="form-group">
            <label>讲义视觉风格</label>
            <StyleSelector value={style} onChange={setStyle} />
          </div>
          <div className="form-group">
            <label>讲义展示模式</label>
            <ModeToggle value={format} onChange={setFormat} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/courses')}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '创建中...' : '提交并生成大纲 →'}
          </button>
        </div>
      </form>
    </div>
  );
}
