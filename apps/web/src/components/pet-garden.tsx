import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

type PetSpecies = {
  code: string;
  name: string;
  tone: string;
  title: string;
  subtitle: string;
  accent: string;
};

const petSpecies: PetSpecies[] = [
  {
    code: 'rabbit',
    name: 'Thỏ Lúa Mạch',
    tone: 'Nhanh nhẹn',
    title: 'Nhặt từ vựng mới mỗi ngày',
    subtitle: 'Hợp với chủ đề thức ăn, màu sắc và đồ vật học tập.',
    accent: '#f59e0b',
  },
  {
    code: 'turtle',
    name: 'Rùa Xanh',
    tone: 'Bền bỉ',
    title: 'Học chậm mà chắc',
    subtitle: 'Hợp với ngữ pháp, lộ trình dài và tiến trình ổn định.',
    accent: '#10b981',
  },
  {
    code: 'fish',
    name: 'Cá Sao Biển',
    tone: 'Mềm mại',
    title: 'Bơi qua các audio ngắn',
    subtitle: 'Hợp với luyện nghe, nhịp điệu và phát âm cơ bản.',
    accent: '#38bdf8',
  },
  {
    code: 'penguin',
    name: 'Pingu',
    tone: 'Bạn đồng hành',
    title: 'Nhân vật trung tâm của hệ thống',
    subtitle: 'Đi cùng mini game, nhiệm vụ và pet action.',
    accent: '#8b5cf6',
  },
  {
    code: 'pig',
    name: 'Heo Bơ',
    tone: 'Vui tươi',
    title: 'Thu thập coin và badge',
    subtitle: 'Hợp với phần thưởng, streak và nhiệm vụ ngày.',
    accent: '#f472b6',
  },
];

