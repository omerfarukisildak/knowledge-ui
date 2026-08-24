'use client';

import * as React from 'react';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Question as QuestionIcon } from '@phosphor-icons/react/dist/ssr/Question';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { useTranslation } from 'react-i18next';

import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';

import { OverviewCard } from './overview-card';

/** "Seni bekleyenler" kartı — prototipin `.ds-pano-bekleyen` satırları. */

export type PendingIcon = 'tray' | 'bell' | 'question' | 'bookOpen';
export type PendingTone = 'info' | 'warning' | 'success';

export interface PendingItem {
  key: string;
  icon: PendingIcon;
  tone: PendingTone;
  value: number;
  /** i18n anahtarı — `knowledge.home.pending.*` */
  labelKey: string;
  href: string;
}

const ICONS: Record<PendingIcon, React.ElementType> = {
  tray: TrayIcon,
  bell: BellIcon,
  question: QuestionIcon,
  bookOpen: BookOpenIcon
};

/** Tam sınıf adları — dinamik kurulan adları Tailwind göremez. */
const TONES: Record<PendingTone, string> = {
  info: 'bg-info/15 text-info-strong dark:text-info-light',
  warning: 'bg-warning/15 text-warning-strong dark:text-warning-light',
  success: 'bg-success/15 text-success-strong dark:text-success-light'
};

export function PendingCard({ items }: { items: PendingItem[] }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <OverviewCard
      kicker={t('knowledge.home.kicker.workflow')}
      title={t('knowledge.home.pendingTitle')}
    >
      <div className="px-3 pb-2">
        {items.map(item => {
          const Icon = ICONS[item.icon];

          return (
            <MigrationLink
              className="block"
              href={item.href}
              key={item.key}
            >
              {ready => (
                <div
                  className={`flex min-h-[48px] items-center gap-[9px] border-t border-border px-[3px] py-[7px] first:border-t-0 ${
                    ready ? 'hover:text-primary dark:hover:text-primary-light' : 'opacity-70'
                  }`}
                >
                  <span className={`grid h-[30px] w-[30px] place-items-center rounded-[9px] ${TONES[item.tone]}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1 text-[12.5px]">{t(item.labelKey)}</span>
                  <strong className="text-[12.5px]">{item.value}</strong>
                  <ArrowRightIcon
                    className="text-fg-muted"
                    size={13}
                  />
                </div>
              )}
            </MigrationLink>
          );
        })}
      </div>
    </OverviewCard>
  );
}
