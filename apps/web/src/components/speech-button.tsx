'use client';

import { Volume2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { resolveApiAssetUrl } from '../lib/api';

type SpeechButtonProps = {
  text: string;
  audioUrl?: string | null;
  label?: string;
  className?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
};

function speakText(text: string, lang: string, rate: number, pitch: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve(false);

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;

  return new Promise<boolean>((resolve) => {
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.speak(utterance);
  });
}

export function SpeechButton({
  text,
  audioUrl,
  label = 'Nghe',
  className = 'secondaryButton',
  lang = 'en-US',
  rate = 0.88,
  pitch = 1.02,
}: SpeechButtonProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlay() {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setPlaying(true);

    const resolvedAudioUrl = resolveApiAssetUrl(audioUrl);

    if (resolvedAudioUrl) {
      try {
        audioRef.current?.pause();
        audioRef.current = null;
        const audio = new Audio(resolvedAudioUrl);
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;
        audio.onended = () => {
          setPlaying(false);
        };
        audio.onerror = async () => {
          await speakText(trimmedText, lang, rate, pitch);
          setPlaying(false);
        };
        await audio.play();
        return;
      } catch {
        await speakText(trimmedText, lang, rate, pitch);
        setPlaying(false);
        return;
      }
    }

    const spoken = await speakText(trimmedText, lang, rate, pitch);
    if (!spoken) {
      setPlaying(false);
      return;
    }

    setPlaying(false);
  }

  return (
    <button className={className} type="button" onClick={handlePlay} disabled={playing} aria-live="polite">
      <Volume2 size={16} />
      {playing ? 'Đang phát...' : label}
    </button>
  );
}
