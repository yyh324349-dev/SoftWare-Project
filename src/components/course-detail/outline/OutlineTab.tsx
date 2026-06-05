import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { get, post } from '@/lib/api';
import React from 'react';

interface OutletContext {
  courseTitle: string;
}

interface SyllabusWeek {
  id: number;
  weekNumber: number;
  topic: string;
  description: string;
  status: string;
}

interface SyllabusSection {
  title: string;
  weeks: SyllabusWeek[];
}

interface SyllabusResponse {
  courseId: number;
  courseTitle: string;
  totalWeeks: number;
  labCount: number;
  projectCount: number;
  sections: SyllabusSection[];
}

export default function OutlineTab() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courseTitle } = useOutletContext<OutletContext>();
  const [data, setData] = useState<SyllabusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSyllabus = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    get<SyllabusResponse>(`/courses/${courseId}/syllabus`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  const handleRefresh = async () => {
    if (!courseId) return;
    setRefreshing(true);
    try {
      await post(`/courses/${courseId}/syllabus/refresh`, {});
      fetchSyllabus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败');
    }
    setRefreshing(false);
  };

  const getRowClass = (status: string) => {
    if (status === 'done') return 'done-row';
    if (status === 'active') return 'current-row';
    return '';
  };

  const getStatusPill = (status: string) => {
    if (status === 'done') return <span className="sched-pill done">已完成</span>;
    if (status === 'active') return <span className="sched-pill active">进行中</span>;
    return null;
  };

  if (loading) {
    return (
      <div id="tab-outline" className="course-tab-panel active" style={{ padding: '24px 32px' }}>
        <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">加载大纲中...</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="tab-outline" className="course-tab-panel active" style={{ padding: '24px 32px' }}>
        <div className="empty-state"><div className="empty-icon">⚠️</div><div className="empty-text">{error}</div></div>
      </div>
    );
  }

  if (!data || !data.sections || data.sections.length === 0) {
    return (
      <div id="tab-outline" className="course-tab-panel active" style={{ padding: '24px 32px' }}>
        <div className="outline-header">
          <div className="oh-left"><h2>课程大纲</h2><p>暂无大纲数据</p></div>
          <div className="oh-right">
            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={handleRefresh} disabled={refreshing}>
              🔄 {refreshing ? '生成中...' : '重新生成'}
            </button>
          </div>
        </div>
        <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">大纲正在 AI 生成中，请稍后刷新</div></div>
      </div>
    );
  }

  return (
    <div id="tab-outline" className="course-tab-panel active" style={{ padding: '24px 32px' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600 }}>{courseTitle || '课程大纲'}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            共 {data.totalWeeks} 周 · {data.labCount} 个实验 · {data.projectCount} 个项目
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={handleRefresh} disabled={refreshing}>
            🔄 {refreshing ? '生成中...' : '重新生成'}
          </button>
        </div>
      </div>

      {/* CS61B 风格课表 */}
      <table className="sched-table">
        <thead>
          <tr>
            <th style={{ width: 'var(--col-wk)' }}>周</th>
            <th style={{ width: 'var(--col-topic)' }}>主题</th>
            <th style={{ width: 'var(--col-lab)' }}>实验 Lab</th>
            <th style={{ width: 'var(--col-proj)' }}>项目 Project</th>
            <th style={{ width: '80px' }}>讨论</th>
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section, si) => (
            <React.Fragment key={`sep-${si}`}>
              <tr className="sched-sep">
                <td className="sched-wk" colSpan={5}>
                  {section.title || `第 ${section.weeks[0]?.weekNumber || ''} 周`}
                </td>
              </tr>
              {section.weeks.map((week, wi) => (
                <tr key={week.id || `${si}-${wi}`} className={getRowClass(week.status)}>
                  <td className="sched-wk">{week.weekNumber}</td>
                  <td className="sched-topic">
                    {week.topic}
                    {getStatusPill(week.status)}
                    {week.description && (
                      <div className="sched-reading">{week.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="sched-link locked-link">
                      Lab {week.weekNumber}
                      <span className="create-btn">创建</span>
                    </span>
                  </td>
                  <td>
                    <span className="sched-link locked-link">
                      Proj
                      <span className="create-btn">创建</span>
                    </span>
                  </td>
                  <td>
                    <span className="sched-disc">—</span>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
