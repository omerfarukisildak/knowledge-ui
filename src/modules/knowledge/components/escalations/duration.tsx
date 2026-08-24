'use client';

import * as React from 'react';

import { useTranslation } from 'react-i18next';

import { type SlaLevel, durationParts } from './sla';

/**
 * Süre gösterimi ve SLA tonları — kart, pano ve modal aynı dili konuşsun diye
 * tek yerde. Renkler yalnızca DURUM ve öncelik vurgusudur; sıralamayı süre
 * belirler, renk değil.
 */

/** Tam sınıf adları: Tailwind çalışma anında kurulan adları göremez. */
export const SLA_TONE: Record<SlaLevel, { text: string; soft: string; bar: string; card: string }> = {
  critical: {
    text: 'text-error-strong dark:text-error-light',
    soft: 'bg-error/15 text-error-strong dark:text-error-light',
    bar: 'bg-error',
    card: 'border-error/40'
  },
  warning: {
    text: 'text-warning-strong dark:text-warning-light',
    soft: 'bg-warning/15 text-warning-strong dark:text-warning-light',
    bar: 'bg-warning',
    card: 'border-warning/40'
  },
  normal: {
    text: 'text-success-strong dark:text-success-light',
    soft: 'bg-success/15 text-success-strong dark:text-success-light',
    bar: 'bg-success',
    card: 'border-border'
  }
};

/** "2 gün 3 saat" — ekran okuyucu ve `title` için düz metin. */
export function useDurationText(): (hours: number) => string {
  const { t } = useTranslation();

  return (hours: number) =>
    durationParts(hours)
      .map(part => `${part.value} ${t(part.unitKey)}`)
      .join(' ');
}

/** Rakam iri, birim küçük: nöbet ekranında süre bir ölçü aleti gibi okunmalı. */
export function Duration({ hours, className }: { hours: number; className?: string }): React.JSX.Element {
  const { t } = useTranslation();
  const parts = durationParts(hours);

  return (
    <span className={`inline-flex items-baseline gap-1 ${className ?? ''}`}>
      {parts.map((part, index) => (
        <React.Fragment key={part.unitKey}>
          {index ? <i className="not-italic text-fg-subtle">·</i> : null}
          <span className="inline-flex items-baseline gap-0.5">
            <b className="font-semibold">{part.value}</b>
            <small className="text-[0.72em] font-medium text-fg-muted">{t(part.unitKey)}</small>
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}
