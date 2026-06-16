interface StyleOption {
  value: string;
  icon: React.ReactNode;
  name: string;
  desc: string;
}

interface StyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const STYLES: StyleOption[] = [
  {
    value: 'minimal',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="10" x2="3" y2="10" />
        <line x1="21" y1="6" x2="3" y2="6" />
        <line x1="21" y1="14" x2="3" y2="14" />
        <line x1="17" y1="18" x2="3" y2="18" />
      </svg>
    ),
    name: '简约',
    desc: '清晰简洁，专注内容',
  },
  {
    value: 'academic',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
    name: '学术',
    desc: '正式严谨，适合理论',
  },
  {
    value: 'lively',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
    name: '活泼',
    desc: '生动有趣，适合入门',
  },
];

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="style-selector">
      {STYLES.map((style) => (
        <div className="style-option" key={style.value}>
          <input
            type="radio"
            name="style"
            id={`style-${style.value}`}
            value={style.value}
            checked={value === style.value}
            onChange={() => onChange(style.value)}
          />
          <label htmlFor={`style-${style.value}`}>
            <span className="style-icon">{style.icon}</span>
            <span className="style-name">{style.name}</span>
            <span className="style-desc">{style.desc}</span>
          </label>
        </div>
      ))}
    </div>
  );
}
