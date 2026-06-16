interface ModeToggleProps {
  value: string;
  onChange: (value: string) => void;
}

const MODES = [
  { value: 'md', label: '纯 MD 模式', hint: '纯 Markdown 渲染，轻量简洁，便于阅读和编辑' },
  { value: 'md-html', label: 'MD + HTML 混合模式', hint: '支持 HTML 标签和自定义样式，更丰富的展示效果' },
];

export default function ModeToggle({ value, onChange }: ModeToggleProps) {
  const currentMode = MODES.find(m => m.value === value) || MODES[0];

  return (
    <>
      <div className="mode-toggle">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={`mode-btn ${value === mode.value ? 'active' : ''}`}
            onClick={() => onChange(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className="hint" style={{ marginTop: '6px' }}>
        {currentMode.hint}
      </div>
    </>
  );
}
