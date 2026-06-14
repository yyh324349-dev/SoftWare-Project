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

function buildKhanmigoPrompt(ctx: SectionContext): string {
  return `课程：${ctx.courseTitle}
${ctx.courseDescription ? `课程描述：${ctx.courseDescription}` : ''}
第 ${ctx.weekNumber} 周 · 主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription}

当前小节：${ctx.sectionTitle}
小节位置：第 ${ctx.sectionIndex + 1} / ${ctx.totalSections} 节

---

请按以下结构输出讲义（直接输出 Markdown，不要用 JSON 包裹）：

## 今天我们要搞懂什么？
告诉学生这节课要学什么，以及**为什么要学它**。用 2-3 段话铺垫：
- 先描述一个学生可能遇到的真实场景或困惑
- 然后点出这节课要讲的概念就是这个困惑的答案
- 最后预告学完这节课能做到什么

## 先想一个小问题
在正式开始之前，抛出一个学生能用直觉或日常经验回答的小问题：
> 🤔 **想一想**：[一个贴近生活的小问题]
> [2-3 句引导，让学生用自己的经验推理出一个初步答案]

## 我们来理解它

### 第一步：先建立直觉
不要一上来就给定义。先用一个**日常生活中的场景**让学生"感受到"这个概念（3-4 段）：
- 用"想象一下..."开头，描述一个学生一定经历过的场景
- 类比要精准映射概念的核心机制
- 用 2-3 个不同的角度反复强化同一个概念

### 第二步：现在来看准确定义
在学生有了直觉之后，给出清晰准确的定义（3-4 段）：
- 先用一句话概括核心定义
- 然后逐个解释定义中的每个关键术语
- 用加粗标记关键术语

### 第三步：动手试试
给出一个**最小化的实际例子**，让学生看到这个知识"活了"：
- 例子要完整可运行
- 每一步都有详细的中文注释
- 如果有坑，一并指出

## 停一下，检查理解 🎯
在讲解中插入 2-3 个**思考题**：
> ✋ **暂停一下**：[关于刚讲内容的一个小问题]
> 先自己在心里想一个答案，再往下看。

## 这些坑你可能踩过
列出 3-4 个初学者常见的误解：
- **"我之前一直以为..."**：[错误理解] → 实际上 [正确理解]
- 解释为什么这个误解很常见

## 练一练

### 📝 选择题
设计 3-4 道选择题，覆盖本节核心知识点。每道题都要有 4 个选项（A/B/C/D），只有一个是正确的。

**选择题 1**（基础概念）：
[题目]
A. [选项]
B. [选项]
C. [选项]
D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释为什么这个选项正确，其他选项为什么错误]
</details>

**选择题 2**（理解应用）：
[题目]
A. [选项]
B. [选项]
C. [选项]
D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

**选择题 3**（易错题）：
[题目]（设计一个容易选错的题目）
A. [选项]
B. [选项]
C. [选项]
D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释，特别说明容易选错的选项为什么错]
</details>

### ✏️ 应用题
设计 1-2 道需要动手思考的应用题：

**应用题 1**：[题目]
<details>
<summary>💡 提示</summary>
**解题思路**：[引导学生怎么想]
**答案**：[最终答案]
</details>

## 今天学到了什么
用 3-5 句话总结本节要点。最后展望下一节。

---

写作要求：
1. 全程像和朋友聊天，用"你"而不是"我们"
2. 用 Markdown 格式，善用加粗、代码块、引用块
3. 代码示例用中文注释
4. 每个讲解环节都要有"为什么"，不只是"是什么"
5. 选择题要覆盖不同难度：基础概念、理解应用、易错陷阱
6. 选择题的干扰项要合理，不能太明显是错的
7. 正文 1500-2500 字（不含代码）
8. 用中文输出`;
}

