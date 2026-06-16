import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '@/lib/api';
import type { ReportData } from '@/types';

export default function ReportPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    get<ReportData>('/report')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
        <div className="page-header">
          <div className="breadcrumb">
            <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
            <span className="sep">/</span>
            <span>学习报告</span>
          </div>
          <h1>学习报告</h1>
          <p>查看你的整体学习数据与进度分析</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
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
            <span>学习报告</span>
          </div>
          <h1>学习报告</h1>
          <p>查看你的整体学习数据与进度分析</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-text">加载失败：{error}</div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const weeklyHours = data?.weeklyHours || [];
  const courseProgress = data?.courseProgress || [];
  const recentRecords = data?.recentRecords || [];

  const statusLabels: Record<string, { text: string; cls: string }> = {
    completed: { text: '已完成', cls: 'a' },
    in_progress: { text: '进行中', cls: 'b' },
    review: { text: '待复习', cls: 'c' },
  };

  return (
    <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb">
          <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
          <span className="sep">/</span>
          <span>学习报告</span>
        </div>
        <h1>学习报告</h1>
        <p>查看你的整体学习数据与进度分析</p>
      </div>

      {/* 6 个统计卡片 */}
      <div className="report-grid">
        <div className="report-stat-card">
          <div className="rsc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div className="rsc-value">{stats?.totalChapters || 0}</div>
          <div className="rsc-label">总学习章节</div>
        </div>
        <div className="report-stat-card">
          <div className="rsc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="rsc-value">{stats?.totalHours || 0}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>h</span></div>
          <div className="rsc-label">总学习时长</div>
        </div>
        <div className="report-stat-card">
          <div className="rsc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="rsc-value">{stats?.completedLabs || 0}</div>
          <div className="rsc-label">已完成实验</div>
        </div>
        <div className="report-stat-card">
          <div className="rsc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <div className="rsc-value">{stats?.certificates || 0}</div>
          <div className="rsc-label">获得证书</div>
        </div>
        <div className="report-stat-card">
          <div className="rsc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div className="rsc-value">{stats?.aiQueries || 0}</div>
          <div className="rsc-label">AI 问答次数</div>
        </div>
        <div className="report-stat-card">
          <div className="rsc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div className="rsc-value">{stats?.streakDays || 0}</div>
          <div className="rsc-label">连续学习天数</div>
        </div>
      </div>

      {/* 柱状图：本周学习时长 + 课程完成进度 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="report-chart-card">
          <h3>📊 本周学习时长分布</h3>
          {weeklyHours.map((item) => (
            <div className="chart-bar-row" key={item.day}>
              <span className="cbr-label">{item.day}</span>
              <div className="cbr-track">
                <div
                  className="cbr-fill"
                  style={{
                    width: `${Math.min(item.hours / 2 * 100, 100)}%`,
                    background: ['周一', '周二', '周三', '周四'].includes(item.day) ? 'var(--gold)' : 'var(--jade)',
                  }}
                />
              </div>
              <span className="cbr-value">{item.hours}h</span>
            </div>
          ))}
        </div>
        <div className="report-chart-card">
          <h3>📈 课程完成进度</h3>
          {courseProgress.map((item) => (
            <div className="chart-bar-row" key={item.name}>
              <span className="cbr-label">{item.name.length > 6 ? item.name.slice(0, 4) + '..' : item.name}</span>
              <div className="cbr-track">
                <div
                  className="cbr-fill"
                  style={{ width: `${item.progress}%`, background: item.color }}
                />
              </div>
              <span className="cbr-value">{item.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 最近学习记录表格 */}
      <div className="report-chart-card">
        <h3>📋 近期学习记录</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>学习内容</th>
              <th>时长</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map((record, i) => {
              const statusInfo = statusLabels[record.status] || statusLabels.completed;
              return (
                <tr key={i}>
                  <td>{record.date}</td>
                  <td>{record.content}</td>
                  <td>{record.duration}</td>
                  <td><span className={`rt-tag ${statusInfo.cls}`}>{statusInfo.text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
