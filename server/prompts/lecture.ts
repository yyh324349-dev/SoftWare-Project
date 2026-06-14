/**
 * 讲义内容生成提示词（模仿 interactive-tutor 风格）
 *
 * 支持多种教学风格：
 * - khanmigo: Khan Academy 风格（温暖的导师）
 * - chatgpt-learn: ChatGPT Learn 风格（互动学习伙伴）
 * - feynman: 费曼学习法（以教代学）
 */

export type LectureStyle = 'khanmigo' | 'chatgpt-learn' | 'feynman' | 'academic';

interface LectureContext {
  courseTitle: string;
  courseDescription: string;
  weekNumber: number;
  weekTopic: string;
  weekDescription: string;
  style: string;
  mode: 'full' | 'preview';
}

/** 生成小节列表（预览模式） */
export function getLectureOutlinePrompt(ctx: LectureContext): {
  system: string;
  user: string;
} {
  return {
    system: '你是一位资深的课程讲师和教材编写专家。请严格按照要求的 JSON 数组格式输出讲义章节结构，不要包含 markdown 代码块标记。',
    user: [
      `课程标题：${ctx.courseTitle}`,
      ctx.courseDescription ? `课程描述：${ctx.courseDescription}` : '',
      '',
      `当前章节：第 ${ctx.weekNumber} 周 · ${ctx.weekTopic}`,
      `章节描述：${ctx.weekDescription}`,
      '',
      '请生成该章节的小节结构，要求：',
      '1. 将该周主题分为 3-5 个"小节"',
      '2. 每小节只讲一个核心知识点，遵循认知负荷理论（一次只学一个概念）',
      '3. 小节之间有递进关系：先基础后进阶，先概念后应用',
      '4. 每小节的标题要具体明确（不要用"概述"这种笼统的标题）',
      '',
      '严格按以下 JSON 数组格式输出，不要输出任何其他内容：',
      '[',
      '  {"title": "一、小节标题", "estimated_minutes": 25},',
      '  {"title": "二、小节标题", "estimated_minutes": 30}',
      ']',
    ].filter(Boolean).join('\n'),
  };
}

interface SectionContext {
  courseTitle: string;
  courseDescription: string;
  weekNumber: number;
  weekTopic: string;
  weekDescription: string;
  sectionTitle: string;
  sectionIndex: number;
  totalSections: number;
  style: LectureStyle;
}

/** 生成单个小节的详细内容（交互式 HTML） */
export function getSectionContentPrompt(ctx: SectionContext): {
  system: string;
  user: string;
} {
  const styleGuide = getStyleGuide(ctx.style);

  return {
    system: [
      '你是一位善于教学的资深讲师。',
      styleGuide,
    ].join('\n'),
    user: buildInteractiveHtmlPrompt(ctx),
  };
}

function getStyleGuide(style: LectureStyle): string {
  const guides: Record<LectureStyle, string> = {
    khanmigo: '你的教学风格：像坐在学生旁边一对一辅导，语气轻松自然；每次只讲一个概念，讲透为止；先让学生"感受到"这个概念是什么，再告诉他准确的定义；经常抛出小问题让学生思考。',
    'chatgpt-learn': '你的教学风格：像学习伙伴而不是老师，和学生一起探索知识；每个知识点通过"讲解→提问→反馈"三段循环来传递；让学生主动调用记忆，而不是被动接收。',
    feynman: '你的教学风格：使用费曼学习法，"以教代学"；AI 分饰两角：资深导师 + 初学者；循环流程：学习→用简单话解释→发现盲区→回去补→再解释。',
    academic: '你的教学风格：清晰简洁，直击重点；逻辑严密，术语准确；适合有一定基础的学习者。',
  };
  return guides[style] || guides.academic;
}

