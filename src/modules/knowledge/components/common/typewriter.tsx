'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

/**
 * Prototipin `daktilo()` yardımcısı: Dasi'nin cevabı bir anda basılmak yerine
 * yazılıyormuş gibi açılır. Süre metnin uzunluğundan bağımsız sabit tutulur —
 * harf başına süre verilseydi uzun cevaplarda okumaya başlamak dakikalar alırdı.
 *
 * Hareket azaltma tercihi açıksa animasyon hiç çalışmaz, metin anında görünür.
 */
export function Typewriter({
  text,
  durationMs = 600,
  className
}: {
  text: string;
  durationMs?: number;
  className?: string;
}): React.JSX.Element {
  const [shown, setShown] = useState(() => text.length);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion || !text) {
      setShown(text.length);

      return;
    }

    setShown(0);
    const started = performance.now();
    let frame = 0;

    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - started) / durationMs);
      setShown(Math.round(progress * text.length));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [durationMs, text]);

  const isTyping = shown < text.length;

  return (
    <div
      className={[
        'whitespace-pre-wrap',
        isTyping
          ? "after:ml-0.5 after:inline-block after:h-[1.05em] after:w-0.5 after:animate-kb-caret after:bg-primary after:align-text-bottom after:content-['']"
          : '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {text.slice(0, shown)}
    </div>
  );
}
