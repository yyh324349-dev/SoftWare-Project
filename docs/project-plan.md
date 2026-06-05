# 🏗️ 墨智学堂 — 项目总规划

> 本文档是整个项目的核心参考。所有人以此文档为准进行开发。

---

## 一、项目概述

**墨智学堂 · AI 智能学习平台** — 一个基于 AI 的在线学习平台，用户可以创建课程、AI 自动生成教学大纲和内容、通过对话式 AI 助手学习、在浏览器中编写和运行代码。

**设计原型**：`demo.html`（仓库根目录，所有 UI 以此为准）

**技术栈**：

| 层面 | 技术 | 说明 |
|------|------|------|
| 后端框架 | Express 4 + TypeScript | API 服务器，端口 3001 |
| 前端框架 | React 19 + TypeScript | SPA 单页应用 |
| 构建工具 | Vite 6 | 前端热更新，开发端口 3000 |
| 样式方案 | 自定义 CSS（来自 demo.html） | 保留 demo.html 的设计系统 |
| 数据库 | SQLite (better-sqlite3) | 零配置，文件存储在 `data/mozhi.db` |
| 代码编辑 | Monaco Editor | 浏览器端代码编辑器 |
| 代码执行 | child_process (本地) | 本地执行用户代码 |
| AI 集成 | Anthropic SDK + OpenAI SDK | 双 Provider，用户自配 API Key |
| 流式通信 | SSE (Server-Sent Events) | AI 对话逐字输出 |
| 前端路由 | react-router-dom | SPA 客户端路由 |
| 代码编辑器 UI | @monaco-editor/react | Monaco Editor 的 React 封装 |
| 认证 | 已禁用 | 学习项目，无需认证，中间件直接放行 |
| API Key 存储 | AES-256-GCM 加密 | 用户 API Key 加密存数据库 |

---

## 二、项目文件结构

