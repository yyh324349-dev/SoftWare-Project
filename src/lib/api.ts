/**
 * API 请求封装
 */

const API_BASE = '/api';

export async function fetchAPI<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** 快捷 GET */
export function get<T = unknown>(path: string): Promise<T> {
  return fetchAPI<T>(path);
}

/** 快捷 POST */
export function post<T = unknown>(path: string, body: unknown): Promise<T> {
  return fetchAPI<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** 快捷 PUT */
export function put<T = unknown>(path: string, body: unknown): Promise<T> {
  return fetchAPI<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** 快捷 DELETE */
export function del<T = unknown>(path: string): Promise<T> {
  return fetchAPI<T>(path, { method: 'DELETE' });
}

/** POST 请求（返回解析后的 JSON） */
export function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return fetchAPI<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** SSE 流式请求：通过 POST 发起，逐块回调文本增量 */
export function fetchSSE(
  path: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): void {
  const controller = new AbortController();

  fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('响应体不可读');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: delta')) continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                onChunk(parsed.text);
              } else if (parsed.error) {
                onError(new Error(parsed.error));
                return;
              }
            } catch {
              // 非 JSON 数据行，忽略
            }
          }
        }
      }

      onDone();
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      onError(err);
    });
}
