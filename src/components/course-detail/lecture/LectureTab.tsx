import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { get, post, put } from '@/lib/api';
import './LectureTab.css';

interface OutletContext {
  courseTitle: string;
}

interface SectionItem {
  id: number;
  sectionIndex: number;
  title: string;
  estimatedMinutes: number;
  hasContent: boolean;
  contentId: number | null;
  status: string;
}

interface ChapterItem {
  id: number;
  weekNumber: number;
  topic: string;
  description: string;
  hasOutline: boolean;
  sections: SectionItem[];
}

interface LectureListResponse {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  style: string;
  chapters: ChapterItem[];
}

interface SectionContent {
  id: number;
  outlineId: number;
  content: string;
  status: string;
}

export default function LectureTab() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courseTitle } = useOutletContext<OutletContext>();

  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);
  const [sectionContent, setSectionContent] = useState<SectionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState<number | null>(null);
  const [generatingContent, setGeneratingContent] = useState<number | null>(null);
  const [error, setError] = useState('');

  // 获取章节列表
  const fetchChapters = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    get<LectureListResponse>(`/courses/${courseId}/lectures`)
      .then((res) => {
        setChapters(res.chapters);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // 切换章节展开/折叠
  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // 生成小节列表
  const handleGenerateOutline = async (chapter: ChapterItem) => {
    if (!courseId) return;
    setGeneratingOutline(chapter.id);
    try {
      await post(`/courses/${courseId}/syllabus/${chapter.id}/outline/generate`, {});
      fetchChapters();
      // 自动展开该章节
      setExpandedChapters(prev => new Set([...prev, chapter.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    }
    setGeneratingOutline(null);
  };

  // 选择小节
  const handleSelectSection = async (section: SectionItem) => {
    setSelectedSection(section);
    setSectionContent(null);

    if (section.hasContent && section.contentId) {
      // 已有内容，直接加载
      setContentLoading(true);
      try {
        const content = await get<SectionContent>(`/lecture-section-contents/${section.contentId}`);
        setSectionContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      }
      setContentLoading(false);
    }
  };

  // 生成小节内容
  const handleGenerateContent = async (section: SectionItem) => {
    setGeneratingContent(section.id);
    try {
      const res = await post<SectionContent>(
        `/lecture-outlines/${section.id}/content/generate`,
        {}
      );
      setSectionContent(res);
      // 更新列表状态
      setChapters(prev => prev.map(ch => ({
        ...ch,
        sections: ch.sections.map(s =>
          s.id === section.id
            ? { ...s, hasContent: true, contentId: res.id, status: 'in_progress' }
            : s
        ),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    }
    setGeneratingContent(null);
  };

  // 更新进度
  const handleUpdateProgress = async (status: string) => {
    if (!sectionContent) return;
    try {
      await put(`/lecture-section-contents/${sectionContent.id}/progress`, { status });
      setSectionContent(prev => prev ? { ...prev, status } : null);
      if (selectedSection) {
        setChapters(prev => prev.map(ch => ({
          ...ch,
          sections: ch.sections.map(s =>
            s.id === selectedSection.id ? { ...s, status } : s
          ),
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  // 重新生成小节内容
  const handleRegenerateContent = async (section: SectionItem) => {
    if (!courseId) return;
    setGeneratingContent(section.id);
    setSectionContent(null);
    try {
      // 先删除旧内容（通过后端重新生成）
      const res = await post<SectionContent>(
        `/lecture-outlines/${section.id}/content/generate?force=true`,
        {}
      );
      setSectionContent(res);
      setSelectedSection(section);
      // 更新列表状态
      setChapters(prev => prev.map(ch => ({
        ...ch,
        sections: ch.sections.map(s =>
          s.id === section.id
            ? { ...s, hasContent: true, contentId: res.id, status: 'in_progress' }
            : s
        ),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新生成失败');
    }
    setGeneratingContent(null);
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="status-icon completed">✓</span>;
      case 'in_progress':
        return <span className="status-icon in-progress">●</span>;
      default:
        return <span className="status-icon not-started">○</span>;
    }
  };

  if (loading) {
    return (
      <div className="lecture-container">
        <div className="lecture-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="lecture-container">
      {/* 左侧边栏：章节列表 */}
      <aside className="lecture-sidebar">
        <div className="lecture-sidebar-header">
          <h3>课程讲义</h3>
          <span className="lecture-chapter-count">{chapters.length} 章</span>
        </div>
        <nav className="lecture-chapter-list">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="lecture-chapter">
              {/* 章节标题（可点击展开） */}
              <button
                className={`lecture-chapter-header ${expandedChapters.has(chapter.id) ? 'expanded' : ''}`}
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="chapter-info">
                  <span className="chapter-number">第 {chapter.weekNumber} 周</span>
                  <span className="chapter-topic">{chapter.topic}</span>
                </div>
                <span className="chapter-arrow">
                  {expandedChapters.has(chapter.id) ? '▼' : '▶'}
                </span>
              </button>

              {/* 小节列表（展开时显示） */}
              {expandedChapters.has(chapter.id) && (
                <div className="lecture-sections-list">
                  {chapter.hasOutline ? (
                    chapter.sections.map((section) => (
                      <div key={section.id} className="lecture-section-row">
                        <button
                          className={`lecture-section-item ${selectedSection?.id === section.id ? 'active' : ''}`}
                          onClick={() => handleSelectSection(section)}
                        >
                          {getStatusIcon(section.status)}
                          <span className="section-title">{section.title}</span>
                          {section.estimatedMinutes > 0 && (
                            <span className="section-time">{section.estimatedMinutes}分钟</span>
                          )}
                        </button>
                        {section.hasContent && (
                          <button
                            className="regenerate-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateContent(section);
                            }}
                            disabled={generatingContent === section.id}
                            title="重新生成"
                          >
                            🔄
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <button
                      className="generate-outline-btn"
                      onClick={() => handleGenerateOutline(chapter)}
                      disabled={generatingOutline === chapter.id}
                    >
                      {generatingOutline === chapter.id ? '生成中...' : '✨ 生成小节'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* 右侧：内容区 */}
      <main className="lecture-content">
        {error && (
          <div className="lecture-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {!selectedSection ? (
          <div className="lecture-empty">
            <div className="lecture-empty-icon">📖</div>
            <div className="lecture-empty-text">选择左侧小节开始学习</div>
            <div className="lecture-empty-hint">展开章节，点击小节查看或生成内容</div>
          </div>
        ) : contentLoading ? (
          <div className="lecture-loading">加载内容...</div>
        ) : sectionContent?.content ? (
          <div className="lecture-viewer">
            {/* 头部 */}
            <div className="lecture-header">
              <div>
                <h2>{selectedSection.title}</h2>
                <div className="lecture-meta">
                  {selectedSection.estimatedMinutes > 0 && `预计 ${selectedSection.estimatedMinutes} 分钟`}
                </div>
              </div>
              <div className="lecture-actions">
                {sectionContent.status !== 'completed' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateProgress('completed')}
                  >
                    ✓ 标记完成
                  </button>
                )}
                {sectionContent.status === 'completed' && (
                  <span className="completed-badge">已完成</span>
                )}
              </div>
            </div>

            {/* 内容 - 使用 iframe 渲染交互式 HTML */}
            <div className="lecture-iframe-wrapper">
              <iframe
                srcDoc={sectionContent.content}
                className="lecture-iframe"
                title="讲义内容"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        ) : (
          <div className="lecture-generate">
            <div className="lecture-generate-icon">📝</div>
            <h3>{selectedSection.title}</h3>
            {selectedSection.estimatedMinutes > 0 && (
              <p className="generate-time">预计学习时间：{selectedSection.estimatedMinutes} 分钟</p>
            )}
            <button
              className="btn btn-primary"
              onClick={() => handleGenerateContent(selectedSection)}
              disabled={generatingContent === selectedSection.id}
            >
              {generatingContent === selectedSection.id ? '生成中...' : '🤖 AI 生成讲义内容'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
