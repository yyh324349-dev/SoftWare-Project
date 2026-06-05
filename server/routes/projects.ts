import { Router, Request, Response } from 'express';

const router = Router();

// ========== 项目（Project）路由 ==========
// 挂载在 /api 下，路径以 /courses/:id/projects 开头

/** 获取课程下的所有项目列表 */
router.get('/courses/:id/projects', (req: Request, res: Response) => {
  // TODO: 查询指定课程的项目列表
  const { id } = req.params;
  res.json({
    courseId: Number(id),
    projects: [],
  });
});

/** 获取单个项目详情（含里程碑） */
router.get('/courses/:id/projects/:projId', (req: Request, res: Response) => {
  // TODO: 查询项目详情，包含描述和里程碑进度
  const { id, projId } = req.params;
  res.json({
    courseId: Number(id),
    projectId: Number(projId),
    title: '',
    description: '',
    milestones: [],
    message: '项目详情占位（mock）',
  });
});

/** 更新项目里程碑状态 */
router.put(
  '/courses/:id/projects/:projId/milestones/:msId',
  (req: Request, res: Response) => {
    // TODO: 更新指定里程碑的完成状态
    const { id, projId, msId } = req.params;
    const { status } = req.body;
    res.json({
      courseId: Number(id),
      projectId: Number(projId),
      milestoneId: Number(msId),
      status: status || 'in_progress',
      message: '里程碑状态已更新（mock）',
    });
  },
);

export default router;
