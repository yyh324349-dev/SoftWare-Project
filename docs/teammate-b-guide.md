# 📋 队友 B 开发指南

> 本文档是你的完整开发手册。按照顺序完成每个任务，遇到问题随时在群里问。

---

## 你的角色

你负责 **展示型页面** 的前端 + 对应后端 API。这些页面以数据展示和表单交互为主，不涉及复杂的流式通信或代码编辑器。

---

## 前置准备

### 等待 Zee 完成「项目骨架」后才能开始

Zee 会先搭建好：
- Express + Vite + TypeScript 项目结构
- SQLite 数据库和表
- 11 个 API 路由骨架（返回 mock 数据）
- CSS 全局样式（从 demo.html 迁移）
- 共享类型定义

**收到 Zee 的通知后**，执行：

```bash
# 1. 克隆仓库
git clone https://github.com/LilZeeCN/SoftWare-Project.git
cd SoftWare-Project

# 2. 安装依赖
npm install

# 3. 启动开发服务器（确认能跑起来）
npm run dev
# 浏览器打开 http://localhost:3000 能看到页面就说明 OK

# 4. 创建你的开发分支
git checkout -b feat/pages-display-B
```

> ⚠️ **提交前进度记录（必读）**
>
> **每次 `git commit` 之前**，必须先在 `progress/zuoyuo/` 文件夹里新建一个 `.md` 文件，记录本次完成了什么。
> 文件命名：`YYYY-MM-DD-简述.md`（如 `2026-06-05-Dashboard页面.md`）。
> 不写进度记录就提交的 PR 会被要求补充后再合并。

### 项目结构速览

你只需要关注这些目录：

```
server/routes/          ← 你要写的后端 API
  ├── courses.ts          你的
  ├── outline.ts          你的
  ├── report.ts           你的
  └── certificates.ts     你的

src/components/          ← 你要写的前端组件
  ├── dashboard/          你的
  ├── courses/            你的
  ├── course-detail/      你的（部分）
  ├── report/             你的
  └── certificates/       你的

src/globals.css          ← 只追加，不改已有内容
src/types/index.ts       ← 只追加类型
```

---

## 你的 5 个任务

### 任务 1：Dashboard 仪表板

**开始时间**：Zee 完成项目骨架后（第 1 周后半段）

**参考 UI**：打开 `demo.html`，搜索 `<!-- ===== DASHBOARD =====`（约第 1293 行），你看到的整个仪表板就是你要实现的。

**要写的文件**：

| 文件 | 说明 |
|------|------|
| `src/components/dashboard/DashboardPage.tsx` | 仪表板主页面 |

**你要实现的元素**（对照 demo.html）：

1. **页面标题区**：欢迎文案 + 设置按钮（跳转 settings 页）
2. **导航卡片网格**（4 张）：我的课程、创建课程、学习报告、我的证书
   - 点击后跳转到对应页面（用 React Router 的 `useNavigate`）
3. **统计卡片网格**（4 张）：
   - 进行中的课程数、整体完成度、本周待学章节、已获证书数
   - 前期可以用硬编码的 mock 数据，后期对接 `/api/report` API

**使用的 CSS 类**（已在 globals.css 中定义，直接用）：

```tsx
// 导航卡片
<div className="nav-card-grid">
  <div className="nav-card-item" onClick={() => navigate('/courses')}>
    <div className="nc-icon" style={{background:'...',color:'...'}}>📚</div>
    <div className="nc-title">我的课程</div>
  </div>
  // ...
</div>

// 统计卡片
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon">📖</div>
    <div className="stat-value">4</div>
    <div className="stat-label">进行中的课程</div>
    <div className="stat-trend up">↑ 较上周 +1</div>
  </div>
  // ...
</div>
```

**测试方法**：

```bash
# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:3000/
# 检查点：
# □ 页面显示暗色背景 + 金色/翡翠色主题
# □ 4 张导航卡片 hover 有上浮效果
# □ 点击导航卡片能跳转到对应页面
# □ 4 张统计卡片数据正确显示
# □ 整体布局与 demo.html 一致
```

