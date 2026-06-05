// ============================================================
// MoZhi Academy — useCodeExecution Hook
// ============================================================

import { useState, useCallback } from 'react';
import { apiPost } from '../lib/api';

interface ExecuteParams {
  files: Record<string, string>;
  command: string;
  language: string;
}

interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

interface UseCodeExecutionReturn {
  execute: (params: ExecuteParams) => Promise<void>;
  output: string;
  isRunning: boolean;
  error: string | null;
}

export function useCodeExecution(): UseCodeExecutionReturn {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: ExecuteParams) => {
    setIsRunning(true);
    setError(null);
    setOutput('');

    try {
      const result = await apiPost<ExecutionResult>(
        '/api/sandbox/execute',
        params,
      );

      if (result.error) {
        setError(result.error);
        setOutput(result.error);
      } else {
        const combined = [result.stdout, result.stderr]
          .filter(Boolean)
          .join('\n');
        setOutput(combined || '(no output)');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setOutput(`Error: ${message}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { execute, output, isRunning, error };
}
