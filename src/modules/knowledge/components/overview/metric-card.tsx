'use client';

import * as React from 'react';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Envelope as EnvelopeIcon } from '@phosphor-icons/react/dist/ssr/Envelope';
import { Question as QuestionIcon } from '@phosphor-icons/react/dist/ssr/Question';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { useTranslation } from 'react-i18next';

import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';

/**
 * Panonun dört metrik kartı — prototipin `.ds-pano-metrik` bloğu.
 *
 * Prototipin renk adları (mavi/mor/yeşil/turuncu) semantik tonlara eşlendi;
 * değerler MUI paletinden okunduğu için koyu tema kendiliğinden geliyor.
 */

export type MetricIcon = 'envelope' | 'tray' | 'bookOpen' | 'question';
export type MetricTone = 'info' | 'purple' | 'success' | 'warning';

export interface OverviewMetric {
  key: string;
  icon: MetricIcon;
  tone: MetricTone;
  value: number;
  /** i18n anahtarları — `knowledge.home.metric.*` */
  nameKey: string;
  hintKey: string;
  href: string;
}

const ICONS: Record<MetricIcon, React.ElementType> = {
  envelope: EnvelopeIcon,
  tray: TrayIcon,
  bookOpen: BookOpenIcon,
  question: QuestionIcon
};

/**
 * Tam sınıf adları: Tailwind çalışma anında kurulan `from-${tone}/10` gibi
 * adları göremez ve o stilleri hiç üretmez.
 */
const TONES: Record<MetricTone, { surface: string; accent: string; icon: string; arrow: string }> = {
  info: {
    surface: 'from-info/10',
    accent: 'bg-info/70',
    icon: 'bg-info/15 text-info-strong dark:text-info-light',
    arrow: 'text-info'
  },
  purple: {
    surface: 'from-research-soft',
    accent: 'bg-research',
    icon: 'bg-research-soft text-research',
    arrow: 'text-research'
  },
  success: {
    surface: 'from-success/10',
    accent: 'bg-success/70',
    icon: 'bg-success/15 text-success-strong dark:text-success-light',
    arrow: 'text-success'
  },
  warning: {
    surface: 'from-warning/10',
    accent: 'bg-warning/70',
    icon: 'bg-warning/15 text-warning-strong dark:text-warning-light',
    arrow: 'text-warning'
  }
};

export function MetricCard({ metric }: { metric: OverviewMetric }): React.JSX.Element {
  const { t } = useTranslation();
  const Icon = ICONS[metric.icon];
  const tone = TONES[metric.tone];

  return (
    <MigrationLink
      className="block min-w-0"
      href={metric.href}
    >
      {ready => (
        <div
          className={[
            'relative grid min-h-[104px] grid-cols-[38px_minmax(0,1fr)_15px] items-start gap-3 overflow-hidden',
            'rounded-[13px] border border-border bg-gradient-to-br via-surface to-surface p-[15px] transition',
            tone.surface,
            ready ? 'hover:-translate-y-0.5 hover:shadow-lifted' : 'opacity-70'
          ].join(' ')}
        >
          <span className={`absolute inset-y-0 left-0 w-[3px] ${tone.accent}`} />

          <span className={`grid h-[38px] w-[38px] place-items-center rounded-[11px] ${tone.icon}`}>
            <Icon size={18} />
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="text-[12.5px] font-semibold text-fg-muted">{t(metric.nameKey)}</span>
            <span className="mt-1.5 flex min-w-0 items-end">
              <strong className="text-[30px] leading-[0.95] tracking-[-0.04em]">{metric.value}</strong>
              <small className="mb-px ml-2 min-w-0 text-[11.5px] leading-[1.25] text-fg-muted">
                {t(metric.hintKey)}
              </small>
            </span>
          </span>

          <ArrowRightIcon
            className={`mt-0.5 opacity-65 ${tone.arrow}`}
            size={14}
          />
        </div>
      )}
    </MigrationLink>
  );
}
