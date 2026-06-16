// ============================================================
// MoZhi Academy — useStreamChat Hook
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { fetchSSE } from '../lib/api';
import type { Message } from '../types';

interface UseStreamChatOptions {
  courseId: number | string;
  topicId: number | string;
}

interface UseStreamChatReturn {
  messages: Message[];
  sendMessage: (content: string) => void;
  isStreaming: boolean;
  error: string | null;
}

let tempIdCounter = -1;
function nextTempId() {
  return tempIdCounter--;
}

export function useStreamChat({
  courseId,
  topicId,
}: UseStreamChatOptions): UseStreamChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef(false);

  const sendMessage = useCallback(
    (content: string) => {
      if (streamingRef.current || !content.trim()) return;

      const userMessage: Message = {
        id: nextTempId(),
        topicId: Number(topicId),
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const assistantMessage: Message = {
        id: nextTempId(),
        topicId: Number(topicId),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);
      setError(null);
      streamingRef.current = true;

      fetchSSE(
        `/api/courses/${courseId}/topics/${topicId}/chat`,
        { message: content.trim() },
        // onChunk — append streamed text to the last assistant message
        (chunk: string) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return updated;
          });
        },
        // onDone
        () => {
          setIsStreaming(false);
          streamingRef.current = false;
        },
        // onError
        (err: Error) => {
          setError(err.message);
          setIsStreaming(false);
          streamingRef.current = false;
        },
      );
    },
    [courseId, topicId],
  );

  return { messages, sendMessage, isStreaming, error };
}
