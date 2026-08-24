'use client';

import * as React from 'react';

import Chip from '@mui/material/Chip';

import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { SealCheck as SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { useTranslation } from 'react-i18next';

/**
 * Durum rozeti — prototipin `rozet()` yardımcısının karşılığı.
 *
 * Prototipteki `yesil/mavi/amber/kirmizi/mor/notr` renk adları MUI paletine
 * eşlendi ve Tailwind üzerinden okunuyor; böylece koyu tema bedava geliyor ve
 * renkler uygulamanın geri kalanıyla aynı kaynaktan besleniyor.
 */

export type ChipTone = 'success' | 'info' | 'warning' | 'error' | 'purple' | 'neutral';

/** Yumuşak zemin + koyu metin: prototipin rozet görünümü, temaya duyarlı hâli. */
const TONE_CLASSES: Record<ChipTone, string> = {
  success: 'bg-success/15 text-success-strong dark:text-success-light',
  info: 'bg-info/15 text-info-strong dark:text-info-light',
  warning: 'bg-warning/15 text-warning-strong dark:text-warning-light',
  error: 'bg-error/15 text-error-strong dark:text-error-light',
  purple: 'bg-research-soft text-research',
  // Açık temada ikincil metin tonu kendi %10'luk zemininde 4.4:1'de kalıyordu.
  neutral: 'bg-fg-muted/10 text-[var(--mui-palette-neutral-600)] dark:text-fg-muted'
};

export interface SoftChipProps {
  label: string;
  tone: ChipTone;
  icon?: React.ReactElement;
  size?: 'small' | 'medium';
}

export function SoftChip({ label, tone, icon, size = 'small' }: SoftChipProps): React.JSX.Element {
  return (
    <Chip
      className={`rounded-md font-medium ${TONE_CLASSES[tone]}`}
      icon={icon}
      label={label}
      size={size}
    />
  );
}

/** Soru durumları — 03 §2 / V43. */
const QUESTION_STATUS_TONE: Record<string, ChipTone> = {
  otomatik_cevaplandi: 'info',
  cozuldu: 'success',
  eskale_edildi: 'warning'
};

export function StatusChip({ status }: { status: string }): React.JSX.Element | null {
  const { t } = useTranslation();
  const tone = QUESTION_STATUS_TONE[status];

  if (!tone) {
    return null;
  }

  return (
    <SoftChip
      icon={status === 'cozuldu' ? <CheckCircleIcon /> : undefined}
      label={t(`knowledge.status.${status}`)}
      tone={tone}
    />
  );
}

/** FR-5 / FR-7 — doğrulanmış (verified) işareti. */
export function VerifiedBadge({ verified }: { verified: boolean }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SoftChip
      icon={verified ? <SealCheckIcon /> : undefined}
      label={verified ? t('knowledge.dasi.answer.verified') : t('knowledge.dasi.answer.unverified')}
      tone={verified ? 'success' : 'neutral'}
    />
  );
}