```
software-project/
├── package.json                        # 依赖和脚本
├── tsconfig.json                       # TypeScript 配置
├── vite.config.ts                      # Vite 配置（代理 /api 到 Express）
├── index.html                          # Vite SPA 入口
├── demo.html                           # 📌 UI 设计原型（参考用，不参与构建）
│
├── server/                             # ========== 后端 ==========
│   ├── index.ts                        # Express 启动入口 + WebSocket
│   ├── db.ts                           # SQLite 连接 + 建表 + 迁移
│   ├── middleware/
│   │   └── auth.ts                     # 认证中间件（已禁用，直接放行）
│   ├── routes/                         # API 路由（每人负责自己的文件）
│   │   ├── auth.ts                     # 登录/注册（已禁用）
│   │   ├── courses.ts                  # 课程 CRUD
│   │   ├── outline.ts                  # 大纲生成/查询
│   │   ├── chat.ts                     # AI 对话（SSE 流式）
│   │   ├── notes.ts                    # 笔记 CRUD + AI 生成
│   │   ├── labs.ts                     # 实验 CRUD + 生成
│   │   ├── projects.ts                 # 项目 CRUD + 生成
│   │   ├── sandbox.ts                  # 代码执行
│   │   ├── settings.ts                 # API Key 配置
│   │   ├── report.ts                   # 学习数据聚合
│   │   └── certificates.ts             # 证书
│   ├── services/                       # 核心业务逻辑
│   │   ├── ai.ts                       # AI 双 Provider 抽象
│   │   ├── generator.ts                # 两阶段内容生成
│   │   ├── crypto.ts                   # AES-256-GCM 加解密
│   │   └── terminal.ts                 # 代码执行管理器
│   ├── prompts/                        # AI 提示词模板
│   │   ├── syllabus.ts                 # 课程大纲生成
│   │   ├── labs.ts                     # 实验内容生成
│   │   ├── projects.ts                 # 项目内容生成
│   │   ├── notes.ts                    # 笔记生成
│   │   └── chat.ts                     # 对话 system prompt
│   └── helpers/
│       └── sse.ts                      # SSE 流式响应工具函数
│
├── src/                                # ========== 前端 ==========
│   ├── main.tsx                        # React 入口
│   ├── App.tsx                         # 路由配置
│   ├── globals.css                     # demo.html 全部 CSS（已迁移）
│   ├── types/
│   │   └── index.ts                    # 共享 TypeScript 类型
│   ├── lib/
│   │   ├── api.ts                      # fetch 封装
│   │   └── utils.ts                    # 工具函数
│   ├── hooks/
│   │   ├── useStreamChat.ts            # SSE 流式聊天 hook
│   │   └── useCodeExecution.ts         # 代码执行 hook
│   └── components/
│       ├── layout/                     # 布局组件（AppShell、Breadcrumb、Toast）
│       ├── dashboard/                  # 仪表板页面
│       │   └── DashboardPage.tsx
│       ├── courses/                    # 课程列表 + 创建
│       │   ├── CoursesPage.tsx
│       │   └── CreateCoursePage.tsx
│       ├── course-detail/              # 课程详情（Tab 切换框架）
│       │   ├── CourseDetailLayout.tsx   # Tab 栏 + FAB 导航
│       │   ├── outline/
│       │   │   └── OutlineTab.tsx      # CS61B 风格大纲表格
│       │   ├── notes/
│       │   │   └── NotesTab.tsx        # 侧边栏 + 笔记编辑器
│       │   ├── chat/
│       │   │   └── ChatTab.tsx         # AI 对话（流式）
│       │   ├── labs/
│       │   │   └── LabsTab.tsx         # 实验列表 + 全屏编辑器
│       │   └── projects/
│       │       └── ProjectsTab.tsx     # 里程碑 + 编辑器
│       ├── report/
│       │   └── ReportPage.tsx          # 学习报告
│       ├── certificates/
│       │   └── CertificatesPage.tsx    # 证书
│       └── settings/
│           └── SettingsPage.tsx        # 设置
│
├── data/                               # 运行时数据（gitignored）
│   └── mozhi.db                        # SQLite 数据库文件
├── scripts/
│   └── dev.ts                          # 同时启动 server + vite
└── docs/                               # 文档
    ├── project-plan.md                 # 📌 本文档
    ├── teammate-b-guide.md             # 队友 B 详细开发指南
    └── teammate-c-guide.md             # 队友 C 详细开发指南
```

### 共享文件规则

以下文件多人可能同时修改，必须遵守**只追加不改已有内容**的规则：

| 文件 | 规则 |
|------|------|
| `src/globals.css` | 新样式追加到文件末尾，**绝不修改**已有样式 |
| `src/types/index.ts` | 新类型追加到文件末尾，**绝不修改**已有类型 |
| `src/lib/api.ts` | 新函数追加，不修改已有函数 |
| `server/db.ts` | 新表追加 ALTER TABLE，不修改已有建表语句 |
| `server/index.ts` | 新路由 `app.use()` 追加到路由注册区末尾 |

---

## 三、三人分工

