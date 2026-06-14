import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { get } from '@/lib/api';
import LabsWorkspace from './LabsWorkspace';
import './LabsTab.css';

interface OutletContext {
  courseTitle: string;
}

interface Lab {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  status?: string;
}

interface LabDetail {
  id: number;
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  testCases: string;
}

export default function LabsTab() {
  const { courseId } = useParams<{ courseId: string }>();
  useOutletContext<OutletContext>(); // keep for typing

  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<LabDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取实验列表
  const fetchLabs = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    get<{ labs: Lab[] }>(`/courses/${courseId}/labs`)
      .then((res) => {
        setLabs(res.labs || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  // 获取实验详情
  const fetchLabDetail = useCallback((labId: number) => {
    if (!courseId) return;
    get<LabDetail>(`/courses/${courseId}/labs/${labId}`)
      .then((res) => {
        setSelectedLab(res);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [courseId]);

  // 选择实验
  const handleSelectLab = (lab: Lab) => {
    fetchLabDetail(lab.id);
  };

  // 返回列表
  const handleBack = () => {
    setSelectedLab(null);
    fetchLabs();
  };

  if (loading) {
    return (
      <div className="labs-container">
        <div className="labs-loading">加载中...</div>
      </div>
    );
  }

  // 如果选中了实验，显示工作区
  if (selectedLab) {
    return (
      <LabsWorkspace
        lab={selectedLab}
        courseId={courseId || ''}
        onBack={handleBack}
      />
    );
  }

  // 否则显示实验列表
  return (
    <div className="labs-container">
      <div className="labs-list-view">
        <div className="labs-list-header">
          <h2>编程实验</h2>
          <span className="labs-count">{labs.length} 个</span>
        </div>

        {error && (
          <div className="labs-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="labs-grid">
          {labs.map((lab, index) => (
            <div
              key={lab.id}
              className={`lab-card ${lab.status || ''}`}
              onClick={() => handleSelectLab(lab)}
            >
              <div className="lab-card-header">
                <span className="lab-number">Lab {index + 1}</span>
                {lab.status === 'completed' && (
                  <span className="lab-status-badge">✓ 已完成</span>
                )}
              </div>
              <h3 className="lab-card-title">{lab.title}</h3>
              <p className="lab-card-desc">{lab.description}</p>
              <div className="lab-card-footer">
                <span className="lab-action">点击开始 →</span>
              </div>
            </div>
          ))}

          {labs.length === 0 && (
            <div className="labs-empty">
              <div className="labs-empty-icon">🧪</div>
              <div className="labs-empty-text">暂无实验</div>
              <div className="labs-empty-hint">请先在课程大纲中创建实验</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
