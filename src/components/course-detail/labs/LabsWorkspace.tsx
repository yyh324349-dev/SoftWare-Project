import { useState, useEffect } from 'react';
import {
  ArrowLeft, Play, Send, Bot, ChevronRight, ChevronDown,
  Folder, FolderOpen, Terminal, Code, BookOpen,
  PanelLeftClose, PanelLeftOpen, Loader2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { post } from '@/lib/api';
import './LabsWorkspace.css';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

interface LabData {
  id: number;
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  testCases?: string;
}

interface ReviewResult {
  review: string;
}

// 文件树节点组件
function TreeNode({
  node,
  depth,
  activeFile,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  const isDir = node.type === 'directory';
  const isActive = activeFile === node.path;
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      py: '🐍', js: '📜', ts: '📘', json: '📋', md: '📝',
      html: '🌐', css: '🎨', txt: '📄',
    };
    return iconMap[ext] || '📄';
  };

  return (
    <div>
      <div
        className={`tree-node ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          if (isDir) {
            setIsExpanded(!isExpanded);
          } else {
            onSelect(node.path);
          }
        }}
      >
        {isDir ? (
          isExpanded ? <ChevronDown className="tree-icon" /> : <ChevronRight className="tree-icon" />
        ) : (
          <span className="tree-icon-spacer" />
        )}
        {isDir ? (
          isExpanded ? <FolderOpen className="tree-icon folder" /> : <Folder className="tree-icon folder" />
        ) : (
          <span className="tree-file-icon">{getFileIcon(node.name)}</span>
        )}
        <span className="tree-name">{node.name}</span>
      </div>
      {isDir && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.path} node={child} depth={depth + 1} activeFile={activeFile} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LabsWorkspace({
  lab,
  courseId,
  onBack,
}: {
  lab: LabData;
  courseId: string;
  onBack: () => void;
}) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string>('');
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState('');
  const [activeTab, setActiveTab] = useState<'output' | 'review'>('output');

  // 初始化文件结构
  useEffect(() => {
    if (lab?.starterCode) {
      const initialFiles: FileNode[] = [
        {
          name: 'src',
          path: 'src',
          type: 'directory',
          children: [
            { name: 'main.py', path: 'src/main.py', type: 'file', content: lab.starterCode },
            { name: 'utils.py', path: 'src/utils.py', type: 'file', content: '# 工具函数\n\ndef helper():\n    pass\n' },
          ],
        },
        {
          name: 'tests',
          path: 'tests',
          type: 'directory',
          children: [
            { name: 'test_main.py', path: 'tests/test_main.py', type: 'file', content: '# 测试文件\nimport unittest\n\nclass TestMain(unittest.TestCase):\n    def test_example(self):\n        self.assertTrue(True)\n\nif __name__ == "__main__":\n    unittest.main()\n' },
          ],
        },
        { name: 'README.md', path: 'README.md', type: 'file', content: `# ${lab.title}\n\n${lab.description}\n` },
        { name: 'requirements.txt', path: 'requirements.txt', type: 'file', content: '# 依赖包\n' },
      ];
      setFiles(initialFiles);

      const contents: Record<string, string> = {};
      const extractContents = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content) {
            contents[node.path] = node.content;
          }
          if (node.children) {
            extractContents(node.children);
          }
        });
      };
      extractContents(initialFiles);
      setFileContents(contents);
      setActiveFile('src/main.py');
    }
  }, [lab]);

  const getFileContent = (path: string): string => {
    return fileContents[path] || '';
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setFileContents(prev => ({ ...prev, [activeFile]: value }));
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setActiveTab('output');
    try {
      const mainCode = fileContents['src/main.py'] || '';
      const res = await post<{ stdout: string; stderr: string; exitCode: number }>(
        `/courses/${courseId}/labs/${lab.id}/run`,
        { code: mainCode }
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
      const mainCode = fileContents['src/main.py'] || '';
      const res = await post<ReviewResult>('/review', {
        courseId,
        itemId: lab.id,
        itemType: 'lab',
        code: mainCode,
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
      const mainCode = fileContents['src/main.py'] || '';
      const reviewRes = await post<ReviewResult>('/review', {
        courseId,
        itemId: lab.id,
        itemType: 'lab',
        code: mainCode,
      });

      await post('/review/submit', {
        courseId,
        itemId: lab.id,
        itemType: 'lab',
        score: 100,
        review: reviewRes.review,
      });

      setSubmitResult('✅ 实验已提交成功！');
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      setSubmitResult(`❌ 提交失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
    setIsSubmitting(false);
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
      jsx: 'javascript', html: 'html', css: 'css', json: 'json',
      md: 'markdown', sql: 'sql', sh: 'shell', java: 'java',
    };
    return langMap[ext] || 'plaintext';
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
          <span className="nav-badge lab">LAB</span>
          <span className="nav-title">{lab.title}</span>
        </div>
        <div className="nav-right">
          <button onClick={handleRun} disabled={isRunning} className="nav-btn run">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>运行</span>
          </button>
          <button onClick={handleReview} disabled={isReviewing} className="nav-btn review">
            {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            <span>AI 评审</span>
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="nav-btn submit">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>提交实验</span>
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="workspace-body">
        {/* 左侧说明面板 */}
        {isInstructionsOpen && (
          <div className="instructions-panel">
            <div className="panel-header">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>实验说明</span>
            </div>
            <div className="panel-content">
              <div className="instructions-text">
                {lab.instructions || lab.description}
              </div>
            </div>
          </div>
        )}

        {/* 中间编辑器区域 */}
        <div className="editor-area">
          {/* 编辑器头部 */}
          <div className="editor-header">
            <div className="editor-header-left">
              <button onClick={() => setIsInstructionsOpen(!isInstructionsOpen)} className="toggle-panel-btn">
                {isInstructionsOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <div className="editor-divider" />
              <Code className="w-4 h-4 text-indigo-400" />
              <span className="editor-filename">{activeFile || '未选择文件'}</span>
              <span className="editor-lang">{activeFile.split('.').pop()?.toUpperCase()}</span>
            </div>
          </div>

          {/* 文件树 + 编辑器 */}
          <div className="editor-body">
            {/* 文件树 */}
            <div className="file-tree-panel">
              <div className="tree-header">
                <Folder className="w-4 h-4 text-white/50" />
                <span>资源管理器</span>
              </div>
              <div className="tree-content">
                {files.map(node => (
                  <TreeNode key={node.path} node={node} depth={0} activeFile={activeFile} onSelect={setActiveFile} />
                ))}
              </div>
            </div>

            {/* Monaco 编辑器 */}
            <div className="monaco-wrapper">
              <Editor
                height="100%"
                language={getLanguage(activeFile)}
                theme="vs-dark"
                value={getFileContent(activeFile)}
                onChange={handleEditorChange}
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