export function PetGarden() {
  const [selectedCode, setSelectedCode] = useState(petSpecies[3].code);
  const selectedPet = useMemo(
    () => petSpecies.find((pet) => pet.code === selectedCode) ?? petSpecies[3],
    [selectedCode],
  );

  return (
    <section id="playground-pets" className="petGarden panel">
      <div className="sectionTitle">
        <div>
          <p className="eyebrow">Bộ sưu tập pet</p>
          <h2>Nhân vật học tập có hồn hơn</h2>
          <span>Thêm chiều sâu thị giác cho hệ thống bằng nhiều pet đại diện theo cảm xúc và nhiệm vụ.</span>
        </div>
        <span className="inlineBadge">Pixel + vector hybrid</span>
      </div>

      <div className="petGardenFeature">
        <div className="petGardenPreview" style={{ '--pet-card-accent': selectedPet.accent } as CSSProperties}>
          <div className="petGardenPreviewHead">
            <div>
              <p className="eyebrow">Pet đang chọn</p>
              <h3>{selectedPet.name}</h3>
              <span>{selectedPet.tone}</span>
            </div>
            <em>{selectedPet.code.toUpperCase()}</em>
          </div>

          <div className="petGardenPreviewStage">
            {renderPetIllustration(selectedPet.code)}
          </div>

          <div className="petGardenPreviewBody">
            <strong>{selectedPet.title}</strong>
            <p>{selectedPet.subtitle}</p>
          </div>
        </div>

        <div className="petGardenMeta">
          <div className="petGardenMetaRow">
            <span>Độ vui</span>
            <strong>92%</strong>
          </div>
          <div className="petGardenMetaRow">
            <span>Độ học tập</span>
            <strong>87%</strong>
          </div>
          <div className="petGardenMetaRow">
            <span>Tương tác</span>
            <strong>Pet action + nhiệm vụ</strong>
          </div>
          <div className="petGardenSelector">
            {petSpecies.map((pet) => (
              <button
                className={`petGardenSelect ${selectedCode === pet.code ? 'active' : ''}`}
                key={pet.code}
                type="button"
                onClick={() => setSelectedCode(pet.code)}
              >
                <span>{pet.name}</span>
                <small>{pet.tone}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="petGardenGrid">
        {petSpecies.map((pet, index) => (
          <article
            className={`petSpeciesCard ${selectedCode === pet.code ? 'active' : ''}`}
            key={pet.code}
            style={{ '--pet-card-accent': pet.accent } as CSSProperties}
          >
            <div className="petSpeciesTop">
              <div>
                <strong>{pet.name}</strong>
                <span>{pet.tone}</span>
              </div>
              <em>0{index + 1}</em>
            </div>

            <div className="petSpeciesStage">
              {renderPetIllustration(pet.code)}
            </div>

            <div className="petSpeciesBody">
              <h3>{pet.title}</h3>
              <p>{pet.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderPetIllustration(code: string) {
  switch (code) {
    case 'rabbit':
      return <RabbitIllustration />;
    case 'turtle':
      return <TurtleIllustration />;
    case 'fish':
      return <FishIllustration />;
    case 'pig':
      return <PigIllustration />;
    default:
      return <PenguinIllustration />;
  }
}

function RabbitIllustration() {
  return (
    <svg viewBox="0 0 180 160" className="petSpeciesSvg" aria-hidden="true">
      <ellipse cx="64" cy="34" rx="18" ry="36" fill="#fde68a" />
      <ellipse cx="116" cy="34" rx="18" ry="36" fill="#fde68a" />
      <ellipse cx="90" cy="90" rx="52" ry="48" fill="#fff7ed" />
      <circle cx="72" cy="80" r="6" fill="#1f2937" />
      <circle cx="108" cy="80" r="6" fill="#1f2937" />
      <path d="M86 94 C90 98, 90 98, 94 94" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="90" cy="104" rx="12" ry="10" fill="#fdba74" />
      <path d="M40 104 C50 120, 62 124, 76 120" stroke="#fb7185" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M140 104 C130 120, 118 124, 104 120" stroke="#fb7185" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function TurtleIllustration() {
  return (
    <svg viewBox="0 0 180 160" className="petSpeciesSvg" aria-hidden="true">
      <ellipse cx="90" cy="88" rx="56" ry="40" fill="#34d399" />
      <ellipse cx="90" cy="88" rx="38" ry="26" fill="#d1fae5" />
      <circle cx="138" cy="80" r="18" fill="#a7f3d0" />
      <circle cx="144" cy="76" r="4" fill="#1f2937" />
      <path d="M132 88 C138 92, 144 92, 150 88" stroke="#065f46" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="38" y="108" width="18" height="20" rx="8" fill="#34d399" />
      <rect x="74" y="112" width="18" height="18" rx="8" fill="#34d399" />
      <rect x="112" y="112" width="18" height="18" rx="8" fill="#34d399" />
      <rect x="44" y="62" width="18" height="16" rx="6" fill="#34d399" transform="rotate(-18 44 62)" />
    </svg>
  );
}

function FishIllustration() {
  return (
    <svg viewBox="0 0 180 160" className="petSpeciesSvg" aria-hidden="true">
      <ellipse cx="84" cy="84" rx="48" ry="30" fill="#38bdf8" />
      <path d="M128 62 L160 84 L128 106 Z" fill="#0ea5e9" />
      <circle cx="68" cy="78" r="5" fill="#0f172a" />
      <path d="M74 92 C82 98, 90 98, 98 92" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M52 60 C44 50, 42 40, 46 32" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M42 116 C34 108, 30 100, 30 92" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="44" cy="28" r="4" fill="#bae6fd" />
      <circle cx="34" cy="100" r="4" fill="#bae6fd" />
    </svg>
  );
}

function PenguinIllustration() {
  return (
    <svg viewBox="0 0 180 160" className="petSpeciesSvg" aria-hidden="true">
      <ellipse cx="90" cy="88" rx="50" ry="62" fill="#111827" />
      <ellipse cx="90" cy="96" rx="34" ry="44" fill="#f8fafc" />
      <circle cx="74" cy="72" r="6" fill="#f8fafc" />
      <circle cx="106" cy="72" r="6" fill="#f8fafc" />
      <path d="M82 88 C86 92, 94 92, 98 88" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M56 90 C42 76, 38 62, 42 50" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M124 90 C138 76, 142 62, 138 50" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" fill="none" />
      <rect x="58" y="124" width="22" height="12" rx="6" fill="#f59e0b" />
      <rect x="100" y="124" width="22" height="12" rx="6" fill="#f59e0b" />
    </svg>
  );
}

function PigIllustration() {
  return (
    <svg viewBox="0 0 180 160" className="petSpeciesSvg" aria-hidden="true">
      <circle cx="90" cy="84" r="48" fill="#f9a8d4" />
      <circle cx="68" cy="70" r="14" fill="#fbcfe8" />
      <circle cx="112" cy="70" r="14" fill="#fbcfe8" />
      <ellipse cx="90" cy="94" rx="24" ry="18" fill="#fbcfe8" />
      <circle cx="82" cy="92" r="4" fill="#ec4899" />
      <circle cx="98" cy="92" r="4" fill="#ec4899" />
      <circle cx="78" cy="78" r="5" fill="#1f2937" />
      <circle cx="102" cy="78" r="5" fill="#1f2937" />
      <path d="M74 118 C84 126, 96 126, 106 118" stroke="#be185d" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