**验收标准**：
- [ ] 视觉效果与 demo.html 一致（暗色主题、圆角卡片、hover 动画）
- [ ] 导航卡片点击跳转正确
- [ ] 页面在不同屏幕宽度下不会错乱（参考 demo.html 的响应式断点）

---

### 任务 2：课程列表页

**开始时间**：任务 1 完成后

**参考 UI**：打开 `demo.html`，搜索 `<!-- ===== COURSES =====`（约第 1356 行）

**要写的文件**：

| 文件 | 说明 |
|------|------|
| `src/components/courses/CoursesPage.tsx` | 课程列表主页面 |
| `src/components/courses/CourseCard.tsx` | 课程卡片组件 |
| `server/routes/courses.ts` | 课程 CRUD API（替换 Zee 的骨架） |

**后端 API 设计**（你需要在 `server/routes/courses.ts` 中实现）：

```typescript
// GET /api/courses        → 返回当前用户所有课程列表
// POST /api/courses       → 创建新课程（标题、描述、风格等）
// GET /api/courses/:id    → 获取单个课程详情
// DELETE /api/courses/:id → 删除课程
```

返回数据格式：

```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Python 核心编程",
      "description": "从基础语法到高级特性...",
      "style": "minimal",
      "format": "markdown",
      "status": "active",
      "progress": 72,
      "chapters": 12,
      "completedChapters": 7,
      "createdAt": "2026-05-01T00:00:00Z"
    }
  ]
}
```

**前端组件结构**：

```
CoursesPage
  ├── Breadcrumb（返回按钮）
  ├── 页面标题 "我的课程"
  └── CourseGrid
       ├── CourseCard × N（从 API 获取数据）
       └── 最后一个卡片："添加新课程"（虚线边框，点击跳转创建页）
```

**课程卡片 CSS 类**：

```tsx
<div className="course-grid">
  <div className="course-card" onClick={() => navigate(`/courses/${course.id}`)}>
    <div className="card-banner">
      <div className="banner-bg" style={{background: '...'}} />
      <div className="banner-icon">🐍</div>
    </div>
    <div className="card-body">
      <span className="course-tag">进行中</span>
      <h3>Python 核心编程</h3>
      <div className="course-desc">...</div>
      <div className="course-stats">...</div>
    </div>
  </div>
</div>
```

**测试方法**：

```bash
# 1. 启动服务器
npm run dev

# 2. 用 curl 测试 API
curl http://localhost:3001/api/courses
# 应返回空列表（还没创建课程）

# 3. 测试创建课程
curl -X POST http://localhost:3001/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"测试课程","description":"测试描述","style":"minimal"}'
# 应返回新创建的课程对象

# 4. 浏览器打开 http://localhost:3000/courses
# 检查点：
# □ 课程卡片正确渲染
# □ 点击课程卡片能跳转到课程详情页
# □ "添加新课程" 卡片能跳转到创建页
# □ 删除功能正常（如有实现）
```

**验收标准**：
- [ ] 课程列表从 API 获取数据并正确渲染
- [ ] 卡片 hover 有上浮 + 阴影效果
- [ ] 不同状态的标签颜色正确（进行中=金色、已结课=警告色）
- [ ] 空列表时显示"添加新课程"引导

---

### 任务 3：创建课程页

**开始时间**：任务 2 完成后

**参考 UI**：打开 `demo.html`，搜索 `<!-- ===== ADD COURSE =====`（约第 1422 行）

**要写的文件**：

| 文件 | 说明 |
|------|------|
| `src/components/courses/CreateCoursePage.tsx` | 创建课程表单 |
| `src/components/ui/StyleSelector.tsx` | 讲义风格选择器（3 个选项卡） |
| `src/components/ui/ModeToggle.tsx` | 展示模式切换（纯 MD / MD+HTML） |

**表单字段**（对照 demo.html）：

1. **课程题目** — 文本输入框（必填）
2. **学习主要内容** — 多行文本框（必填）
3. **学习偏好** — 多行文本框（选填）
4. **讲义视觉风格** — 3 选 1（简约📝 / 学术🎓 / 活泼✨）
5. **讲义展示模式** — 切换按钮（纯 MD / MD+HTML）

