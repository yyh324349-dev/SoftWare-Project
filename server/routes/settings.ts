import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../services/crypto';

const router = Router();

// GET /api/settings - 获取设置（API Key 用掩码返回）
router.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get() as Record<string, unknown> | undefined;

    if (!row) {
      res.json({
        apiKey: '',
        apiKeyExists: false,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        baseURL: '',
        language: '简体中文',
        reminder: '每天 09:00',
        defaultStyle: 'academic',
      });
      return;
    }

    // 解密 API Key
    let maskedKey = '';
    const anthropicKeyEnc = row.anthropic_key_enc as string | null;
    if (anthropicKeyEnc) {
      try {
        const decrypted = decrypt(anthropicKeyEnc);
        if (decrypted.length > 8) {
          maskedKey = decrypted.slice(0, 3) + '·'.repeat(Math.min(decrypted.length - 7, 24)) + decrypted.slice(-4);
        } else {
          maskedKey = '·'.repeat(decrypted.length);
        }
      } catch (decryptErr) {
        console.error('API Key 解密失败:', decryptErr);
        maskedKey = '解密失败';
      }
    }

    res.json({
      apiKey: maskedKey,
      apiKeyExists: !!anthropicKeyEnc,
      provider: (row.preferred_provider as string) || 'anthropic',
      model: (row.model as string) || 'claude-sonnet-4-20250514',
      baseURL: (row.base_url as string) || '',
      language: '简体中文',
      reminder: '每天 09:00',
      defaultStyle: 'academic',
    });
  } catch (err) {
    console.error('获取设置失败:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// PUT /api/settings - 更新设置
router.put('/', (req: AuthRequest, res: Response) => {
  const { apiKey, provider, model, baseURL } = req.body;

  try {
    // 加密存储 API Key
    let anthropicKeyEnc: string | null = null;
    if (apiKey && !apiKey.includes('·')) {
      anthropicKeyEnc = encrypt(apiKey);
    }

    const updateFields: string[] = [];
    const updateValues: (string | null)[] = [];

    if (anthropicKeyEnc) {
      updateFields.push('anthropic_key_enc = ?');
      updateValues.push(anthropicKeyEnc);
    }
    if (provider) {
      updateFields.push('preferred_provider = ?');
      updateValues.push(provider);
    }
    if (model) {
      updateFields.push('model = ?');
      updateValues.push(model);
    }
    if (baseURL !== undefined) {
      updateFields.push('base_url = ?');
      updateValues.push(baseURL || '');
    }

    if (updateFields.length > 0) {
      updateFields.push("updated_at = datetime('now')");
      const query = `UPDATE settings SET ${updateFields.join(', ')} WHERE id = 1`;
      db.prepare(query).run(...updateValues);
    }

    res.json({ message: '设置已保存' });
  } catch (err) {
    console.error('保存设置失败:', err);
    res.status(500).json({ error: '保存设置失败' });
  }
});

// POST /api/settings/reset - 恢复默认设置
router.post('/reset', (_req: AuthRequest, res: Response) => {
  try {
    db.prepare(`
      UPDATE settings SET
        anthropic_key_enc = NULL,
        openai_key_enc = NULL,
        preferred_provider = 'anthropic',
        model = 'claude-sonnet-4-20250514',
        base_url = '',
        updated_at = datetime('now')
      WHERE id = 1
    `).run();

    res.json({ message: '已恢复默认设置' });
  } catch (err) {
    console.error('恢复默认设置失败:', err);
    res.status(500).json({ error: '恢复默认设置失败' });
  }
});

// POST /api/settings/test - 测试 API 连接
router.post('/test', async (_req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get() as Record<string, string | null> | undefined;

    if (!row || !row.anthropic_key_enc) {
      res.status(400).json({ error: '请先配置 API Key' });
      return;
    }

    let apiKey: string;
    try {
      apiKey = decrypt(row.anthropic_key_enc);
    } catch {
      res.status(500).json({ error: 'API Key 解密失败' });
      return;
    }

    const provider = (row.preferred_provider || 'anthropic') as string;
    const model = row.model || 'claude-sonnet-4-20250514';
    const baseURL = row.base_url || undefined;

    // 动态导入 AI SDK
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const OpenAI = (await import('openai')).default;

    if (provider === 'openai' || provider === 'custom') {
      const client = new OpenAI({ apiKey, baseURL });
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: '回复"ok"' }],
        max_tokens: 10,
      });
      const reply = response.choices[0]?.message?.content || '';
      res.json({ success: true, message: `✅ 连接成功！回复：${reply.slice(0, 50)}` });
    } else {
      const client = new Anthropic({ apiKey, baseURL });
      const response = await client.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: '回复"ok"' }],
      });
      const textBlock = response.content.find((b) => b.type === 'text');
      const reply = textBlock?.type === 'text' ? textBlock.text : '';
      res.json({ success: true, message: `✅ 连接成功！回复：${reply.slice(0, 50)}` });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未知错误';
    res.json({ success: false, message: `❌ 连接失败：${msg}` });
  }
});

export default router;
