# 🤝 团队协作指南

## 项目信息

- **仓库**: [SoftWare-Project](https://github.com/LilZeeCN/SoftWare-Project)
- **团队**: 3 人
- **技术栈**: Express + React + TypeScript + SQLite
- **AI 辅助**: 允许使用 AI（Claude / ChatGPT 等）辅助开发

---

## Git 协作流程

### 核心规则

> **`main` 分支受保护，任何人不能直接推送！所有改动必须通过 PR 合并。**

### 每个人开始工作前

```bash
# 1. 先拉取最新代码（每次开始工作前必做！）
git checkout main
git pull origin main

# 2. 创建自己的功能分支（命名规则：feat/功能名-你的名字）
git checkout -b feat/dashboard-ui-zee

# 3. 在分支上开发...
```

### 完成一个功能后

```bash
# 1. 提交你的改动
git add .
git commit -m "feat: 添加 Dashboard 页面"

# 2. 推送你的分支到 GitHub
git push origin feat/dashboard-ui-zee

# 3. 在 GitHub 上创建 Pull Request（PR）
#    可以用命令行：
gh pr create --title "feat: 添加 Dashboard 页面" --body "实现了仪表板页面的 UI 组件"
```

### 审核 & 合并（仓库管理员操作）

```bash
# 1. 查看 PR
gh pr list

# 2. 在本地测试 PR 的代码
gh pr checkout <PR编号>

# 3. 确认没问题后，合并 PR
gh pr merge <PR编号> --squash   # squash 合并，保持 main 干净

# 4. 删除已合并的远程分支
git push origin --delete feat/dashboard-ui-zee
```

### 避免冲突的关键操作

```bash
# 在提交 PR 之前，先从 main 拉取最新代码合并到你的分支：
git checkout feat/dashboard-ui-zee
git fetch origin
git merge origin/main

# 如果有冲突：
# 1. 打开冲突文件，找到 <<<<<<< 和 >>>>>>> 标记
# 2. 手动选择保留哪部分代码
# 3. 删除冲突标记
# 4. git add . && git commit
```

---

## 分支命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 新功能 | `feat/功能名-姓名` | `feat/dashboard-ui-zee` |
| 修复 | `fix/问题描述-姓名` | `fix/login-redirect-bug-zee` |
| 样式 | `style/页面名-姓名` | `style/course-card-zee` |
| 重构 | `refactor/模块名-姓名` | `refactor/api-routes-zee` |

---

## Commit 信息规范

```
feat: 添加了什么新功能
fix: 修复了什么 bug
style: 调整了什么样式（不影响功能）
refactor: 重构了什么代码
docs: 更新了什么文档
chore: 构建工具/依赖变更
```

示例：
```
feat: 添加 Dashboard 统计卡片组件
fix: 修复课程列表分页不生效的问题
style: 调整 Lab Workspace 终端面板高度
```

---

## 任务分工

### 成员 A（Zee - 仓库管理员）
- 项目架构搭建
- Express 后端核心（路由、数据库、中间件）
- AI 集成（双 Provider、SSE 流式）
- 代码执行沙箱
- 部署

### 成员 B
- Dashboard 页面
- 课程列表页 + 创建课程页
- 课程详情 - Outline 大纲 Tab
- 学习报告页
- 证书页面

### 成员 C
- 课程详情 - Notes 笔记 Tab
- 课程详情 - AI Chat 对话 Tab
- 课程详情 - Labs 实验 Tab（编辑器 + 终端）
- 课程详情 - Projects 项目 Tab
- Settings 设置页

> ⚠️ 注意：每个成员负责自己模块的前端 + 对应的后端 API。如果两个模块共享一个 API，由先写的那个人负责。

---

## 冲突避免策略

1. **文件所有权原则**: 每个人尽量只改自己负责的文件，减少交叉修改
2. **频繁同步**: 每天开始工作前 `git pull origin main`
3. **小步提交**: 不要攒一大堆改动再提交，完成一个小功能就提交
4. **共享文件约定**:
   - `src/globals.css` — 新增样式追加到文件末尾，不要改别人的样式
   - `src/types/index.ts` — 新增类型追加到文件末尾
   - `src/lib/` 下的工具函数 — 新建文件，不修改已有文件
   - `server/routes/` — 每个路由独立文件，不存在冲突

---

## AI 辅助开发指南

### ✅ 推荐用法
- 让 AI 帮你写组件代码、后端 API
- 让 AI 帮你 debug 错误
- 让 AI 解释你不理解的代码

### ⚠️ 注意事项
- AI 生成的代码要先**自己看懂**再提交
- 每次 AI 生成的代码都要**本地测试通过**再推 PR
- 不要让 AI 直接修改别人负责的文件
- 提交前检查 AI 有没有改到不相关的文件

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/LilZeeCN/SoftWare-Project.git
cd SoftWare-Project

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 开始开发（创建自己的分支）
git checkout -b feat/你的功能-你的名字
```
