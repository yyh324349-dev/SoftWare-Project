import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '@/lib/api';
import type { Certificate } from '@/types';

export default function CertificatesPage() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    get<{ certificates: Certificate[] }>('/certificates')
      .then((res) => {
        setCertificates(res.certificates || []);
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
            <span>我的证书</span>
          </div>
          <h1>我的证书</h1>
          <p>完成课程全部里程碑后获得结课认证</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
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
            <span>我的证书</span>
          </div>
          <h1>我的证书</h1>
          <p>完成课程全部里程碑后获得结课认证</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-text">加载失败：{error}</div>
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
          <span>我的证书</span>
        </div>
        <h1>我的证书</h1>
        <p>完成课程全部里程碑后获得结课认证</p>
      </div>

      <div className="cert-grid">
        {certificates.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">🏆</div>
            <div className="empty-text">暂无证书</div>
            <div className="empty-sub">完成课程后，证书将显示在这里</div>
          </div>
        )}

        {certificates.map((cert) => (
          <div key={cert.id} className={`cert-card ${cert.locked ? 'locked' : ''}`}>
            <div className="cert-ribbon" />
            <div className="cert-body">
              <div className="cert-seal">
                {cert.locked ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                )}
              </div>
              <div className="cert-title">{cert.courseTitle}</div>
              <div className="cert-subtitle">
                {cert.locked ? `进度 ${cert.progress}% · 尚差 ${Math.round((100 - (cert.progress || 0)) / 10)} 章` : 'Certificate of Completion'}
              </div>
              <div className="cert-divider" style={cert.locked ? { background: 'var(--border)' } : undefined} />
              {cert.locked ? (
                <>
                  <div className="cert-meta">预计完成：{cert.estimatedCompletion}</div>
                  <div className="cert-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
                    未完成
                  </div>
                </>
              ) : (
                <>
                  <div className="cert-meta">完成于 {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
                  <div className="cert-meta" style={{ marginTop: '2px' }}>成绩：{cert.grade}</div>
                  <div className="cert-badge">✓ 已验证</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
