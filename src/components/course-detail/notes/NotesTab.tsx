import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { get, post, put } from '@/lib/api';
import './NotesTab.css';

interface OutletContext {
  courseTitle: string;
}

interface WeekNote {
  id: number;
  weekNumber: number;
  topic: string;
  hasNote: boolean;
  noteId: number | null;
  source: 'ai' | 'user' | null;
}

interface NoteContent {
  id: number;
  title: string;
  content: string;
  weekNumber: number;
  source: 'ai' | 'user';
}

export default function NotesTab() {
  const { courseId } = useParams<{ courseId: string }>();
  useOutletContext<OutletContext>(); // keep for typing

  const [weeks, setWeeks] = useState<WeekNote[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekNote | null>(null);
  const [note, setNote] = useState<NoteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteLoading, setNoteLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [userNote, setUserNote] = useState('');
  const [error, setError] = useState('');

  // 获取周次列表
  const fetchWeeks = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    get<{ sections: Array<{ title: string; weeks: Array<{ id: number; weekNumber: number; topic: string }> }> }>(`/courses/${courseId}/syllabus`)
      .then((res) => {
        const weekList: WeekNote[] = (res.sections || []).flatMap(section =>
          (section.weeks || []).map(w => ({
            id: w.id,
            weekNumber: w.weekNumber,
            topic: w.topic,
            hasNote: false,
            noteId: null,
            source: null,
          }))
        );
        setWeeks(weekList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  // 选择周次
  const handleSelectWeek = (week: WeekNote) => {
    setSelectedWeek(week);
    setEditing(false);
    setNote(null);
    setEditContent('');
    setUserNote('');
    // 获取该周的笔记
    if (courseId) {
      setNoteLoading(true);
      get<{ content: string; title: string; source: string }>(`/courses/${courseId}/notes/${week.weekNumber}`)
        .then((res) => {
          if (res.content) {
            setNote({
              id: week.id,
              title: res.title || `第 ${week.weekNumber} 周笔记`,
              content: res.content,
              weekNumber: week.weekNumber,
              source: (res.source as 'ai' | 'user') || 'user',
            });
            setEditContent(res.content);
          }
          setNoteLoading(false);
        })
        .catch(() => {
          setNoteLoading(false);
        });
    }
  };

  // AI 生成笔记
  const handleGenerate = async () => {
    if (!courseId || !selectedWeek) return;
    setGenerating(true);
    try {
      const res = await post<{ content: string; source: string }>(
        `/courses/${courseId}/notes/generate`,
        { weekNumber: selectedWeek.weekNumber }
      );
      setNote({
        id: selectedWeek.id,
        title: `第 ${selectedWeek.weekNumber} 周笔记`,
        content: res.content,
        weekNumber: selectedWeek.weekNumber,
        source: 'ai',
      });
      setEditContent(res.content);
      // 更新列表状态
      setWeeks(prev => prev.map(w =>
        w.id === selectedWeek.id
          ? { ...w, hasNote: true, source: 'ai' }
          : w
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    }
    setGenerating(false);
  };

  // 保存用户编辑的笔记
  const handleSave = async () => {
    if (!selectedWeek || !courseId) return;
    try {
      await put(`/courses/${courseId}/notes/${selectedWeek.weekNumber}`, {
        content: editContent,
        title: `第 ${selectedWeek.weekNumber} 周笔记`,
      });
      setNote(prev => prev ? { ...prev, content: editContent, source: 'user' } : null);
      setEditing(false);
      // 更新列表状态
      setWeeks(prev => prev.map(w =>
        w.id === selectedWeek.id
          ? { ...w, hasNote: true, source: 'user' }
          : w
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  // 追加用户笔记到 AI 笔记后面
  const handleAppendNote = async () => {
    if (!selectedWeek || !courseId || !userNote.trim()) return;
    try {
      await post(`/courses/${courseId}/notes/${selectedWeek.weekNumber}/append`, {
        content: userNote,
      });
      // 刷新笔记
      const res = await get<{ content: string; source: string }>(`/courses/${courseId}/notes/${selectedWeek.weekNumber}`);
      if (res.content) {
        setNote(prev => prev ? { ...prev, content: res.content } : null);
        setEditContent(res.content);
      }
      setUserNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加失败');
    }
  };

  if (loading) {
    return (
      <div className="notes-container">
        <div className="notes-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="notes-container">
      {/* 左侧边栏 */}
      <aside className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h3>学习笔记</h3>
          <span className="notes-week-count">{weeks.length} 周</span>
        </div>
        <nav className="notes-week-list">
          {weeks.map((week) => (
            <button
              key={week.id}
              className={`notes-week-item ${selectedWeek?.id === week.id ? 'active' : ''}`}
              onClick={() => handleSelectWeek(week)}
            >
              <div className="week-info">
                <div className="week-number">第 {week.weekNumber} 周</div>
                <div className="week-topic">{week.topic}</div>
              </div>
              {week.hasNote && (
                <span className={`note-source-badge ${week.source || ''}`}>
                  {week.source === 'ai' ? '🤖' : '✏️'}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* 右侧内容区 */}
      <main className="notes-content">
        {error && (
          <div className="notes-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {!selectedWeek ? (
          <div className="notes-empty">
            <div className="notes-empty-icon">📝</div>
            <div className="notes-empty-text">选择左侧周次查看笔记</div>
          </div>
        ) : noteLoading ? (
          <div className="notes-loading">加载笔记...</div>
        ) : note ? (
          <div className="notes-viewer">
            {/* 头部 */}
            <div className="notes-header">
              <div>
                <h2>第 {selectedWeek.weekNumber} 周笔记</h2>
                <div className="notes-meta">
                  {selectedWeek.topic}
                  <span className={`source-tag ${note.source}`}>
                    {note.source === 'ai' ? '🤖 AI 生成' : '✏️ 手写笔记'}
                  </span>
                </div>
              </div>
              <div className="notes-actions">
                <button className="btn btn-secondary" onClick={handleGenerate} disabled={generating}>
                  {generating ? '生成中...' : '🔄 重新生成'}
                </button>
                {editing ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => { setEditing(false); setEditContent(note.content); }}>取消</button>
                    <button className="btn btn-primary" onClick={handleSave}>保存</button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={() => setEditing(true)}>
                    ✏️ 编辑笔记
                  </button>
                )}
              </div>
            </div>

            {/* 内容 */}
            <div className="notes-content-area">
              {editing ? (
                <div className="notes-edit-area">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="notes-textarea"
                    placeholder="写下你的笔记..."
                  />
                  <div className="edit-hint">
                    💡 编辑后保存会覆盖原有内容，成为你的手写笔记
                  </div>
                </div>
              ) : (
                <>
                  <div className="notes-display" dangerouslySetInnerHTML={{ __html: renderNote(note.content) }} />

                  {/* 追加笔记区域 */}
                  <div className="append-note-area">
                    <div className="append-header">
                      <span>📝 追加我的笔记</span>
                    </div>
                    <textarea
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      className="append-textarea"
                      placeholder="在这里写下你的补充笔记..."
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleAppendNote}
                      disabled={!userNote.trim()}
                    >
                      追加到笔记
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="notes-generate">
            <div className="notes-generate-icon">✨</div>
            <h3>第 {selectedWeek.weekNumber} 周: {selectedWeek.topic}</h3>
            <p>选择一种方式创建笔记</p>
            <div className="generate-options">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? '生成中...' : '🤖 AI 生成笔记'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  // 创建空笔记并进入编辑模式
                  setNote({
                    id: selectedWeek.id,
                    title: `第 ${selectedWeek.weekNumber} 周笔记`,
                    content: '',
                    weekNumber: selectedWeek.weekNumber,
                    source: 'user',
                  });
                  setEditContent('');
                  setEditing(true);
                }}
              >
                ✏️ 自己写笔记
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function renderNote(text: string): string {
  if (!text) return '';
  let html = text;
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/---/g, '<hr>');
  html = html.replace(/\n\n/g, '</p><p>');
  return `<p>${html}</p>`;
}