/** 生成交互式 HTML 讲义的提示词 */
function buildInteractiveHtmlPrompt(ctx: SectionContext): string {
  return `【重要：输出格式要求】

你现在的任务是生成一个**完整的、自包含的 HTML 文件**，用于渲染交互式讲义。

## 技术要求

1. 输出一个完整的 HTML 文件，从 <!DOCTYPE html> 到 </html>
2. 所有 CSS 写在 <style> 标签中，所有 JS 写在 <script> 标签中（放在 </body> 前）
3. 不要引用任何外部资源（不要用 CDN、不要用外部字体、不要用外部图片）
4. 可以用 SVG 内联或 CSS 绘制图形
5. 不要使用 alert()、prompt()、confirm()
6. 所有内容必须在单个 HTML 文件中完成
7. 保持中文输出

## 视觉设计要求

1. 背景色必须为 #0a1225（与主应用一致）
2. 正文文字颜色 #f0f2f5，次要文字 #9498ab，标题 #f0f2f5
3. 强调色使用金色系（#d4a853, #e8c97a）
4. 代码块背景色 #060c18，边框 rgba(255,255,255,0.06)，圆角 8px
5. 内容区域最大宽度 720px，居中显示，左右 padding 24px
6. 响应式设计：在 320px-768px 宽度下也能正常阅读
7. 所有交互元素（按钮、输入框）要有明显的 hover/active 状态
8. 字体使用系统默认 sans-serif，行高 1.8
9. 圆角使用 8px（小）和 12px（大）

## 必须包含的交互元素

### 1. 选择题（必须有 3-4 道）
使用以下 HTML 结构：
\`\`\`html
<div class="quiz-question">
  <p class="question-text">题目内容</p>
  <div class="options">
    <button class="option" data-correct="false" onclick="checkAnswer(this)">A. 选项内容</button>
    <button class="option" data-correct="true" onclick="checkAnswer(this)">B. 选项内容</button>
    <button class="option" data-correct="false" onclick="checkAnswer(this)">C. 选项内容</button>
    <button class="option" data-correct="false" onclick="checkAnswer(this)">D. 选项内容</button>
  </div>
  <div class="explanation" style="display:none;">
    <p><strong>解析：</strong>详细解释为什么这个选项正确</p>
  </div>
</div>
\`\`\`

### 2. 折叠区/手风琴
使用以下 HTML 结构：
\`\`\`html
<div class="accordion">
  <button class="accordion-trigger" onclick="toggleAccordion(this)">
    <span>标题</span>
    <span class="arrow">▶</span>
  </button>
  <div class="accordion-content">
    <p>内容...</p>
  </div>
</div>
\`\`\`

### 3. 代码演示区（如果有代码）
使用以下 HTML 结构：
\`\`\`html
<div class="code-demo">
  <div class="code-header">
    <span>示例代码</span>
    <button class="run-btn" onclick="runCode(this)">▶ 运行</button>
  </div>
  <pre><code>// 代码内容</code></pre>
  <div class="output" style="display:none;">
    <p>输出结果...</p>
  </div>
</div>
\`\`\`

### 4. 步骤展示器（用于讲解过程）
使用以下 HTML 结构：
\`\`\`html
<div class="step-viewer">
  <div class="step active">
    <div class="step-number">1</div>
    <div class="step-content">
      <h4>步骤标题</h4>
      <p>步骤内容...</p>
    </div>
  </div>
  <div class="step">
    <div class="step-number">2</div>
    <div class="step-content">
      <h4>步骤标题</h4>
      <p>步骤内容...</p>
    </div>
  </div>
  <div class="step-nav">
    <button onclick="prevStep()">← 上一步</button>
    <span class="step-indicator">1 / 3</span>
    <button onclick="nextStep()">下一步 →</button>
  </div>
</div>
\`\`\`

### 5. 关键概念高亮框
使用以下 HTML 结构：
\`\`\`html
<div class="concept-box">
  <div class="concept-icon">💡</div>
  <div class="concept-content">
    <h4>关键概念</h4>
    <p>概念解释...</p>
  </div>
</div>
\`\`\`

## 必须包含的 JavaScript

\`\`\`javascript
// 选择题检查答案
function checkAnswer(btn) {
  const question = btn.closest('.quiz-question');
  const options = question.querySelectorAll('.option');
  const explanation = question.querySelector('.explanation');

  options.forEach(opt => {
    opt.disabled = true;
    if (opt.dataset.correct === 'true') {
      opt.classList.add('correct');
    } else if (opt === btn && opt.dataset.correct === 'false') {
      opt.classList.add('wrong');
    }
  });

  explanation.style.display = 'block';
}

// 折叠区切换
function toggleAccordion(btn) {
  const content = btn.nextElementSibling;
  const arrow = btn.querySelector('.arrow');

  if (content.style.display === 'none' || !content.style.display) {
    content.style.display = 'block';
    arrow.textContent = '▼';
  } else {
    content.style.display = 'none';
    arrow.textContent = '▶';
  }
}

// 步骤展示器
let currentStep = 0;
function showStep(index) {
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
  });
  document.querySelector('.step-indicator').textContent =
    \`\${index + 1} / \${steps.length}\`;
  currentStep = index;
}
function nextStep() {
  const steps = document.querySelectorAll('.step');
  if (currentStep < steps.length - 1) showStep(currentStep + 1);
}
function prevStep() {
  if (currentStep > 0) showStep(currentStep - 1);
}

// 代码运行（模拟）
function runCode(btn) {
  const demo = btn.closest('.code-demo');
  const output = demo.querySelector('.output');
  output.style.display = 'block';
  // 这里可以添加模拟输出的逻辑
}
\`\`\`

## 内容结构要求

请按以下结构组织内容：

1. **开头**：学习目标 + 引入问题
2. **核心讲解**：2-3 个知识点，每个知识点后跟一道选择题
3. **实践环节**：代码演示或步骤展示
4. **巩固练习**：3-4 道选择题（覆盖不同难度）
5. **总结**：关键要点回顾

---

课程：${ctx.courseTitle}
${ctx.courseDescription ? `课程描述：${ctx.courseDescription}` : ''}
第 ${ctx.weekNumber} 周 · 主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription}

当前小节：${ctx.sectionTitle}
小节位置：第 ${ctx.sectionIndex + 1} / ${ctx.totalSections} 节

---

请生成完整的交互式 HTML 文件，包含上述所有交互元素。内容要详细、有深度，适合自学。正文 1500-2500 字（不含代码）。用中文输出。`;
}

/* buildKhanmigoPrompt / buildChatGPTLearnPrompt / buildFeynmanPrompt
   removed — dead code, unused. The active prompt is buildInteractiveHtmlPrompt */