function buildChatGPTLearnPrompt(ctx: SectionContext): string {
  return `课程：${ctx.courseTitle}
${ctx.courseDescription ? `课程描述：${ctx.courseDescription}` : ''}
第 ${ctx.weekNumber} 周 · 主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription}

当前小节：${ctx.sectionTitle}
小节位置：第 ${ctx.sectionIndex + 1} / ${ctx.totalSections} 节

---

请按以下结构输出讲义（直接输出 Markdown，不要用 JSON 包裹）：

## 🎯 今天的目标
告诉学生这节课要学什么（2-3 段）：
- 从一个学生能产生共鸣的问题或场景开始
- 列出学完后能做到的 2-3 件具体的事

## 💡 你其实已经知道一些了
激活学生的先验知识（3-4 段）：
- 回顾一个相关的日常经验或已学概念
- 让学生意识到自己已经有基础了

## 📖 核心讲解

### 循环一：建立直觉
用一个**出人意料或有趣的类比**让学生"啊哈！"一下（3-4 段）：
> 🤔 **现在问你一个问题**：[基于类比的推理问题]

### 循环二：精确定义
在直觉之上给出准确定义（3-4 段）：
> 🔍 **找 Bug 练习**：[给一段包含常见错误的描述]

### 循环三：动手实践
给出一个**完整的实际例子**：
> 🎭 **角色扮演时间**：[让学生模拟执行一段代码]

## ⚠️ 这些错误你可能犯过
列出 3-4 个常见错误，每个展开 2-3 段

## 🧪 巩固练习

### 📝 选择题
设计 3-4 道选择题，覆盖本节核心知识点：

**选择题 1**（基础概念）：
[题目]
A. [选项]　B. [选项]　C. [选项]　D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

**选择题 2**（理解应用）：
[题目]
A. [选项]　B. [选项]　C. [选项]　D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

**选择题 3**（易错题）：
[题目]
A. [选项]　B. [选项]　C. [选项]　D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

### ✏️ 应用题
设计 1-2 道需要动手思考的应用题，每道题提供分层反馈

## 📚 总结 & 下一步
总结今天学的关键要点，预告下一节

---

写作要求：
1. 像学习伙伴在聊天，语气轻松有活力
2. 每个环节都要有互动元素
3. 选择题要覆盖不同难度，干扰项要合理
4. 正文 1500-2500 字
5. 用中文输出`;
}

function buildFeynmanPrompt(ctx: SectionContext): string {
  return `课程：${ctx.courseTitle}
${ctx.courseDescription ? `课程描述：${ctx.courseDescription}` : ''}
第 ${ctx.weekNumber} 周 · 主题：${ctx.weekTopic}
主题描述：${ctx.weekDescription}

当前小节：${ctx.sectionTitle}
小节位置：第 ${ctx.sectionIndex + 1} / ${ctx.totalSections} 节

---

请按以下结构输出讲义（直接输出 Markdown，不要用 JSON 包裹）：

## 🎯 你要学会什么？
告诉学生这节课的目标（2-3 段）：
- 关键强调：不只是"看懂"，而是能给别人讲明白

## 📖 第一步：导师拆解知识点
用最简单的语言解释核心概念（3-5 段）：
> 💡 **关键拆解**：[把概念各部分拆开，用最简单的语言解释]

## 🗣️ 第二步：试着解释给别人听
让学生尝试用简单语言解释（3-4 段）：
> ✏️ **你的解释**：（想象你正在跟一个完全不懂的朋友聊天，用你自己的话解释）
>
> **自我检查清单**：
> - [ ] 我用了"大白话"
> - [ ] 我解释了"为什么"
> - [ ] 我用了至少一个具体的例子

## 🔍 第三步：发现你的盲区
导师扮演初学者，问看似简单但暴露深度的问题（3-4 段）：
> 🤔 **初学者的追问**：[天真但深刻的问题]

## 🔄 第四步：再解释一遍
在补完盲区后，让学生再次尝试解释

## ⚠️ 这些地方容易卡住
列出 3-4 个学生解释时最容易卡壳的地方

## 🧪 费曼挑战

### 📝 选择题
设计 3-4 道选择题，检验学生是否真正理解：

**选择题 1**（基础概念）：
[题目]
A. [选项]　B. [选项]　C. [选项]　D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

**选择题 2**（理解应用）：
[题目]
A. [选项]　B. [选项]　C. [选项]　D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

**选择题 3**（易错题）：
[题目]
A. [选项]　B. [选项]　C. [选项]　D. [选项]
<details>
<summary>✅ 查看答案</summary>
**正确答案**：[字母]
**解析**：[详细解释]
</details>

### ✏️ 费曼挑战题
设计 1-2 道围绕"解释"展开的练习题

## 📝 今天的学习回顾
总结今天学了什么，你现在能用简单语言解释了吗？

---

写作要求：
1. 使用费曼学习法的循环：学习→解释→发现盲区→补充→再解释
2. 语气像一位耐心的导师
3. 选择题要覆盖不同难度，干扰项要合理
3. 正文 1500-2500 字
4. 用中文输出`;
}
