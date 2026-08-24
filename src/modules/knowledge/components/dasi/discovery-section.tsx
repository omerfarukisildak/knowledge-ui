'use client';

import * as React from 'react';

import NextLink from 'next/link';

import Tooltip from '@mui/material/Tooltip';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Calculator as CalculatorIcon } from '@phosphor-icons/react/dist/ssr/Calculator';
import { CalendarBlank as CalendarBlankIcon } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Receipt as ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt';
import { Umbrella as UmbrellaIcon } from '@phosphor-icons/react/dist/ssr/Umbrella';
import { useTranslation } from 'react-i18next';

import { DISCOVER_LINKS } from 'src/modules/knowledge/constants';
import { isRouteMigrated } from 'src/modules/knowledge/navigation';
import type { ArticleListItem } from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

/**
 * Soru kutusunun altındaki keşif alanı: doğrulanmış KB cevaplarından dört kart
 * ve iki düz bağlantı.
 *
 * Karşılama ekranındaki hızlı aksiyon chip'leri V27'de tamamen kaldırıldı —
 * Dasi'nin kullanıcısı kafasında zaten spesifik bir soruyla geliyor, önerilen
 * sorunun isabet ihtimali düşük ama her ziyarette ödenen bir okuma maliyeti var.
 * Keşif işini bu kartlar zaten yapıyor.
 */

const CARD_ICONS = [CalculatorIcon, CalendarBlankIcon, ReceiptIcon, UmbrellaIcon];
/** Tam sınıf adları: Tailwind dinamik olarak kurulan adları göremez. */
const CARD_ICON_CLASSES = [
  'bg-info/15 text-info-strong dark:text-info-light',
  'bg-success/15 text-success-strong dark:text-success-light',
  'bg-research-soft text-research',
  'bg-warning/15 text-warning-strong dark:text-warning-light'
];

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function DiscoverySection({ articles }: { articles: ArticleListItem[] }): React.JSX.Element | null {
  const { t } = useTranslation();
  const articlesReady = isRouteMigrated(paths.knowledgeArticles);
  const cards = articles.filter(article => !article.company_id).slice(0, 4);

  if (!cards.length) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(215px,1fr))] md:gap-[18px]">
        {cards.map((article, index) => {
          const Icon = CARD_ICONS[index % CARD_ICONS.length];

          const card = (
            <div
              className={[
                'flex h-full flex-col gap-3.5 rounded-bubble border border-border bg-surface px-3.5 py-4 text-center transition md:px-5 md:py-[22px]',
                articlesReady ? 'hover:-translate-y-0.5 hover:shadow-lifted' : 'opacity-70'
              ].join(' ')}
            >
              <div
                className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${CARD_ICON_CLASSES[index % CARD_ICON_CLASSES.length]}`}
              >
                <Icon size={23} />
              </div>
              <p className="flex-1 text-[15px]">{truncate(article.title, 62)}</p>
              <span className="inline-flex items-center justify-center gap-2 text-sm text-primary dark:text-primary-light">
                {t('knowledge.dasi.suggestionsOpen')}
                <ArrowRightIcon />
              </span>
            </div>
          );

          if (!articlesReady) {
            return (
              <Tooltip
                key={article.id}
                title={t('knowledge.discover.notMigrated')}
              >
                <div>{card}</div>
              </Tooltip>
            );
          }

          return (
            <NextLink
              className="no-underline"
              href={`${paths.knowledgeArticles}?kayit=${encodeURIComponent(article.id)}`}
              key={article.id}
            >
              {card}
            </NextLink>
          );
        })}
      </div>

      <nav className="mt-[18px] flex flex-wrap gap-[18px] border-t border-border pt-3.5">
        {DISCOVER_LINKS.map(link => {
          const ready = isRouteMigrated(link.href);
          const content = (
            <span
              className={[
                'inline-flex items-center gap-2 text-[13.5px] text-fg-muted',
                ready ? 'hover:text-primary dark:hover:text-primary-light' : 'opacity-60'
              ].join(' ')}
            >
              {link.icon === 'bookOpen' ? <BookOpenIcon /> : <ReceiptIcon />}
              <span>{t(link.labelKey)}</span>
              <ArrowRightIcon size={14} />
            </span>
          );

          if (!ready) {
            return (
              <Tooltip
                key={link.key}
                title={t('knowledge.discover.notMigrated')}
              >
                <span>{content}</span>
              </Tooltip>
            );
          }

          return (
            <NextLink
              className="no-underline"
              href={link.href}
              key={link.key}
            >
              {content}
            </NextLink>
          );
        })}
      </nav>
    </div>
  );
}
