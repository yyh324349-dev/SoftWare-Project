/**
 * 项目内容生成提示词
 * 根据课程类型自动判断：计算机类 → 编程项目，非计算机类 → 研究/实践项目
 */

interface ProjectsContext {
  courseTitle: string;
  courseDescription?: string;
  weekTopic: string;
  weekDescription: string;
  language?: string;
}

/** 判断是否为计算机相关课程 */
function isComputerScienceCourse(title: string, description?: string): boolean {
  const csKeywords = [
    '编程', '程序设计', 'python', 'java', 'javascript', 'typescript', 'c++', 'c语言',
    '算法', '数据结构', '计算机', '软件', 'web', '前端', '后端', '数据库',
    '人工智能', '机器学习', '深度学习', '网络', '操作系统', '编译原理',
    'coding', 'programming', 'developer', 'software', 'computer',
    'react', 'vue', 'node', 'express', 'django', 'flask', 'spring',
  ];
  const text = `${title} ${description || ''}`.toLowerCase();
  return csKeywords.some(keyword => text.includes(keyword));
}

export function getProjectsPrompt(ctx: ProjectsContext): {
  system: string;
  user: string;
  isCode: boolean;
} {
  const isCS = isComputerScienceCourse(ctx.courseTitle, ctx.courseDescription);

  if (isCS) {
    return {
      isCode: true,
      system: `你是一位资深的软件工程教育者，擅长设计循序渐进的编程项目。
重要：你必须只输出纯 JSON，不要添加任何其他文字、解释或 markdown 标记。`,

      user: `请为以下课程主题设计一个编程项目。

课程名称：${ctx.courseTitle}
课程描述：${ctx.courseDescription || '（无描述）'}
本周主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription || '（无描述）'}
编程语言：${ctx.language || 'Python'}

请直接输出以下 JSON，不要添加任何其他内容：
{
  "title": "项目标题",
  "description": "项目简要描述和总体目标（100字以内）",
  "milestones": [
    {
      "title": "里程碑标题",
      "description": "里程碑详细描述和交付物"
    }
  ],
  "starter_code": "# 项目起始代码框架\\n\\n",
  "requirements": ["需求1", "需求2"]
}

要求：
1. 项目分为 3-5 个里程碑，逐步推进
2. 每个里程碑有明确的交付物和完成标准
3. 项目与本周主题紧密相关
4. 起始代码提供合理的框架结构，包含注释
5. 列出项目的核心需求
6. 代码语言使用 ${ctx.language || 'Python'}`,
    };
  }

  return {
    isCode: false,
    system: `你是一位资深的教育者，擅长设计综合性学习项目和研究任务。
重要：你必须只输出纯 JSON，不要添加任何其他文字、解释或 markdown 标记。`,

    user: `请为以下课程主题设计一个综合性学习项目。

课程名称：${ctx.courseTitle}
课程描述：${ctx.courseDescription || '（无描述）'}
本周主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription || '（无描述）'}

请直接输出以下 JSON，不要添加任何其他内容：
{
  "title": "项目标题",
  "description": "项目简要描述和学习目标（100字以内）",
  "milestones": [
    {
      "title": "里程碑标题",
      "description": "里程碑详细描述、任务要求和完成标准"
    }
  ],
  "deliverables": [
    {
      "name": "交付物名称",
      "description": "交付物要求",
      "type": "report|presentation|solution|analysis"
    }
  ]
}

要求：
1. 项目分为 3-5 个里程碑，循序渐进
2. 每个里程碑有明确的任务要求和完成标准
3. 项目与本周主题紧密相关
4. 包含多种类型的交付物（报告、演示、解答等）
5. 适合学生独立完成
6. 数学公式用 LaTeX 格式（$...$）`,
  };
}