### 总览

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Zee（你）— 架构师 + 后端核心                                    │
│   🎯 职责：搭骨架、写基础设施、AI 集成、代码执行                     │
│                                                                 │
│   📁 项目配置文件（package.json, tsconfig, vite.config）          │
│   📁 server/index.ts, server/db.ts                              │
│   📁 server/middleware/   — 全部                                 │
│   📁 server/services/     — 全部（AI/加密/终端/生成器）            │
│   📁 server/prompts/      — 全部提示词模板                        │
│   📁 server/helpers/      — SSE 工具                             │
│   📁 server/routes/auth.ts, sandbox.ts                          │
│   📁 src/lib/             — api.ts, utils.ts                    │
│   📁 src/types/           — 类型定义                             │
│   📁 src/hooks/           — useStreamChat, useCodeExecution     │
│   📁 src/components/layout/ — AppShell, Breadcrumb, Toast       │
│   📁 src/components/course-detail/CourseDetailLayout.tsx         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   队友 B — 前端展示型页面                                         │
│   🎯 职责：数据展示、表单交互、页面布局                             │
│                                                                 │
│   📁 src/components/dashboard/     — DashboardPage              │
│   📁 src/components/courses/       — CoursesPage, CreateCourse  │
│   📁 src/components/course-detail/outline/ — OutlineTab         │
│   📁 src/components/report/        — ReportPage                 │
│   📁 src/components/certificates/  — CertificatesPage           │
│   📁 server/routes/courses.ts, outline.ts, report.ts,           │
│      certificates.ts                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   队友 C — 前端交互型页面                                         │
│   🎯 职责：AI 对话、代码编辑器、流式通信                            │
│                                                                 │
│   📁 src/components/settings/                  — SettingsPage   │
│   📁 src/components/course-detail/notes/       — NotesTab      │
│   📁 src/components/course-detail/chat/        — ChatTab       │
│   📁 src/components/course-detail/labs/        — LabsTab       │
│   📁 src/components/course-detail/projects/    — ProjectsTab   │
│   📁 server/routes/chat.ts, notes.ts, labs.ts, projects.ts,    │
│      settings.ts                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 文件归属对照表

