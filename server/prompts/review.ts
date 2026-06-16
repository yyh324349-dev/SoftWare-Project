/**
 * AI 评审提示词
 */

interface ReviewContext {
  courseTitle: string;
  itemTitle: string;
  itemDescription: string;
  itemType: 'lab' | 'project';
  code: string;
  instructions?: string;
}

export function getReviewPrompt(ctx: ReviewContext): {
  system: string;
  user: string;
} {
  const isCode = ctx.itemType === 'lab';

  if (isCode) {
    return {
      system: `你是一位资深的编程教育专家，负责审查学生的代码。
请根据实验要求和代码内容，提供详细的审查意见：
- 指出代码中的问题和潜在 bug
- 给出具体的改进建议和代码示例
- 如果代码有亮点，也要表扬
- 评估代码的完成度（0-100%）
- 使用 Markdown 格式回复
- 请使用中文回复`,

      user: `## 课程信息
课程名称：${ctx.courseTitle}

## 实验信息
实验标题：${ctx.itemTitle}
实验描述：${ctx.itemDescription}
${ctx.instructions ? `\n实验说明：\n${ctx.instructions}` : ''}

## 学生代码
\`\`\`
${ctx.code}
\`\`\`

请审查以上代码，并给出：
1. 代码质量评分（0-100）
2. 发现的问题列表
3. 改进建议
4. 完成度评估
5. 总体评价`,
    };
  }

  return {
    system: `你是一位资深的教育专家，负责审查学生的项目作业。
请根据项目要求和学生提交的内容，提供详细的审查意见：
- 评估学生的理解和完成情况
- 指出优点和不足
- 给出改进建议
- 评估完成度（0-100%）
- 使用 Markdown 格式回复
- 请使用中文回复`,

    user: `## 课程信息
课程名称：${ctx.courseTitle}

## 项目信息
项目标题：${ctx.itemTitle}
项目描述：${ctx.itemDescription}

## 学生提交的内容
${ctx.code}

请审查以上内容，并给出：
1. 理解程度评分（0-100）
2. 完成情况评估
3. 优点和亮点
4. 需要改进的地方
5. 总体评价和建议`,
  };
}
