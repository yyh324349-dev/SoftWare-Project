import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import './db';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import coursesRoutes from './routes/courses';
import outlineRoutes from './routes/outline';
import chatRoutes from './routes/chat';
import notesRoutes from './routes/notes';
import labsRoutes from './routes/labs';
import projectsRoutes from './routes/projects';
import sandboxRoutes from './routes/sandbox';
import settingsRoutes from './routes/settings';
import reportRoutes from './routes/report';
import certificatesRoutes from './routes/certificates';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ========== 中间件 ==========

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// JWT 认证（/api/auth/* 路由会自动跳过）
app.use('/api', authMiddleware);

// ========== 路由 ==========

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);       // 课程 CRUD
app.use('/api', outlineRoutes);               // 课程大纲 /courses/:id/syllabus
app.use('/api', chatRoutes);                  // 聊天 /courses/:id/topics 和 /chat
app.use('/api', notesRoutes);                 // 笔记 /courses/:id/notes
app.use('/api', labsRoutes);                  // 实验 /courses/:id/labs
app.use('/api', projectsRoutes);              // 项目 /courses/:id/projects
app.use('/api/sandbox', sandboxRoutes);       // 沙箱代码执行
app.use('/api/settings', settingsRoutes);     // 用户设置
app.use('/api/report', reportRoutes);         // 学习报告
app.use('/api/certificates', certificatesRoutes); // 证书

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== 生产环境静态文件 ==========

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ========== 全局错误处理 ==========

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ 未捕获的错误:', err.stack || err.message);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// ========== 启动 ==========

// 生产环境安全检查
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  警告: 生产环境未设置 JWT_SECRET，正在使用不安全的默认值！');
  }
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  警告: 生产环境未设置 ENCRYPTION_KEY，API Key 加密将不安全！');
  }
}

app.listen(PORT, () => {
  console.log(`🚀 墨智学堂 API 服务已启动 → http://localhost:${PORT}`);
});

