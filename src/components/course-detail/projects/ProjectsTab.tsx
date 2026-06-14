import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { get, put } from '@/lib/api';
import ProjectsWorkspace from './ProjectsWorkspace';
import './ProjectsTab.css';

interface OutletContext {
  courseTitle: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  milestones?: Milestone[];
  starterCode?: string;
}

interface ProjectDetail {
  id: number;
  title: string;
  description: string;
  milestones: Milestone[];
  starterCode?: string;
}

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

export default function ProjectsTab() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courseTitle } = useOutletContext<OutletContext>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取项目列表
  const fetchProjects = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    get<{ projects: Project[] }>(`/courses/${courseId}/projects`)
      .then((res) => {
        setProjects(res.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 选择项目
  const handleSelectProject = (project: Project) => {
    if (courseId) {
      get<ProjectDetail>(`/courses/${courseId}/projects/${project.id}`)
        .then((res) => {
          setSelectedProject(res);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  };

  // 进入里程碑
  const handleEnterMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
  };

  // 返回项目列表
  const handleBackToList = () => {
    setSelectedProject(null);
    setSelectedMilestone(null);
  };

  // 返回里程碑列表
  const handleBackToMilestones = () => {
    setSelectedMilestone(null);
  };

  // 完成里程碑
  const handleCompleteMilestone = async (milestoneId: number) => {
    if (!selectedProject || !courseId) return;
    try {
      await put(`/courses/${courseId}/projects/${selectedProject.id}/milestones/${milestoneId}`, {
        status: 'completed',
      });

      // 更新本地状态
      setSelectedProject(prev => {
        if (!prev) return prev;
        const updatedMilestones = prev.milestones.map(m =>
          m.id === milestoneId ? { ...m, status: 'completed' as const } : m
        );
        return { ...prev, milestones: updatedMilestones };
      });

      // 找到下一个未完成的里程碑
      const currentIndex = selectedProject.milestones.findIndex(m => m.id === milestoneId);
      const nextMilestone = selectedProject.milestones[currentIndex + 1];
      if (nextMilestone) {
        setSelectedMilestone(nextMilestone);
      } else {
        handleBackToMilestones();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  // 获取进度
  const getProgress = (milestones: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '●';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <div className="projects-container">
        <div className="projects-loading">加载中...</div>
      </div>
    );
  }

  // 如果选中了里程碑，显示工作区
  if (selectedProject && selectedMilestone) {
    return (
      <ProjectsWorkspace
        project={selectedProject}
        milestone={selectedMilestone}
        courseId={courseId || ''}
        onBack={handleBackToMilestones}
        onComplete={handleCompleteMilestone}
      />
    );
  }

  // 如果选中了项目，显示里程碑列表
  if (selectedProject) {
    return (
      <div className="projects-milestones-view">
        <div className="milestones-header">
          <button className="back-btn" onClick={handleBackToList}>← 返回项目列表</button>
          <h2>{selectedProject.title}</h2>
          <p>{selectedProject.description}</p>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${getProgress(selectedProject.milestones)}%` }} />
            </div>
            <span className="progress-text">{getProgress(selectedProject.milestones)}% 完成</span>
          </div>
        </div>

        <div className="milestones-list">
          {selectedProject.milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`milestone-card ${milestone.status}`}
              onClick={() => handleEnterMilestone(milestone)}
            >
              <div className={`milestone-status ${milestone.status}`}>
                {getStatusIcon(milestone.status)}
              </div>
              <div className="milestone-content">
                <div className="milestone-number">里程碑 {index + 1}</div>
                <div className="milestone-title">{milestone.title}</div>
                <div className="milestone-desc">{milestone.description}</div>
                {milestone.deliverable && (
                  <div className="milestone-deliverable">
                    <span className="deliverable-icon">📦</span>
                    <span>{milestone.deliverable.name}</span>
                  </div>
                )}
              </div>
              <div className="milestone-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 否则显示项目列表
  return (
    <div className="projects-container">
      <div className="projects-list-view">
        <div className="projects-list-header">
          <h2>课程项目</h2>
          <span className="projects-count">{projects.length} 个</span>
        </div>

        {error && (
          <div className="projects-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="projects-grid">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleSelectProject(project)}
            >
              <div className="project-card-header">
                <span className="project-number">项目 {index + 1}</span>
              </div>
              <h3 className="project-card-title">{project.title}</h3>
              <p className="project-card-desc">{project.description}</p>
              <div className="project-card-footer">
                <span className="project-action">查看详情 →</span>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="projects-empty">
              <div className="projects-empty-icon">🔧</div>
              <div className="projects-empty-text">暂无项目</div>
              <div className="projects-empty-hint">请先在课程大纲中创建项目</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
