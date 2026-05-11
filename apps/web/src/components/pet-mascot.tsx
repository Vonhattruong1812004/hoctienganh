import type { CSSProperties } from 'react';

type PetMascotProps = {
  mood?: 'VuiVe' | 'HocChung' | 'PhanKich' | 'BinhAn' | 'NhoBan';
  level?: number;
  size?: number;
};

const moodPalette: Record<NonNullable<PetMascotProps['mood']>, string> = {
  VuiVe: '#14b8a6',
  HocChung: '#3b82f6',
  PhanKich: '#ec4899',
  BinhAn: '#8b5cf6',
  NhoBan: '#f59e0b',
};

export function PetMascot({ mood = 'VuiVe', level = 1, size = 240 }: PetMascotProps) {
  const accent = moodPalette[mood];

  return (
    <div
      className="petMascotWrap"
      style={{ '--pet-size': `${size}px`, '--pet-accent': accent } as CSSProperties}
      aria-label={`Pet ${mood}`}
    >
      <svg className="petMascot" viewBox="0 0 240 240" role="img" aria-hidden="true">
        <ellipse cx="120" cy="126" rx="72" ry="88" fill="#18212f" />
        <ellipse cx="120" cy="136" rx="48" ry="58" fill="#f8fafc" />
        <circle cx="95" cy="96" r="8" fill="#0f172a" />
        <circle cx="145" cy="96" r="8" fill="#0f172a" />
        <path d="M107 117 C116 124, 124 124, 133 117" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M72 111 C56 96, 50 76, 58 62 C71 69, 82 79, 87 92" fill="#dbeafe" />
        <path d="M168 111 C184 96, 190 76, 182 62 C169 69, 158 79, 153 92" fill="#dbeafe" />
        <path d="M92 150 C101 164, 139 164, 148 150" fill={accent} opacity="0.95" />
        <rect x="74" y="168" width="92" height="16" rx="8" fill={accent} />
        <rect x="58" y="176" width="124" height="10" rx="5" fill="#f8fafc" opacity="0.65" />
        <circle cx="87" cy="92" r="2.5" fill="#f8fafc" />
        <circle cx="137" cy="92" r="2.5" fill="#f8fafc" />
      </svg>

      <div className="petMascotBadge">
        <span>{mood}</span>
        <strong>Lv. {level}</strong>
      </div>
    </div>
  );
}
