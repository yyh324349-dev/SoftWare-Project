import { useState, useEffect } from 'react';
import {
  ArrowLeft, Send, Bot, Terminal, Code, BookOpen,
  PanelLeftClose, PanelLeftOpen, Loader2, CheckCircle, ListChecks
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { post } from '@/lib/api';
import './ProjectsWorkspace.css';

interface Milestone {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  deliverable?: {
    name: string;
    description: string;
    type: string;
  } | null;
}

interface ProjectData {
  id: number;
  title: string;
  description: string;
  milestones: Milestone[];
  starterCode?: string;
}

interface ReviewResult {
  review: string;
}

export default function ProjectsWorkspace({
  project,
  milestone,
  courseId,
  onBack,
  onComplete,
}: {
  project: ProjectData;
  milestone: Milestone;
  courseId: string;
  onBack: () => void;
  onComplete: (milestoneId: number) => void;
}) {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState('');
  const [activeTab, setActiveTab] = useState<'output' | 'review'>('output');

  useEffect(() => {
    setCode(project.starterCode || `# ${milestone.title}\n\n# 在此完成你的任务\n\n`);
  }, [project, milestone]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setActiveTab('output');
    try {
      const res = await post<{ stdout: string; stderr: string; exitCode: number }>(
        `/sandbox/run`,
        { code, language: 'python' }
      );
      if (res.stderr) {
        setOutput(`❌ 错误:\n${res.stderr}`);
      } else {
        setOutput(`✅ 运行成功:\n${res.stdout || '(无输出)'}`);
      }
    } catch (err) {
      setOutput(`❌ 运行失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
    setIsRunning(false);
  };

  const handleReview = async () => {
    setIsReviewing(true);
    setReviewResult('');
    setActiveTab('review');
    try {
      const res = await post<ReviewResult>('/review', {
        courseId,
        itemId: project.id,
        itemType: 'project',
        code,
        milestoneId: milestone.id,
      });
      setReviewResult(res.review);
    } catch (err) {
      setReviewResult(`评审失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
    setIsReviewing(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult('');
    try {
      const reviewRes = await post<ReviewResult>('/review', {
        courseId,
        itemId: project.id,
        itemType: 'project',
        code,
        milestoneId: milestone.id,
      });

      await post('/review/submit', {
        courseId,
        itemId: project.id,
        itemType: 'project',
        milestoneId: milestone.id,
        score: 100,
        review: reviewRes.review,
      });

      setSubmitResult('✅ 里程碑已完成！');
      setTimeout(() => onComplete(milestone.id), 1500);
    } catch (err) {
      setSubmitResult(`❌ 提交失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
    setIsSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'in_progress': return <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full border border-white/20" />;
    }
  };

  return (
    <div className="workspace-container">
      {/* 顶部导航栏 */}
      <div className="workspace-nav">
        <div className="nav-left">
          <button onClick={onBack} className="nav-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="nav-divider" />
          <span className="nav-badge project">PROJECT</span>
          <span className="nav-breadcrumb">{project.title}</span>
          <span className="nav-separator">/</span>
          <span className="nav-title">{milestone.title}</span>
        </div>
        <div className="nav-right">
          <button onClick={handleRun} disabled={isRunning} className="nav-btn run">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            <span>运行</span>
          </button>
          <button onClick={handleReview} disabled={isReviewing} className="nav-btn review">
            {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            <span>AI 评审</span>
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="nav-btn submit">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>完成并继续</span>
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="workspace-body">
        {/* 左侧说明面板 */}
        {isInstructionsOpen && (
          <div className="instructions-panel project-panel">
            <div className="panel-header">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>任务说明</span>
            </div>
            <div className="panel-content">
              {/* 当前任务 */}
              <div className="task-section">
                <h3 className="task-title">{milestone.title}</h3>
                <p className="task-desc">{milestone.description}</p>
              </div>

              {/* 交付物 */}
              {milestone.deliverable && (
                <div className="deliverable-card">
                  <div className="deliverable-header">
                    <ListChecks className="w-4 h-4 text-purple-400" />
                    <span>交付物</span>
                  </div>
                  <p className="deliverable-name">{milestone.deliverable.name}</p>
                  <p className="deliverable-desc">{milestone.deliverable.description}</p>
                </div>
              )}

              {/* 里程碑列表 */}
              <div className="milestones-section">
                <h4 className="milestones-title">项目里程碑</h4>
                <div className="milestones-list">
                  {project.milestones.map((m, index) => (
                    <div
                      key={m.id}
                      className={`milestone-item ${m.id === milestone.id ? 'active' : ''} ${m.status}`}
                    >
                      {getStatusIcon(m.status)}
                      <span className="milestone-name">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 右侧编辑器区域 */}
        <div className="editor-area">
          {/* 编辑器头部 */}
          <div className="editor-header">
            <div className="editor-header-left">
              <button onClick={() => setIsInstructionsOpen(!isInstructionsOpen)} className="toggle-panel-btn">
                {isInstructionsOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <div className="editor-divider" />
              <Code className="w-4 h-4 text-purple-400" />
              <span className="editor-filename">workspace</span>
            </div>
          </div>

          {/* Monaco 编辑器 */}
          <div className="monaco-wrapper">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
                fontLigatures: true,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                guides: { indentation: true, bracketPairs: true },
              }}
            />
          </div>

          {/* 底部输出区 */}
          <div className="output-panel">
            <div className="output-tabs">
              <button
                className={`output-tab ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>输出</span>
              </button>
              <button
                className={`output-tab ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => setActiveTab('review')}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI 评审</span>
                {isReviewing && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
              </button>
              {submitResult && (
                <span className={`submit-result ${submitResult.includes('✅') ? 'success' : 'error'}`}>
                  {submitResult}
                </span>
              )}
            </div>
            <div className="output-content">
              {activeTab === 'output' ? (
                <pre>{output || '点击运行查看输出...'}</pre>
              ) : (
                <div className="review-content">
                  {isReviewing && !reviewResult && (
                    <div className="review-loading">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>AI 正在评审代码...</span>
                    </div>
                  )}
                  {reviewResult && <pre>{reviewResult}</pre>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