| 文件 | Zee | 队友 B | 队友 C |
|------|:---:|:------:|:------:|
| **项目配置** (package.json 等) | ✍️ | | |
| **server/index.ts** (Express 入口) | ✍️ | | |
| **server/db.ts** (数据库) | ✍️ | | |
| **server/middleware/** | ✍️ | | |
| **server/services/** | ✍️ | | |
| **server/prompts/** | ✍️ | | |
| **server/helpers/** | ✍️ | | |
| server/routes/auth.ts | ✍️ | | |
| server/routes/courses.ts | | ✍️ | |
| server/routes/outline.ts | | ✍️ | |
| server/routes/chat.ts | | | ✍️ |
| server/routes/notes.ts | | | ✍️ |
| server/routes/labs.ts | | | ✍️ |
| server/routes/projects.ts | | | ✍️ |
| server/routes/sandbox.ts | ✍️ | | |
| server/routes/settings.ts | | | ✍️ |
| server/routes/report.ts | | ✍️ | |
| server/routes/certificates.ts | | ✍️ | |
| **src/lib/** | ✍️ | | |
| **src/types/** | ✍️ | | |
| **src/hooks/** | ✍️ | | |
| **src/components/layout/** | ✍️ | | |
| src/components/dashboard/ | | ✍️ | |
| src/components/courses/ | | ✍️ | |
| src/components/course-detail/CourseDetailLayout | ✍️ | | |
| src/components/course-detail/outline/ | | ✍️ | |
| src/components/course-detail/notes/ | | | ✍️ |
| src/components/course-detail/chat/ | | | ✍️ |
| src/components/course-detail/labs/ | | | ✍️ |
| src/components/course-detail/projects/ | | | ✍️ |
| src/components/report/ | | ✍️ | |
| src/components/certificates/ | | ✍️ | |
| src/components/settings/ | | | ✍️ |
| src/App.tsx (路由) | ✍️ | | |
| src/globals.css | ✍️ 初始迁移 | 追加 | 追加 |

> ✍️ = 负责编写 | 空白 = 不修改

---

## 四、开发顺序

### 依赖关系图

```
                        ┌─────────┐
                        │ ① 项目   │ Zee
                        │ 骨架搭建 │
                        └────┬─────┘
                             │
                    ┌────────┼────────┐
                    ▼        ▼        ▼
             ┌──────────┐ ┌──────┐ ┌──────────┐
             │ ⑨ B:     │ │ ⑭ C: │ │ ③ Zee:   │
             │ Dashboard│ │Settings│ │ 路由骨架  │
             └─────┬────┘ └──┬───┘ └─────┬────┘
                   │         │            │
             ┌─────▼────┐   │      ┌─────▼────┐
             │ ⑩ B:     │   │      │ ④ Zee:   │
             │ 课程列表  │   │      │ AI 服务   │
             └─────┬────┘   │      └─────┬────┘
                   │        │            │
             ┌─────▼────┐   │      ┌─────▼────┐
             │ ⑪ B:     │   │      │ ⑤ Zee:   │
             │ 创建课程  │   │      │ SSE 流式  │
             └─────┬────┘   │      └─────┬────┘
                   │        │            │
             ┌─────▼────────▼─────┐ ┌───▼──────┐
             │ ⑫ B: 大纲 Tab      │ │ ⑥ Zee:   │
             │ ⑬ B: 报告+证书     │ │ 内容生成  │
             └────────────────────┘ └────┬─────┘
                                        │
                   ┌────────────────────┬┘
                   ▼                    ▼
             ┌───────────┐      ┌───────────┐
             │ ⑮ C:      │      │ ⑦ Zee:    │
             │ Notes Tab │      │ 代码执行   │
             │ ⑯ C:      │      └─────┬─────┘
             │ Chat Tab  │            │
             └───────────┘      ┌─────▼─────┐
                                │ ⑰ C:      │
                                │ Labs Tab  │
                                │ ⑱ C:      │
                                │Projects Tab│
                                └───────────┘
```

### 分阶段时间表

#### 第 1 周：基础设施

| 序号 | 谁做 | 任务 | 产出 | 前置依赖 |
|:----:|------|------|------|----------|
| ① | Zee | **项目骨架搭建** | Express + Vite + TypeScript 脚手架，`npm run dev` 能跑 | 无 |
| ② | Zee | **数据库建表** | `server/db.ts`，所有表创建 + 迁移 | ① |
| ③ | Zee | **路由骨架** | 11 个路由文件（空壳返回 mock 数据） | ① |
| ⑨ | 队友B | Dashboard 仪表板 | DashboardPage 组件 | ① |
| ⑭ | 队友C | Settings 设置页 | SettingsPage + settings API | ① |

> **里程碑**：第 1 周结束，`npm run dev` 能启动，能看到 Dashboard 页面，能配置 API Key。

#### 第 2 周：核心功能

| 序号 | 谁做 | 任务 | 产出 | 前置依赖 |
|:----:|------|------|------|----------|
| ④ | Zee | **AI 双 Provider 服务** | `services/ai.ts`，支持 Anthropic + OpenAI | ② |
| ⑤ | Zee | **SSE 流式传输** | `helpers/sse.ts` + `hooks/useStreamChat.ts` | ④ |
| ⑥ | Zee | **内容生成器** | `services/generator.ts` + 全部 prompts | ④⑤ |
| ⑩ | 队友B | 课程列表页 | CoursesPage + courses API | ③ |
| ⑪ | 队友B | 创建课程页 | CreateCoursePage + 表单组件 | ③ |
| ⑮ | 队友C | Notes 笔记 Tab | NotesTab + notes API | ⑥ |
| ⑯ | 队友C | Chat 对话 Tab | ChatTab + chat API（SSE） | ⑤ |

> **里程碑**：第 2 周结束，能创建课程、AI 能生成大纲、能进行流式对话。

#### 第 3 周：完善 + 联调

| 序号 | 谁做 | 任务 | 产出 | 前置依赖 |
|:----:|------|------|------|----------|
| ⑦ | Zee | **代码执行沙箱** | `services/terminal.ts` + sandbox API | ① |
| ⑧ | Zee | **联调 + Bug 修复** | 整体功能调试 | 所有 |
| ⑫ | 队友B | 大纲 Tab | OutlineTab（CourseDetailLayout 由 Zee 提供） | ⑥ |
| ⑬ | 队友B | 学习报告 + 证书 | ReportPage + CertificatesPage | ③ |
| ⑰ | 队友C | Labs 实验 Tab | LabsTab + Monaco Editor + 代码执行 | ⑦ |
| ⑱ | 队友C | Projects 项目 Tab | ProjectsTab（复用 Lab 编辑器） | ⑦ |

> **里程碑**：第 3 周结束，所有功能可用，可以演示完整流程。

---

## 五、本地开发流程

```bash
# 首次设置
git clone https://github.com/LilZeeCN/SoftWare-Project.git
cd SoftWare-Project
npm install

# 日常开发
npm run dev              # 同时启动 Express(:3001) + Vite(:3000)
# 浏览器打开 http://localhost:3000

# 每个人的分支
git checkout -b feat/你的功能-你的名字   # 创建分支
git push origin feat/你的功能-你的名字   # 推送分支
gh pr create --title "feat: 功能描述"     # 提 PR
```

> ⚠️ **提交前进度记录（必读）**
>
> 项目根目录下有 `progress/` 文件夹，每人有自己的子目录：
>
> | 目录 | 成员 |
> |------|------|
> | `progress/zee/` | Zee |
> | `progress/zuoyuo/` | 队友 B |
> | `progress/yyh/` | 队友 C |
>
> **每次 `git commit` 之前**，必须先在自己文件夹里新建或更新一个 `.md` 文件，记录本次完成了什么：
> - 文件命名：`YYYY-MM-DD-简述.md`（如 `2026-06-05-Dashboard页面.md`）
> - 内容包含：完成的功能、修改的文件、遇到的问题（可选）
>
> 不写进度记录就提交的 PR 会被要求补充后再合并。

---

## 六、数据库表设计

SQLite 共 15 张表：

| 表名 | 用途 | 负责人 |
|------|------|--------|
| auth_config | 密码存储（bcrypt，已停用） | Zee |
| settings | API Key（加密）+ 偏好设置 | Zee |
| courses | 课程（标题、描述、风格、格式） | 队友B 的 API |
| syllabus | 课程大纲（每周主题、状态） | 队友B 的 API |
| lectures | 章节讲义内容（按需生成） | Zee |
| topics | 聊天对话主题 | 队友C 的 API |
| messages | 聊天消息记录 | 队友C 的 API |
| labs | 实验（说明、起始代码、测试用例） | 队友C 的 API |
| projects | 项目（里程碑、起始代码） | 队友C 的 API |
| topic_notes | 章节笔记 | 队友C 的 API |
| course_memory | AI 学生画像（个性化用） | Zee |
| certificates | 证书 | 队友B 的 API |
| learning_sessions | 学习时长记录 | 队友B 的 API |
| lecture_progress | 章节完成进度 | Zee |
| lab_files | 实验代码文件存储 | 队友C 的 API |

> 建表 SQL 由 Zee 在 `server/db.ts` 中统一管理，其他人在各自的路由文件中只做 CRUD 操作。
> SQLite 共 15 张表（含 lab_files）。

---

## 七、API 路由总览

所有 API 以 `/api/` 为前缀，Vite 开发模式自动代理到 Express。

### 认证（已禁用）

> 本项目为学习项目，不启用真实认证。中间件直接放行所有请求，auth 路由返回固定响应。

| 方法 | 路径 | 说明 | 负责人 |
|------|------|------|--------|
| POST | /api/auth/setup | 已禁用，返回固定 token | Zee |
| POST | /api/auth/login | 已禁用，返回固定 token | Zee |
| GET | /api/auth/status | 返回 `{ setup: true, disabled: true }` | Zee |

### 课程（队友 B）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses | 课程列表 |
| POST | /api/courses | 创建课程 |
| GET | /api/courses/:id | 课程详情 |
| DELETE | /api/courses/:id | 删除课程 |
| GET | /api/courses/:id/syllabus | 获取大纲 |
| POST | /api/courses/:id/syllabus/refresh | 重新生成大纲 |

### 对话（队友 C）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses/:id/topics | 对话主题列表 |
| POST | /api/courses/:id/topics | 创建新主题 |
| GET | /api/chat/topics/:id/messages | 历史消息 |
| POST | /api/chat | 发送消息（SSE 流式） |

### 笔记（队友 C）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses/:id/notes | 笔记列表 |
| GET | /api/courses/:id/notes/:week | 章节笔记 |
| PUT | /api/courses/:id/notes/:week | 更新笔记 |
| POST | /api/courses/:id/notes/generate | AI 生成笔记 |

### 实验（队友 C）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses/:id/labs | 实验列表 |
| GET | /api/courses/:id/labs/:labId | 实验详情 + 文件 |
| PUT | /api/courses/:id/labs/:labId/files | 保存代码 |
| POST | /api/courses/:id/labs/:labId/run | 执行代码 |

### 项目（队友 C）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses/:id/projects | 项目列表 |
| GET | /api/courses/:id/projects/:projId | 项目详情 + 里程碑 |
| PUT | /api/courses/:id/projects/:projId/milestones/:msId | 更新里程碑 |

### 报告 & 证书（队友 B）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/report | 学习统计数据 |
| GET | /api/certificates | 证书列表 |

### 代码执行（Zee）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/sandbox/run | 执行代码 |

### 设置（队友 C）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/settings | 获取设置 |
| PUT | /api/settings | 更新设置 |

---

## 八、前端路由

React Router 路由配置：

| 路径 | 页面组件 | 负责人 |
|------|----------|--------|
| `/` | → 重定向到 `/dashboard` | Zee |
| `/dashboard` | DashboardPage | 队友B |
| `/courses` | CoursesPage | 队友B |
| `/courses/new` | CreateCoursePage | 队友B |
| `/courses/:id` | CourseDetailLayout → 默认大纲 Tab | 队友B |
| `/courses/:id/outline` | OutlineTab | 队友B |
| `/courses/:id/notes` | NotesTab | 队友C |
| `/courses/:id/chat` | ChatTab | 队友C |
| `/courses/:id/labs` | LabsTab | 队友C |
| `/courses/:id/projects` | ProjectsTab | 队友C |
| `/report` | ReportPage | 队友B |
| `/certificates` | CertificatesPage | 队友B |
| `/settings` | SettingsPage | 队友C |
| `/login` | LoginPage | Zee |

---

## 九、参考资源

| 资源 | 说明 |
|------|------|
| `demo.html` | UI 设计原型，所有页面样式和结构以此为准 |
| `CONTRIBUTING.md` | Git 协作流程、分支命名、Commit 规范 |
| `docs/teammate-b-guide.md` | 队友 B 详细开发指南（每个任务的测试和验收标准） |
| `docs/teammate-c-guide.md` | 队友 C 详细开发指南（每个任务的测试和验收标准） |
| interactive-tutor 项目 | 后端模式参考（AI 集成、SSE、代码执行、内容生成） |

---

## 十、验收标准（项目整体）

项目完成的最终标准：

- [ ] `npm install && npm run dev` 一键启动
- [ ] Dashboard 页面正确显示统计数据和导航
- [ ] 能创建课程，AI 自动生成教学大纲
- [ ] 大纲以 CS61B 风格表格展示
- [ ] AI 对话 Tab 能进行流式对话（逐字输出）
- [ ] 笔记 Tab 能 AI 生成笔记
- [ ] 实验 Tab 能在 Monaco 编辑器中写代码并运行
- [ ] 项目 Tab 有里程碑管理和编辑器
- [ ] 设置页能配置 API Key 并加密存储
- [ ] 报告页显示学习统计数据和图表
- [ ] 证书页区分已获得/未获得状态
- [ ] 整体视觉效果与 demo.html 一致
