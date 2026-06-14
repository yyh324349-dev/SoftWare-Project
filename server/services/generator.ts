/**
 * 两阶段内容生成器
 *
 * 使用 AI 服务 + 提示词模板生成课程内容：
 * - 大纲（syllabus）
 * - 实验（labs）
 * - 项目（projects）
 * - 笔记（notes）
 */

import { chat } from './ai';
import { getSyllabusPrompt } from '../prompts/syllabus';
import { getLabsPrompt } from '../prompts/labs';
import { getProjectsPrompt } from '../prompts/projects';
import { getNotesPrompt } from '../prompts/notes';
import { getLectureOutlinePrompt, getSectionContentPrompt, type LectureStyle } from '../prompts/lecture';

/** 从 AI 回复中提取 JSON（兼容 markdown 代码块包裹） */
function extractJSON<T>(text: string): T {
  // 清理文本
  let cleaned = text.trim();

  // 尝试从代码块中提取
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 找到第一个 { 或 [
  const startIdx = cleaned.search(/[\[{]/);
  if (startIdx > 0) {
    cleaned = cleaned.substring(startIdx);
  }

  // 尝试直接解析
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // JSON 可能被截断，尝试修复
    try {
      // 移除尾随逗号
      cleaned = cleaned.replace(/,\s*$/, '');
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

      // 尝试补全未闭合的字符串
      const openQuotes = (cleaned.match(/"/g) || []).length;
      if (openQuotes % 2 !== 0) {
        cleaned += '"';
      }

      // 尝试补全未闭合的数组和对象
      const openBrackets = (cleaned.match(/\[/g) || []).length;
      const closeBrackets = (cleaned.match(/\]/g) || []).length;
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        cleaned += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += '}';
      }

      return JSON.parse(cleaned);
    } catch (e2) {
      // 最后尝试：提取已解析的部分
      try {
        // 尝试找到最后一个完整的对象
        const lastValidEnd = findLastValidJSON(cleaned);
        if (lastValidEnd > 0) {
          return JSON.parse(cleaned.substring(0, lastValidEnd + 1));
        }
      } catch (e3) {
        // 忽略
      }

      console.error('JSON 解析失败，原始文本前 500 字符:', text.substring(0, 500));
      throw new Error('AI 返回的 JSON 格式无效');
    }
  }
}

/** 查找最后一个有效的 JSON 结束位置 */
function findLastValidJSON(str: string): number {
  let depth = 0;
  let inString = false;
  let lastValidEnd = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';

    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          lastValidEnd = i;
        }
      }
    }
  }

  return lastValidEnd;
}

/** 修复常见的 JSON 格式问题 */
function fixJSON(str: string): string {
  // 移除可能的前后非 JSON 内容
  let json = str;

  // 找到第一个 { 或 [
  const start = json.search(/[\[{]/);
  if (start > 0) {
    json = json.substring(start);
  }

  // 找到最后一个 } 或 ]
  const end = json.search(/[\]}]\s*$/);
  if (end > 0) {
    json = json.substring(0, json.lastIndexOf(json[end]) + 1);
  }

  // 修复未转义的换行符（在字符串内部）
  json = json.replace(/(?<=[^\\])\n/g, '\\n');

  // 修复未转义的双引号（在字符串内部）
  // 这是一个简化处理，可能不完美
  json = json.replace(/(?<=[^\\])"/g, '\\"');

  // 修复单引号为双引号
  json = json.replace(/'/g, '"');

  return json;
}

/** 生成课程大纲 */
export async function generateSyllabus(context: {
  title: string;
  description: string;
  style: string;
  format: string;
  weeks?: number;
}) {
  const { system, user } = getSyllabusPrompt(context);
  const response = await chat(system, [{ role: 'user', content: user }]);
  return extractJSON<{ weeks: Array<{ week_number: number; topic: string; description: string }> }>(response);
}

/** 生成实验内容 */
export async function generateLab(context: {
  courseTitle: string;
  courseDescription?: string;
  weekTopic: string;
  weekDescription: string;
  language?: string;
}) {
  const { system, user, isCode } = getLabsPrompt(context);
  const response = await chat(system, [{ role: 'user', content: user }], { maxTokens: 8192 });
  const data = extractJSON(response);
  return { ...data, is_code: isCode };
}

/** 生成项目内容 */
export async function generateProject(context: {
  courseTitle: string;
  courseDescription?: string;
  weekTopic: string;
  weekDescription: string;
  language?: string;
}) {
  const { system, user, isCode } = getProjectsPrompt(context);
  const response = await chat(system, [{ role: 'user', content: user }], { maxTokens: 8192 });
  const data = extractJSON(response);
  return { ...data, is_code: isCode };
}

/** 生成讲义小节列表（预览模式） */
export async function generateLectureOutline(context: {
  courseTitle: string;
  courseDescription: string;
  weekNumber: number;
  weekTopic: string;
  weekDescription: string;
  style: string;
}) {
  const { system, user } = getLectureOutlinePrompt(context);
  const response = await chat(system, [{ role: 'user', content: user }]);
  return extractJSON<Array<{ title: string; estimated_minutes: number }>>(response);
}

/** 生成学习笔记（返回 Markdown 文本，不是 JSON） */
export async function generateNotes(context: {
  courseTitle: string;
  weekTopic: string;
  weekDescription: string;
  existingNotes?: string;
}): Promise<string> {
  const { system, user } = getNotesPrompt(context);
  return await chat(system, [{ role: 'user', content: user }]);
}

/** 生成单个小节的详细内容（返回 HTML） */
export async function generateSectionContent(context: {
  courseTitle: string;
  courseDescription: string;
  weekNumber: number;
  weekTopic: string;
  weekDescription: string;
  sectionTitle: string;
  sectionIndex: number;
  totalSections: number;
  style: LectureStyle;
}): Promise<string> {
  const { system, user } = getSectionContentPrompt(context);

  // 生成内容，使用更大的 max_tokens
  let content = await chat(system, [{ role: 'user', content: user }], { maxTokens: 16384 });

  // 验证和修复 HTML
  content = validateAndFixHtml(content);

  return content;
}

/** 验证和修复 HTML 内容 */
function validateAndFixHtml(html: string): string {
  let content = html.trim();

  // 移除可能的 markdown 代码块包裹
  const codeBlockMatch = content.match(/```(?:html)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    content = codeBlockMatch[1].trim();
  }

  // 检查是否是完整的 HTML
  if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
    // 如果不是完整 HTML，包装一下
    if (content.includes('<html') || content.includes('<body')) {
      // 可能是部分 HTML，添加 doctype
      content = '<!DOCTYPE html>\n' + content;
    } else {
      // 纯内容，包装成完整 HTML
      content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>讲义内容</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.8;
      color: #f0f2f5;
      background: #0a1225;
      max-width: 720px;
      margin: 0 auto;
      padding: 24px;
    }
    h1, h2, h3, h4 { color: #f0f2f5; }
    a { color: #d4a853; }
    code { background: rgba(212,168,83,0.1); color: #d4a853; padding: 2px 6px; border-radius: 4px; }
    pre { background: #060c18; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: #f0f2f5; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
    }
  }

  // 检查 HTML 是否闭合
  if (!content.includes('</html>')) {
    content += '\n</body>\n</html>';
  }

  return content;
}
