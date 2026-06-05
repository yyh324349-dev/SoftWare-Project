import { Response } from 'express';

/** 设置 SSE 响应头 */
export function initSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
}

/** 发送一个 SSE 事件 */
export function sendSSE(res: Response, event: string, data: unknown): void {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** 发送文本增量（用于 AI 流式输出） */
export function sendSSEChunk(res: Response, text: string): void {
  sendSSE(res, 'delta', { text });
}

/** 结束 SSE 流 */
export function endSSE(res: Response): void {
  if (res.writableEnded) return;
  res.write('event: done\ndata: [DONE]\n\n');
  res.end();
}

/** 发送 SSE 错误并关闭流 */
export function sendSSEError(res: Response, message: string): void {
  sendSSE(res, 'error', { message });
  endSSE(res);
}

/** setupSSE 是 initSSE 的别名，保持命名一致性 */
export const setupSSE = initSSE;
