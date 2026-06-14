/**
 * 实验内容生成提示词
 * 根据课程类型自动判断：计算机类 → 编程实验，非计算机类 → 答题实验
 */

interface LabsContext {
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

export function getLabsPrompt(ctx: LabsContext): {
  system: string;
  user: string;
  isCode: boolean;
} {
  const isCS = isComputerScienceCourse(ctx.courseTitle, ctx.courseDescription);

  if (isCS) {
    return {
      isCode: true,
      system: `你是一位资深的计算机科学教育者，擅长设计动手编程实验。
重要：你必须只输出纯 JSON，不要添加任何其他文字、解释或 markdown 标记。`,

      user: `请为以下课程主题设计一个编程实验。

课程名称：${ctx.courseTitle}
课程描述：${ctx.courseDescription || '（无描述）'}
本周主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription || '（无描述）'}
编程语言：${ctx.language || 'Python'}

请直接输出以下 JSON，不要添加任何其他内容：
{
  "title": "实验标题",
  "description": "实验简要描述（50字以内）",
  "instructions": "详细的实验步骤说明（Markdown 格式，包含实验目标、背景知识、实现步骤、注意事项）",
  "starter_code": "# 在此编写你的代码\\n\\n",
  "test_cases": [
    {
      "name": "测试用例名称",
      "description": "测试描述",
      "input": "输入示例",
      "expected": "期望输出"
    }
  ]
}

要求：
1. 实验与本周主题紧密相关
2. instructions 要详细，帮助学生理解要做什么
3. starter_code 提供有意义的代码框架，包含注释
4. 包含 3-5 个测试用例
5. 代码语言使用 ${ctx.language || 'Python'}`,
    };
  }

  return {
    isCode: false,
    system: `你是一位资深的教育者，擅长设计理论知识检验和实践题目。
重要：你必须只输出纯 JSON，不要添加任何其他文字、解释或 markdown 标记。`,

    user: `请为以下课程主题设计一套实验题目。

课程名称：${ctx.courseTitle}
课程描述：${ctx.courseDescription || '（无描述）'}
本周主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription || '（无描述）'}

请直接输出以下 JSON，不要添加任何其他内容：
{
  "title": "实验标题",
  "description": "实验简要描述（50字以内）",
  "instructions": "实验说明，告诉学生需要完成什么",
  "questions": [
    {
      "type": "choice",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": 0,
      "explanation": "详细解析"
    },
    {
      "type": "fill",
      "question": "填空题题目（用___表示空格）",
      "answer": "正确答案",
      "explanation": "解析"
    },
    {
      "type": "calculation",
      "question": "计算题题目",
      "answer": "解题步骤和最终答案",
      "explanation": "评分要点"
    },
    {
      "type": "proof",
      "question": "证明题题目",
      "answer": "证明过程",
      "explanation": "证明思路提示"
    }
  ]
}

要求：
1. 题目与本周主题紧密相关
2. 包含：选择题（3-5道）、填空题（2-3道）、计算题或证明题（1-2道）
3. 选择题要有4个选项，干扰项要合理（常见错误答案）
4. 每道题都要有详细的解析
5. 难度适中，覆盖基础和进阶
6. 数学公式用 LaTeX 格式（$...$）`,
  };
}