**提交后行为**：
- 调用 `POST /api/courses` 创建课程
- 创建成功后跳转到课程详情页的大纲 Tab
- 此时 AI 会异步生成大纲（Zee 负责这部分后端逻辑，你只管调用 API 和跳转）

**测试方法**：

```bash
# 浏览器打开 http://localhost:3000/courses/new
# 检查点：
# □ 表单布局与 demo.html 一致
# □ 风格选择器：点击切换有高亮效果
# □ 展示模式：切换按钮文字和提示同步变化
# □ 必填字段为空时提交，显示提示信息
# □ 提交后跳转到课程详情页
# □ 点"取消"返回课程列表
```

**验收标准**：
- [ ] 表单样式与 demo.html 完全一致
- [ ] StyleSelector 和 ModeToggle 交互正确
- [ ] 表单验证：空值提交有提示
- [ ] 提交后正确跳转

---

### 任务 4：课程详情 — 大纲 Tab（OutlineTab）

**开始时间**：Zee 完成 AI 内容生成（任务 ⑥）后

**参考 UI**：打开 `demo.html`，搜索 `<!-- TAB: 大纲`（约第 1497 行），是一个 CS61B 风格的课表。

**要写的文件**：

| 文件 | 说明 |
|------|------|
| `src/components/course-detail/outline/OutlineTab.tsx` | 大纲表格 |

> **注意**：`CourseDetailLayout.tsx`（课程详情框架，Tab 切换 + FAB 导航）由 **Zee** 负责编写并提供。你只需要专注于 `OutlineTab.tsx` 大纲表格组件。你的 OutlineTab 会作为子组件挂载在 CourseDetailLayout 的 Tab 内容区中。

**CourseDetailLayout 功能**（由 Zee 提供，供参考）：
- 顶部：课程名称 + Tab 切换栏（大纲 / 笔记 / 实验 / 对话 / 项目）
- 右下角：FAB 浮动导航按钮（点击展开菜单）
- 内容区：根据当前 Tab 渲染对应组件
- Tab 切换时 URL 同步变化（`/courses/:id/outline`, `/courses/:id/chat` 等）

**大纲表格结构**（CS61B 风格）：

```
| 周 | 主题          | 实验 Lab     | 项目 Project    | 讨论 |
|----|--------------|-------------|----------------|------|
| 1  | Python 入门  | Lab 1 ✓     | —              | ✓    |  ← 绿色（已完成）
| 4  | 函数与模块    | Lab 4 →     | Proj 1 M3      | →    |  ← 金色（进行中）
| 5  | 面向对象      | Lab 5 🔒创建| Proj 2 🔒创建  | —    |  ← 灰色（未开始）
| —— 4-6 周 · 核心编程 ——                                      |  ← 分隔行
```

**后端 API**（`server/routes/outline.ts`）：

```typescript
// GET /api/courses/:id/syllabus    → 返回大纲数据
// POST /api/courses/:id/syllabus/refresh → 重新生成大纲（调用 AI）
```

**测试方法**：

```bash
# 1. 先创建一个有大纲的课程（API 或创建页）
# 2. 浏览器打开 http://localhost:3000/courses/:id/outline
# 检查点：
# □ Tab 栏显示 5 个 Tab，"大纲" 高亮
# □ 课表正确渲染（周次、主题、实验、项目、讨论）
# □ 已完成行 = 绿色、进行中行 = 金色、未开始 = 灰色
# □ 分隔行显示阶段标题
# □ 点击 Tab 能切换到对应页面
# □ FAB 按钮点击展开菜单，能跳转 Tab
# □ 锁定状态的"创建"按钮 hover 显示
```

**验收标准**：
- [ ] 表格布局与 demo.html 一致
- [ ] 三种状态的行颜色正确
- [ ] Tab 切换正常
- [ ] FAB 导航菜单正常

---

### 任务 5：学习报告 + 证书页

**开始时间**：任务 4 完成后，或与任务 4 并行

