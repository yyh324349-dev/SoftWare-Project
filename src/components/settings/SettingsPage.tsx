import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, put, post } from '@/lib/api';

interface Settings {
  apiKey: string;
  apiKeyExists: boolean;
  provider: string;
  model: string;
  baseURL: string;
  language: string;
  reminder: string;
  defaultStyle: string;
}

const PROVIDER_DEFAULTS: Record<string, { model: string; baseURL: string }> = {
  anthropic: { model: 'claude-sonnet-4-20250514', baseURL: 'https://api.anthropic.com' },
  openai: { model: 'gpt-4o', baseURL: 'https://api.openai.com/v1' },
  custom: { model: '', baseURL: '' },
};

const LANGUAGE_OPTIONS = ['简体中文', 'English', '繁體中文'];
const REMINDER_OPTIONS = ['不提醒', '每天 09:00', '每天 19:00', '自定义'];
const STYLE_OPTIONS = ['简约', '学术', '活泼'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    apiKey: '', apiKeyExists: false, provider: 'anthropic',
    model: 'claude-sonnet-4-20250514', baseURL: 'https://api.anthropic.com',
    language: '简体中文', reminder: '每天 09:00', defaultStyle: 'academic',
  });
  const [showInput, setShowInput] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await get<Settings>('/settings');
      setSettings(data);
    } catch {
      setMessage({ type: 'error', text: '加载设置失败' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleProviderChange = (provider: string) => {
    const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;
    setSettings({
      ...settings,
      provider,
      model: defaults.model || settings.model,
      baseURL: defaults.baseURL,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, string> = {
        provider: settings.provider,
        model: settings.model,
        baseURL: settings.baseURL,
        language: settings.language,
        reminder: settings.reminder,
        defaultStyle: settings.defaultStyle,
      };
      if (newApiKey) payload.apiKey = newApiKey;

      await put('/settings', payload);
      setMessage({ type: 'success', text: '设置已保存' });
      setNewApiKey('');
      setShowInput(false);
      await fetchSettings();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '保存失败' });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await post<{ success: boolean; message: string }>('/settings/test', {});
      setMessage({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '测试失败' });
    }
    setTesting(false);
  };

  const handleReset = async () => {
    try {
      await post('/settings/reset', {});
      setNewApiKey('');
      setShowInput(false);
      await fetchSettings();
      setMessage({ type: 'success', text: '已恢复默认设置' });
    } catch {
      setMessage({ type: 'error', text: '恢复默认设置失败' });
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
        <div className="page-header">
          <div className="breadcrumb">
            <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
            <span className="sep">/</span>
            <span>设置</span>
          </div>
          <h1>API 配置</h1>
          <p>配置 AI 供应商信息，用于驱动所有 AI 学习功能</p>
        </div>
        <div className="empty-state"><div className="empty-icon">⚙️</div><div className="empty-text">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="page" style={{ animation: 'pageEnter 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb">
          <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
          <span className="sep">/</span>
          <span>设置</span>
        </div>
        <h1>API 配置</h1>
        <p>配置 AI 供应商信息，用于驱动所有 AI 学习功能</p>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--jade-glow)' : 'rgba(239,68,68,0.1)',
          border: message.type === 'success' ? '1px solid rgba(69,214,181,0.2)' : '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px',
          color: message.type === 'success' ? 'var(--jade)' : 'var(--danger)', fontSize: '13px',
        }}>
          {message.text}
        </div>
      )}

      <div className="settings-group">
        <div className="sg-title">模型配置</div>
        <div className="settings-card">

          {/* API 供应商 */}
          <div className="settings-row">
            <div className="sr-label">API 供应商</div>
            <div className="sr-input">
              <div style={{ display: 'flex', gap: '8px' }}>
                {['anthropic', 'openai', 'custom'].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: settings.provider === p ? 'var(--gold-glow)' : 'var(--bg-glass)',
                      border: settings.provider === p ? '1px solid var(--gold)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: settings.provider === p ? 'var(--gold)' : 'var(--text-secondary)',
                      fontSize: '13px', fontWeight: settings.provider === p ? 600 : 400,
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {p === 'anthropic' ? 'Anthropic' : p === 'openai' ? 'OpenAI' : '自定义兼容'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className="settings-row">
            <div className="sr-label">API Key</div>
            <div className="sr-input">
              {showInput ? (
                <input
                  type="password" value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="输入 API Key"
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-glass)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--border-active)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
              ) : (
                <div className="key-display">
                  <span className="key-value">
                    {settings.apiKeyExists ? settings.apiKey : '未配置 API Key'}
                  </span>
                  <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => setShowInput(true)}>
                    {settings.apiKeyExists ? '修改' : '配置'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 端点地址 */}
          <div className="settings-row">
            <div className="sr-label">端点地址</div>
            <div className="sr-input">
              <input
                type="text" value={settings.baseURL}
                onChange={(e) => setSettings({ ...settings, baseURL: e.target.value })}
                placeholder={settings.provider === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'}
                style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-glass)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-active)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>

          {/* 模型名称 */}
          <div className="settings-row">
            <div className="sr-label">模型名称</div>
            <div className="sr-input">
              <input
                type="text" value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                placeholder={settings.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o'}
                style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-glass)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-active)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 学习偏好 */}
      <div className="settings-group">
        <div className="sg-title">学习偏好</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="sr-label">语言</div>
            <div className="sr-input">
              <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                {LANGUAGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-label">每日学习提醒</div>
            <div className="sr-input">
              <select value={settings.reminder} onChange={(e) => setSettings({ ...settings, reminder: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                {REMINDER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-label">讲义默认风格</div>
            <div className="sr-input">
              <select value={settings.defaultStyle} onChange={(e) => setSettings({ ...settings, defaultStyle: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                {STYLE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: 0, paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary" onClick={handleReset}>恢复默认</button>
        <button className="btn btn-secondary" onClick={handleTest} disabled={testing}
          style={{ borderColor: 'var(--border-active)', color: 'var(--gold)' }}>
          {testing ? '测试中...' : '🔌 测试连接'}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
