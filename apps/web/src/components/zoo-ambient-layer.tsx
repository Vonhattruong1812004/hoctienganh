'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { ZooAsset, ZooAssetsResponse } from '@english-learning/shared';
import { apiGet } from '../lib/api';

type ZooLayerItem = ZooAsset & {
  x: number;
  y: number;
  delay: number;
  path: 'top' | 'right' | 'bottom' | 'left' | 'water';
};

const fallbackZooAssets: ZooAsset[] = [
  {
    key: 'penguin',
    name: 'Pingu',
    englishWord: 'penguin',
    vietnameseName: 'chim cánh cụt',
    imageUrl: null,
    thumbnailUrl: null,
    source: 'CSS fallback',
    creator: null,
    license: null,
    sourceUrl: null,
    fallbackIcon: '🐧',
    color: '#22d3ee',
  },
  {
    key: 'rabbit',
    name: 'Bun Bun',
    englishWord: 'rabbit',
    vietnameseName: 'thỏ',
    imageUrl: null,
    thumbnailUrl: null,
    source: 'CSS fallback',
    creator: null,
    license: null,
    sourceUrl: null,
    fallbackIcon: '🐰',
    color: '#f9a8d4',
  },
  {
    key: 'turtle',
    name: 'Toto',
    englishWord: 'turtle',
    vietnameseName: 'rùa',
    imageUrl: null,
    thumbnailUrl: null,
    source: 'CSS fallback',
    creator: null,
    license: null,
    sourceUrl: null,
    fallbackIcon: '🐢',
    color: '#22c55e',
  },
  {
    key: 'pig',
    name: 'Pipo',
    englishWord: 'pig',
    vietnameseName: 'heo',
    imageUrl: null,
    thumbnailUrl: null,
    source: 'CSS fallback',
    creator: null,
    license: null,
    sourceUrl: null,
    fallbackIcon: '🐷',
    color: '#fb7185',
  },
  {
    key: 'fish',
    name: 'Bubbles',
    englishWord: 'fish',
    vietnameseName: 'cá',
    imageUrl: null,
    thumbnailUrl: null,
    source: 'CSS fallback',
    creator: null,
    license: null,
    sourceUrl: null,
    fallbackIcon: '🐠',
    color: '#38bdf8',
  },
  {
    key: 'fox',
    name: 'Foxy',
    englishWord: 'fox',
    vietnameseName: 'cáo',
    imageUrl: null,
    thumbnailUrl: null,
    source: 'CSS fallback',
    creator: null,
    license: null,
    sourceUrl: null,
    fallbackIcon: '🦊',
    color: '#f97316',
  },
];

const positions = [
  { x: 16, y: 4, delay: -0.2, path: 'top' as const },
  { x: 84, y: 4, delay: -1.8, path: 'top' as const },
  { x: 97, y: 30, delay: -3.1, path: 'right' as const },
  { x: 97, y: 72, delay: -4.5, path: 'right' as const },
  { x: 76, y: 96, delay: -5.2, path: 'bottom' as const },
  { x: 3, y: 34, delay: -2.6, path: 'left' as const },
  { x: 36, y: 96, delay: -2.4, path: 'water' as const },
  { x: 3, y: 74, delay: -6.2, path: 'left' as const },
];

const animalSpeechLines: Record<string, string> = {
  cat: 'Cat. I am a cute cat.',
  fish: 'Fish. I can swim in the water.',
  fox: 'Fox. I am a clever fox.',
  panda: 'Panda. I like bamboo.',
  penguin: 'Penguin. I am Pingu the penguin.',
  pig: 'Pig. I am a happy pig.',
  rabbit: 'Rabbit. I can hop very fast.',
  turtle: 'Turtle. Slow and steady wins the race.',
};