**参考 UI**：
- 报告页：搜索 `<!-- ===== 学习报告 =====`（约第 2264 行）
- 证书页：搜索 `<!-- ===== 我的证书 =====`（约第 2344 行）

**要写的文件**：

| 文件 | 说明 |
|------|------|
| `src/components/report/ReportPage.tsx` | 学习报告页 |
| `src/components/certificates/CertificatesPage.tsx` | 证书页 |
| `server/routes/report.ts` | 报告数据 API |
| `server/routes/certificates.ts` | 证书 API |

**报告页内容**（对照 demo.html）：

1. **6 个统计卡片**（2 行 3 列）：总学习章节、总学习时长、已完成实验、获得证书、AI 问答次数、连续学习天数
2. **2 个柱状图**（纯 CSS 实现，不需要图表库）：
   - 本周学习时长分布（周一到周日）
   - 课程完成进度（各课程百分比）
3. **最近学习记录表格**：日期、内容、时长、状态标签

**证书页内容**：
- 已获得证书：金色边框卡片，显示课程名、完成日期、成绩、验证徽章
- 未获得证书：灰色半透明卡片，显示进度和预计完成时间

**后端 API**：

```typescript
// GET /api/report            → 返回统计数据 + 学习时长 + 课程进度
// GET /api/certificates      → 返回所有证书（已获得 + 未获得）
```

**测试方法**：

```bash
# 报告页：http://localhost:3000/report
# 检查点：
# □ 6 个统计卡片正确显示数字
# □ 柱状图条形长度与数据一致
# □ 表格数据正确渲染
# □ 状态标签颜色正确（已完成=绿、进行中=金、待复习=紫）

# 证书页：http://localhost:3000/certificates
# 检查点：
# □ 已获得证书：金色渐变、显示日期和成绩
# □ 未获得证书：半透明灰色、显示进度条
# □ hover 有上浮效果
```

**验收标准**：
- [ ] 报告页统计数字从 API 获取
- [ ] 柱状图使用 CSS `width` 百分比实现动画
- [ ] 证书卡片区分已获得/未获得两种状态
- [ ] 视觉与 demo.html 一致

---

## 你的开发时间线

```
Week 1 后半              Week 2                   Week 3
────────────────────────────────────────────────────────
任务1: Dashboard        任务4: 课程详情框架
   ↓                     ↓
任务2: 课程列表         任务4: 大纲Tab
   ↓                     ↓
任务3: 创建课程         任务5: 报告 + 证书
```

## 提交 PR 流程

每完成一个任务就提一个 PR：

```bash
# 完成任务 1 后
git add .
git commit -m "feat: 实现 Dashboard 仪表板页面"
git push origin feat/pages-display-B
gh pr create --title "feat: 实现 Dashboard 仪表板页面" --body "
## 实现内容
- 仪表板页面 UI（导航卡片 + 统计卡片）
- 点击导航卡片跳转对应页面

## 测试
- [x] 视觉与 demo.html 一致
- [x] 导航跳转正常
- [x] hover 动画正确
"
```

## FAQ

**Q: CSS 怎么用？**
A: 所有 CSS 类已经在 `globals.css` 中定义好了，你直接在 JSX 中用 `className="类名"` 就行。不需要写任何 CSS，除非 demo.html 里没有的样式。

**Q: 组件怎么挂载到路由？**
A: 在 `src/App.tsx` 中已有路由配置，你只需要在对应路径下创建文件即可。具体路由配置 Zee 会在骨架中写好。

**Q: 怎么获取后端数据？**
A: 使用 `src/lib/api.ts` 封装的 `fetchAPI` 函数：
```typescript
import { fetchAPI } from '@/lib/api';

const courses = await fetchAPI('/api/courses');
```

**Q: 不知道怎么写的组件怎么办？**
A: 1. 先看 `demo.html` 对应的 HTML 结构 → 2. 用 AI 辅助将 HTML 转换为 React 组件 → 3. 自己理解后再提交

**Q: 后端 API 怎么写？**
A: 参考 `server/routes/` 中 Zee 写的骨架文件，里面有注释模板。或者看 `demo.html` 里 `<script>` 部分的 `mock` 数据来推断接口格式。
