import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

const EXTENSIONS: Record<string, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rs',
};

const COMMANDS: Record<string, (file: string) => string[]> = {
  python: (f) => ['python3', f],
  javascript: (f) => ['node', f],
  typescript: (f) => ['npx', 'tsx', f],
};

/**
 * 在本地沙箱中执行代码
 * 写入临时文件 → spawn 子进程 → 收集输出 → 清理文件
 *
 * ⚠️ 安全警告：当前实现仅做了基本的环境变量隔离和输出限制。
 * 生产环境中应使用 Docker 容器或 VM 沙箱来隔离执行环境，
 * 以防止恶意代码访问宿主机文件系统、网络等资源。
 */
export async function executeCode(
  code: string,
  language: string,
  timeout = 10000,
): Promise<ExecutionResult> {
  const ext = EXTENSIONS[language.toLowerCase()] || 'txt';
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `mozhi-${Date.now()}.${ext}`);

  fs.writeFileSync(tmpFile, code, 'utf8');

  try {
    const getCmd = COMMANDS[language.toLowerCase()];
    if (!getCmd) {
      return {
        stdout: '',
        stderr: `不支持的语言: ${language}`,
        exitCode: 1,
        timedOut: false,
      };
    }
    return await runProcess(getCmd(tmpFile), timeout);
  } finally {
    fs.promises.unlink(tmpFile).catch(() => {});
  }
}

// 输出长度上限：10KB，防止子进程输出过多导致内存耗尽
const MAX_OUTPUT_BYTES = 10 * 1024;

function runProcess(
  command: string[],
  timeout: number,
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    // 安全：仅传递 PATH 和 HOME 环境变量，HOME 设置为临时目录
    const safeEnv: Record<string, string> = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      HOME: os.tmpdir(),
    };

    const proc = spawn(command[0], command.slice(1), {
      cwd: os.tmpdir(),
      env: safeEnv,
      timeout,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    proc.stdout.on('data', (data: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += data.toString();
        if (stdout.length > MAX_OUTPUT_BYTES) {
          stdout = stdout.slice(0, MAX_OUTPUT_BYTES) + '\n... [输出已截断，超过 10KB 上限]';
        }
      }
    });
    proc.stderr.on('data', (data: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += data.toString();
        if (stderr.length > MAX_OUTPUT_BYTES) {
          stderr = stderr.slice(0, MAX_OUTPUT_BYTES) + '\n... [输出已截断，超过 10KB 上限]';
        }
      }
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1, timedOut });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1, timedOut: false });
    });
  });
}
