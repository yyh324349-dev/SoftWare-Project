import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import db from '../db';
import { decrypt } from './crypto';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
}

interface AISettings {
  preferredProvider: string;
  model: string;
  baseURL?: string;
  anthropicKey?: string;
  openaiKey?: string;
}

/** 从数据库读取并解密 AI 配置 */
function getAISettings(): AISettings {
  const row = db
    .prepare('SELECT * FROM settings WHERE id = 1')
    .get() as Record<string, string | null> | undefined;

  if (!row) throw new Error('请先在设置中配置 API Key');

  return {
    preferredProvider: row.preferred_provider || 'anthropic',
    model: row.model || 'claude-sonnet-4-20250514',
    baseURL: row.base_url || undefined,
    anthropicKey: row.anthropic_key_enc ? decrypt(row.anthropic_key_enc) : undefined,
    openaiKey: row.openai_key_enc ? decrypt(row.openai_key_enc) : undefined,
  };
}

/** 非流式 AI 对话，返回完整文本 */
export async function chat(
  systemPrompt: string,
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<string> {
  const settings = getAISettings();
  const maxTokens = options?.maxTokens || 4096;

  if ((settings.preferredProvider === 'openai' || settings.preferredProvider === 'custom') && settings.openaiKey) {
    return chatOpenAI(settings.openaiKey, settings.model, systemPrompt, messages, settings.baseURL, maxTokens);
  }

  if (settings.anthropicKey) {
    return chatAnthropic(settings.anthropicKey, settings.model, systemPrompt, messages, settings.baseURL, maxTokens);
  }

  throw new Error('请先在设置中配置 API Key');
}

/** 流式 AI 对话，逐块 yield 文本 */
export async function* chatStream(
  systemPrompt: string,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const settings = getAISettings();

  if ((settings.preferredProvider === 'openai' || settings.preferredProvider === 'custom') && settings.openaiKey) {
    yield* streamOpenAI(settings.openaiKey, settings.model, systemPrompt, messages, settings.baseURL);
    return;
  }

  if (settings.anthropicKey) {
    yield* streamAnthropic(settings.anthropicKey, settings.model, systemPrompt, messages, settings.baseURL);
    return;
  }

  throw new Error('请先在设置中配置 API Key');
}

// ========== Anthropic ==========

async function chatAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  baseURL?: string,
  maxTokens: number = 4096,
): Promise<string> {
  const client = new Anthropic({ apiKey, baseURL });
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI 返回了非文本内容');
  }
  return textBlock.text;
}

async function* streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  baseURL?: string,
): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey, baseURL });
  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

// ========== OpenAI ==========

async function chatOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  baseURL?: string,
  maxTokens: number = 4096,
): Promise<string> {
  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

async function* streamOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  baseURL?: string,
): AsyncGenerator<string> {
  const client = new OpenAI({ apiKey, baseURL });
  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