export function ZooAmbientLayer() {
  const [assets, setAssets] = useState<ZooAsset[]>(fallbackZooAssets);
  const [fleeingKey, setFleeingKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiGet<ZooAssetsResponse>('/integrations/zoo-assets?limit=8')
      .then((response) => {
        if (!active || !response.animals?.length) return;
        setAssets(response.animals);
      })
      .catch(() => {
        if (active) {
          setAssets(fallbackZooAssets);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const animals = useMemo<ZooLayerItem[]>(
    () =>
      assets.slice(0, positions.length).map((asset, index) => ({
        ...asset,
        ...positions[index % positions.length],
      })),
    [assets],
  );

  function speakAnimal(animal: ZooLayerItem) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const text = animalSpeechLines[animal.key] ?? `${animal.englishWord}. This is a ${animal.englishWord}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.86;
    utterance.pitch = 1.12;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function triggerFlee(animal: ZooLayerItem) {
    speakAnimal(animal);
    const key = animal.key;
    setFleeingKey(key);
    setActiveKey(key);
    window.setTimeout(() => setFleeingKey((current) => (current === key ? null : current)), 950);
  }

  return (
    <div className="zooAmbientLayer" aria-hidden="true">
      <div className="zooRails">
        <span className="zooRail zooRailTop" />
        <span className="zooRail zooRailRight" />
        <span className="zooRail zooRailBottom" />
        <span className="zooRail zooRailLeft" />
      </div>

      <div className="zooSky">
        <span className="zooSun" />
        <span className="zooCloud zooCloudOne" />
        <span className="zooCloud zooCloudTwo" />
        <span className="zooCloud zooCloudThree" />
      </div>

      <div className="zooWind">
        {Array.from({ length: 9 }, (_, index) => (
          <span className="zooLeaf" key={`leaf-${index}`} />
        ))}
      </div>

      <div className="zooWaves">
        <span />
        <span />
        <span />
      </div>

      {animals.map((animal, index) => {
        const style = {
          '--zoo-x': `${animal.x}%`,
          '--zoo-y': `${animal.y}%`,
          '--zoo-delay': `${animal.delay}s`,
          '--zoo-color': animal.color,
          appearance: 'none',
          background: 'transparent',
          border: 0,
          padding: 0,
        } as CSSProperties;

        return (
          <button
            aria-label={`${animal.englishWord} - ${animal.vietnameseName}`}
            className={`zooAnimal zooAnimal-${animal.path} ${activeKey === animal.key ? 'isAlert' : ''} ${
              fleeingKey === animal.key ? 'isFleeing' : ''
            }`}
            data-meaning={animal.vietnameseName}
            data-word={animal.englishWord}
            key={`${animal.key}-${index}`}
            onClick={() => triggerFlee(animal)}
            onPointerEnter={() => setActiveKey(animal.key)}
            onPointerLeave={() => setActiveKey((current) => (current === animal.key ? null : current))}
            style={style}
            title={`Click để nghe: ${animalSpeechLines[animal.key] ?? animal.englishWord}`}
            tabIndex={-1}
            type="button"
          >
            <span className="zooAura" />
            <span className="zooShadow" />
            <span className="zooDust zooDustOne" />
            <span className="zooDust zooDustTwo" />
            <ZooCreature kind={animal.key} />
            <span
              className="zooSpeech"
              data-meaning={animal.vietnameseName}
              data-word={animal.englishWord}
            />
          </button>
        );
      })}
    </div>
  );
}

function ZooCreature({ kind }: { kind: string }) {
  const creatureMap: Record<string, ReactNode> = {
    cat: <CatSvg />,
    fish: <FishSvg />,
    fox: <FoxSvg />,
    panda: <PandaSvg />,
    penguin: <PenguinSvg />,
    pig: <PigSvg />,
    rabbit: <RabbitSvg />,
    turtle: <TurtleSvg />,
  };

  return (
    <span className={`zooCreature zooCreature-${kind}`} aria-hidden="true">
      {creatureMap[kind] ?? <PenguinSvg />}
    </span>
  );
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle className="zooSvgEye" cx={x} cy={y} r="3.3" fill="#0f172a" />
      <circle cx={x - 1} cy={y - 1.1} r="1.05" fill="#ffffff" />
    </>
  );
}

function PenguinSvg() {
  return (
    <svg className="zooCreatureSvg" viewBox="0 0 96 84" role="img">
      <ellipse className="zooSvgShadow" cx="48" cy="76" rx="24" ry="5.8" fill="#0f172a" opacity=".16" />
      <path className="zooSvgWing zooSvgWingLeft" d="M25 36C9 43 13 61 28 58C34 50 33 41 25 36Z" fill="#111827" />
      <path className="zooSvgWing zooSvgWingRight" d="M71 36C87 43 83 61 68 58C62 50 63 41 71 36Z" fill="#111827" />
      <ellipse cx="48" cy="48" rx="23" ry="28" fill="#111827" />
      <ellipse cx="48" cy="54" rx="14.5" ry="19" fill="#f8fafc" />
      <circle cx="48" cy="27" r="19" fill="#111827" />
      <ellipse cx="39" cy="29" rx="8" ry="9.5" fill="#f8fafc" opacity=".96" />
      <ellipse cx="57" cy="29" rx="8" ry="9.5" fill="#f8fafc" opacity=".96" />
      <Eye x={41} y={27} />
      <Eye x={55} y={27} />
      <path d="M46 34L59 38L46 42Z" fill="#fb923c" />
      <ellipse className="zooSvgLeg zooSvgLegLeft" cx="39" cy="73" rx="8" ry="3.8" fill="#fb923c" />
      <ellipse className="zooSvgLeg zooSvgLegRight" cx="57" cy="73" rx="8" ry="3.8" fill="#fb923c" />
      <path d="M35 13C42 7 54 7 61 13" fill="none" stroke="#334155" strokeLinecap="round" strokeWidth="2.2" opacity=".28" />
    </svg>
  );
}

function RabbitSvg() {
  return (
    <svg className="zooCreatureSvg" viewBox="0 0 96 84" role="img">
      <ellipse className="zooSvgShadow" cx="48" cy="76" rx="25" ry="5.8" fill="#0f172a" opacity=".13" />
      <path className="zooSvgEar zooSvgEarLeft" d="M33 28C22 3 32-6 43 21Z" fill="#fff7ed" stroke="#f9a8d4" strokeWidth="2" />
      <path className="zooSvgEar zooSvgEarRight" d="M54 21C65-6 75 3 63 28Z" fill="#fff7ed" stroke="#f9a8d4" strokeWidth="2" />
      <path d="M35 25C29 9 34 5 40 23Z" fill="#f9a8d4" opacity=".78" />
      <path d="M58 23C64 5 69 9 61 25Z" fill="#f9a8d4" opacity=".78" />
      <ellipse cx="48" cy="51" rx="24" ry="22" fill="#fff7ed" stroke="#fde68a" strokeWidth="1.5" />
      <circle cx="48" cy="35" r="19" fill="#ffffff" stroke="#fed7aa" strokeWidth="1.4" />
      <Eye x={40} y={33} />
      <Eye x={56} y={33} />
      <circle className="zooSvgCheek" cx="34" cy="42" r="4.2" fill="#f9a8d4" opacity=".42" />
      <circle className="zooSvgCheek" cx="62" cy="42" r="4.2" fill="#f9a8d4" opacity=".42" />
      <path d="M48 38L53 41L48 44L43 41Z" fill="#fb7185" />
      <path d="M48 44C44 48 41 47 39 45M48 44C52 48 55 47 57 45" fill="none" stroke="#475569" strokeLinecap="round" strokeWidth="1.6" />
      <circle className="zooSvgTail" cx="70" cy="57" r="7.2" fill="#ffffff" stroke="#fed7aa" strokeWidth="1.2" />
      <ellipse className="zooSvgLeg zooSvgLegLeft" cx="39" cy="72" rx="7" ry="4" fill="#fde68a" />
      <ellipse className="zooSvgLeg zooSvgLegRight" cx="58" cy="72" rx="7" ry="4" fill="#fde68a" />
    </svg>
  );
}

function TurtleSvg() {
  return (
    <svg className="zooCreatureSvg zooCreatureWideSvg" viewBox="0 0 104 80" role="img">
      <ellipse className="zooSvgShadow" cx="50" cy="70" rx="29" ry="5.4" fill="#0f172a" opacity=".13" />
      <path className="zooSvgTail" d="M18 47L6 41L18 36Z" fill="#86efac" />
      <circle className="zooSvgLeg zooSvgLegLeft" cx="34" cy="61" r="6" fill="#14532d" />
      <circle className="zooSvgLeg zooSvgLegRight" cx="62" cy="61" r="6" fill="#14532d" />
      <circle cx="83" cy="43" r="12" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
      <Eye x={86} y={40} />
      <ellipse cx="49" cy="43" rx="32" ry="24" fill="#65a30d" stroke="#365314" strokeWidth="2" />
      <path d="M23 43C28 24 70 24 76 43C70 58 31 59 23 43Z" fill="#84cc16" />
      <path d="M49 22V63M28 36H70M32 53H66M37 27L27 43L38 62M61 27L72 43L61 62" fill="none" stroke="#365314" strokeLinecap="round" strokeWidth="2" opacity=".46" />
      <path d="M78 49C84 53 90 52 94 48" fill="none" stroke="#14532d" strokeLinecap="round" strokeWidth="1.6" opacity=".42" />
    </svg>
  );
}

function PigSvg() {
  return (
    <svg className="zooCreatureSvg" viewBox="0 0 96 84" role="img">
      <ellipse className="zooSvgShadow" cx="48" cy="76" rx="27" ry="5.7" fill="#0f172a" opacity=".13" />
      <path className="zooSvgEar zooSvgEarLeft" d="M29 27L18 13L37 17Z" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1.6" />
      <path className="zooSvgEar zooSvgEarRight" d="M67 27L78 13L59 17Z" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1.6" />
      <ellipse cx="48" cy="51" rx="27" ry="22" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1.6" />
      <circle cx="48" cy="34" r="21" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1.5" />
      <Eye x={39} y={31} />
      <Eye x={57} y={31} />
      <ellipse cx="48" cy="41" rx="11.5" ry="8" fill="#fb7185" stroke="#be185d" strokeWidth="1.1" opacity=".9" />
      <circle cx="44" cy="41" r="1.7" fill="#831843" />
      <circle cx="52" cy="41" r="1.7" fill="#831843" />
      <path className="zooSvgTail" d="M73 48C86 43 87 58 76 56C84 54 82 48 75 52" fill="none" stroke="#f472b6" strokeLinecap="round" strokeWidth="4" />
      <ellipse className="zooSvgLeg zooSvgLegLeft" cx="38" cy="72" rx="6.5" ry="4" fill="#fb7185" />
      <ellipse className="zooSvgLeg zooSvgLegRight" cx="58" cy="72" rx="6.5" ry="4" fill="#fb7185" />
    </svg>
  );
}

function FishSvg() {
  return (
    <svg className="zooCreatureSvg zooCreatureWideSvg" viewBox="0 0 104 74" role="img">
      <ellipse className="zooSvgShadow" cx="50" cy="64" rx="25" ry="4.8" fill="#0369a1" opacity=".12" />
      <circle className="zooSvgBubble zooSvgBubbleOne" cx="18" cy="19" r="3" fill="none" stroke="#bae6fd" strokeWidth="1.8" />
      <circle className="zooSvgBubble zooSvgBubbleTwo" cx="11" cy="31" r="2.2" fill="none" stroke="#bae6fd" strokeWidth="1.5" />
      <path className="zooSvgTail" d="M74 37L99 18L90 37L99 56Z" fill="#0ea5e9" />
      <ellipse cx="47" cy="37" rx="33" ry="22" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
      <path className="zooSvgFin" d="M46 21L59 6L61 29Z" fill="#0284c7" opacity=".88" />
      <path className="zooSvgFin" d="M48 51L61 66L60 44Z" fill="#0284c7" opacity=".88" />
      <path d="M20 33C32 23 52 21 71 35" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="4" opacity=".38" />
      <Eye x={31} y={32} />
      <path d="M24 43C28 47 33 47 37 43" fill="none" stroke="#075985" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M62 23C66 31 66 43 62 51" fill="none" stroke="#0369a1" strokeLinecap="round" strokeWidth="2" opacity=".34" />
    </svg>
  );
}

function FoxSvg() {
  return (
    <svg className="zooCreatureSvg" viewBox="0 0 96 84" role="img">
      <ellipse className="zooSvgShadow" cx="48" cy="76" rx="27" ry="5.8" fill="#0f172a" opacity=".14" />
      <path className="zooSvgTail" d="M66 51C88 35 92 61 73 64C66 62 61 57 66 51Z" fill="#f97316" />
      <path d="M78 57C88 52 88 63 76 64Z" fill="#fff7ed" />
      <ellipse cx="48" cy="55" rx="23" ry="18" fill="#f97316" />
      <path className="zooSvgEar zooSvgEarLeft" d="M30 24L34 5L46 24Z" fill="#f97316" stroke="#c2410c" strokeWidth="1.6" />
      <path className="zooSvgEar zooSvgEarRight" d="M66 24L62 5L50 24Z" fill="#f97316" stroke="#c2410c" strokeWidth="1.6" />
      <path d="M33 26C40 15 56 15 63 26C68 36 60 50 48 54C36 50 28 36 33 26Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
      <path d="M36 38L48 55L60 38C54 43 42 43 36 38Z" fill="#fff7ed" />
      <Eye x={41} y={33} />
      <Eye x={55} y={33} />
      <path d="M48 40L53 43L48 46L43 43Z" fill="#111827" />
      <path d="M39 21C44 18 52 18 57 21" fill="none" stroke="#fed7aa" strokeLinecap="round" strokeWidth="2" opacity=".42" />
      <ellipse className="zooSvgLeg zooSvgLegLeft" cx="39" cy="72" rx="6.8" ry="4" fill="#7c2d12" />
      <ellipse className="zooSvgLeg zooSvgLegRight" cx="58" cy="72" rx="6.8" ry="4" fill="#7c2d12" />
    </svg>
  );
}

function CatSvg() {
  return (
    <svg className="zooCreatureSvg" viewBox="0 0 96 84" role="img">
      <ellipse className="zooSvgShadow" cx="48" cy="76" rx="25" ry="5.6" fill="#0f172a" opacity=".14" />
      <path className="zooSvgTail" d="M70 54C87 55 84 35 72 42" fill="none" stroke="#facc15" strokeLinecap="round" strokeWidth="8" />
      <ellipse cx="48" cy="53" rx="24" ry="20" fill="#facc15" stroke="#d97706" strokeWidth="1.3" />
      <path className="zooSvgEar zooSvgEarLeft" d="M30 28L34 9L45 28Z" fill="#facc15" stroke="#d97706" strokeWidth="1.4" />
      <path className="zooSvgEar zooSvgEarRight" d="M66 28L62 9L51 28Z" fill="#facc15" stroke="#d97706" strokeWidth="1.4" />
      <circle cx="48" cy="34" r="20" fill="#fde68a" stroke="#d97706" strokeWidth="1.4" />
      <Eye x={40} y={32} />
      <Eye x={56} y={32} />
      <path d="M48 39L53 42L48 45L43 42Z" fill="#fb7185" />
      <path d="M23 38H39M22 45H39M57 38H73M57 45H74" stroke="#475569" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M34 19C42 16 54 16 62 19" stroke="#f97316" strokeLinecap="round" strokeWidth="2" opacity=".45" />
      <ellipse className="zooSvgLeg zooSvgLegLeft" cx="39" cy="72" rx="6.8" ry="4" fill="#d97706" />
      <ellipse className="zooSvgLeg zooSvgLegRight" cx="57" cy="72" rx="6.8" ry="4" fill="#d97706" />
    </svg>
  );
}

function PandaSvg() {
  return (
    <svg className="zooCreatureSvg" viewBox="0 0 96 84" role="img">
      <ellipse className="zooSvgShadow" cx="48" cy="76" rx="26" ry="5.8" fill="#0f172a" opacity=".14" />
      <circle className="zooSvgEar zooSvgEarLeft" cx="31" cy="20" r="10" fill="#111827" />
      <circle className="zooSvgEar zooSvgEarRight" cx="65" cy="20" r="10" fill="#111827" />
      <ellipse cx="48" cy="53" rx="25" ry="22" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.4" />
      <circle cx="48" cy="35" r="23" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.4" />
      <ellipse cx="39" cy="34" rx="8" ry="10" fill="#111827" transform="rotate(-18 39 34)" />
      <ellipse cx="57" cy="34" rx="8" ry="10" fill="#111827" transform="rotate(18 57 34)" />
      <Eye x={40} y={33} />
      <Eye x={56} y={33} />
      <ellipse cx="48" cy="43" rx="6" ry="4.3" fill="#111827" />
      <path d="M48 47C44 51 40 50 38 47M48 47C52 51 56 50 58 47" fill="none" stroke="#475569" strokeLinecap="round" strokeWidth="1.6" />
      <circle className="zooSvgCheek" cx="32" cy="44" r="4.3" fill="#f9a8d4" opacity=".35" />
      <circle className="zooSvgCheek" cx="64" cy="44" r="4.3" fill="#f9a8d4" opacity=".35" />
      <ellipse className="zooSvgLeg zooSvgLegLeft" cx="38" cy="72" rx="7" ry="4" fill="#111827" />
      <ellipse className="zooSvgLeg zooSvgLegRight" cx="58" cy="72" rx="7" ry="4" fill="#111827" />
    </svg>
  );
}
