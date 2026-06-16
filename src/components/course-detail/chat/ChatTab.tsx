import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useOutletContext, useSearchParams } from 'react-router-dom';
import { get, post } from '@/lib/api';
import './ChatTab.css';

interface OutletContext {
  courseTitle: string;
}

interface Topic {
  id: number;
  title: string;
  mode: string;
  createdAt: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ChatTab() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courseTitle } = useOutletContext<OutletContext>();
  const [searchParams] = useSearchParams();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取消息列表（必须在使用前定义）
  const fetchMessages = useCallback((topicId: number) => {
    get<{ messages: Message[] }>(`/topics/${topicId}/messages`)
      .then((res) => {
        setMessages(res.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  // 获取话题列表
  const fetchTopics = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    get<{ topics: Topic[] }>(`/courses/${courseId}/topics`)
      .then((res) => {
        setTopics(res.topics || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // 处理从大纲跳转过来的情况
  useEffect(() => {
    if (initialized) return;

    const topicId = searchParams.get('topicId');
    const topic = searchParams.get('topic');
    const week = searchParams.get('week');

    // 如果有 topicId 参数，直接选中该话题
    if (topicId) {
      const targetId = Number(topicId);

      // 先从列表中找
      const targetTopic = topics.find(t => t.id === targetId);
      if (targetTopic) {
        setSelectedTopic(targetTopic);
        fetchMessages(targetTopic.id);
        setInitialized(true);
        return;
      }

      // 如果列表中没有，直接加载消息（话题刚创建）
      setSelectedTopic({
        id: targetId,
        title: `第 ${week || '?'} 周讨论: ${topic || ''}`,
        mode: 'tutor',
        createdAt: new Date().toISOString(),
      });
      fetchMessages(targetId);
      setInitialized(true);
      return;
    }

    // 如果没有 topicId 但有 topic 和 week 参数，创建新对话
    if (topic && week && !topicId) {
      const createAndSelect = async () => {
        try {
          const res = await post<{ id: number; title: string }>(`/courses/${courseId}/topics`, {
            title: `第 ${week} 周讨论: ${topic}`,
            mode: 'tutor',
          });
          const newTopic: Topic = {
            id: res.id,
            title: res.title,
            mode: 'tutor',
            createdAt: new Date().toISOString(),
          };
          setTopics(prev => [newTopic, ...prev]);
          setSelectedTopic(newTopic);

          // 自动发送一条关于该章节的问题
          await post('/chat', {
            topicId: newTopic.id,
            content: `请帮我讲解一下第 ${week} 周「${topic}」的核心概念和重点内容。`,
          });
          fetchMessages(newTopic.id);
        } catch (err) {
          console.error('创建对话失败:', err);
        }
        setInitialized(true);
      };
      createAndSelect();
    } else {
      setInitialized(true);
    }
  }, [topics, searchParams, courseId, fetchMessages, initialized]);

  // 选择话题
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    fetchMessages(topic.id);
  };

  // 创建新话题
  const handleCreateTopic = async () => {
    if (!courseId) return;
    try {
      const res = await post<{ id: number; title: string }>(`/courses/${courseId}/topics`, {
        title: `对话 ${topics.length + 1}`,
      });
      const newTopic: Topic = {
        id: res.id,
        title: res.title,
        mode: 'tutor',
        createdAt: new Date().toISOString(),
      };
      setTopics(prev => [newTopic, ...prev]);
      handleSelectTopic(newTopic);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  };

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || !selectedTopic || sending) return;
    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // 添加用户消息到列表
    const tempUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      // 调用聊天 API
      const res = await post<{ reply: string }>('/chat', {
        topicId: selectedTopic.id,
        content: userMessage,
      });

      // 添加 AI 回复
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.reply || '暂无回复',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    }
    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 处理回车
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* 左侧边栏 */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>AI 对话</h3>
          <button className="new-topic-btn" onClick={handleCreateTopic}>+ 新对话</button>
        </div>
        <nav className="topic-list">
          {topics.map((topic) => (
            <button
              key={topic.id}
              className={`topic-item ${selectedTopic?.id === topic.id ? 'active' : ''}`}
              onClick={() => handleSelectTopic(topic)}
            >
              <div className="topic-title">{topic.title}</div>
              <div className="topic-time">{new Date(topic.createdAt).toLocaleDateString()}</div>
            </button>
          ))}
          {topics.length === 0 && (
            <div className="no-topics">暂无对话，点击上方创建</div>
          )}
        </nav>
      </aside>

      {/* 右侧聊天区 */}
      <main className="chat-main">
        {error && (
          <div className="chat-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {!selectedTopic ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <div className="chat-empty-text">选择左侧对话或创建新对话</div>
            <button className="btn btn-primary" onClick={handleCreateTopic}>开始新对话</button>
          </div>
        ) : (
          <>
            {/* 消息列表 */}
            <div className="messages-area">
              {messages.length === 0 && (
                <div className="messages-welcome">
                  <div className="welcome-icon">🤖</div>
                  <h3>我是你的 AI 学习助手</h3>
                  <p>有任何关于「{courseTitle}」的问题，随时问我！</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text" dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }} />
                  </div>
                </div>
              ))}
              {sending && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            <div className="chat-input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
                className="chat-input"
                rows={1}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || sending}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function renderMessage(text: string): string {
  let html = text;
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');
  return html;
}
