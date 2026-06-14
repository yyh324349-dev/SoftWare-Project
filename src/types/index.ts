// ========== 课程相关类型 ==========

export type CourseStyle = 'minimal' | 'academic' | 'lively';
export type CourseFormat = 'markdown' | 'md-html' | 'cs61b';
export type CourseStatus = 'active' | 'completed';

export interface Course {
  id: number;
  title: string;
  description: string;
  style: CourseStyle;
  format: CourseFormat;
  status: CourseStatus;
  progress: number;
  chapters: number;
  completedChapters: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  preferences?: string;
  style: CourseStyle;
  format: CourseFormat;
}

// ========== 大纲相关类型 ==========

export type WeekStatus = 'done' | 'active' | 'not_started';

export interface SyllabusWeek {
  id: number;
  weekNumber: number;
  topic: string;
  description: string;
  reading?: string;
  status: WeekStatus;
  lab?: { title: string; status: string };
  project?: { title: string; status: string };
  discussion?: boolean;
}

export interface SyllabusSection {
  title: string;
  weeks: SyllabusWeek[];
}

export interface SyllabusData {
  courseId: number;
  courseTitle: string;
  totalWeeks: number;
  labCount: number;
  projectCount: number;
  sections: SyllabusSection[];
}

// ========== 报告相关类型 ==========

export interface ReportStats {
  totalChapters: number;
  totalHours: number;
  completedLabs: number;
  certificates: number;
  aiQueries: number;
  streakDays: number;
}

export interface WeeklyHours {
  day: string;
  hours: number;
}

export interface CourseProgress {
  name: string;
  progress: number;
  color: string;
}

export interface StudyRecord {
  date: string;
  content: string;
  duration: string;
  status: 'completed' | 'in_progress' | 'review';
}

export interface ReportData {
  stats: ReportStats;
  weeklyHours: WeeklyHours[];
  courseProgress: CourseProgress[];
  recentRecords: StudyRecord[];
}

// ========== 证书相关类型 ==========

export interface Certificate {
  id: number;
  courseTitle: string;
  issuedAt: string;
  grade: string;
  verified: boolean;
  progress?: number;
  estimatedCompletion?: string;
  locked: boolean;
}

// ========== 聊天相关类型 ==========

export interface Message {
  id: number;
  topicId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
