'use client';

import * as React from 'react';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { useTranslation } from 'react-i18next';

import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';
import { SoftChip } from 'src/modules/knowledge/components/common/status-chip';
import type { BulletinListItem } from 'src/modules/knowledge/types';
import { formatDate } from 'src/modules/knowledge/utils/format-date';
import { paths } from 'src/paths';

import { OverviewCard } from './overview-card';

/**
 * Bülten kartı — prototipin `.ds-pano-bulten` bloğu.
 *
 * Satır başlığı, sayının atıf verdiği ilk mevzuat içeriğinden gelir; içerik
 * yoksa sayının özeti kullanılır (prototipin `bultenSatiri` davranışı).
 */

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function BulletinCard({
  bulletins,
  newCount
}: {
  bulletins: BulletinListItem[];
  /** En yeni sayıdaki kayıt sayısı — "N yeni" rozeti. */
  newCount: number;
}): React.JSX.Element {
  const { t } = useTranslation();
  const rows = bulletins.slice(0, 5);

  return (
    <OverviewCard
      action={
        <SoftChip
          label={t('knowledge.home.bulletinNew', { count: newCount })}
          tone="success"
        />
      }
      divider={false}
      kicker={t('knowledge.home.kicker.legislation')}
      title={t('knowledge.home.bulletinTitle')}
    >
      {rows.length ? (
        <div className="px-2.5">
          {rows.map(entry => {
            const content = entry.contents[0];
            const title = content?.title || entry.summary;
            const source = content?.source?.name || t('knowledge.home.bulletinFallbackSource');

            return (
              <MigrationLink
                href={paths.knowledgeBulletin}
                key={entry.id}
              >
                {ready => (
                  <div
                    className={`grid min-h-[76px] grid-cols-[54px_minmax(0,1fr)] gap-x-[11px] border-t border-border px-[7px] py-2.5 first:border-t-0 ${
                      ready ? 'rounded-[10px] hover:bg-primary/5' : 'opacity-70'
                    }`}
                  >
                    <span className="row-span-2 grid h-[54px] w-[54px] place-items-center overflow-hidden rounded-[10px] bg-fg-muted/10 text-fg-muted">
                      {entry.cover_image_url ? (
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={entry.cover_image_url}
                        />
                      ) : (
                        <BookOpenIcon size={20} />
                      )}
                    </span>

                    <span className="min-w-0 self-end">
                      <strong className="block text-[12.5px] font-semibold leading-[1.3]">{truncate(title, 66)}</strong>
                      <small className="mt-0.5 block truncate text-[10.5px] text-fg-muted">{source}</small>
                    </span>

                    <span className="self-start text-[10px] text-fg-muted">{formatDate(entry.date)}</span>
                  </div>
                )}
              </MigrationLink>
            );
          })}
        </div>
      ) : (
        <p className="px-[17px] py-8 text-center text-sm text-fg-muted">{t('knowledge.home.bulletinEmpty')}</p>
      )}

      <MigrationLink
        className="block"
        href={paths.knowledgeBulletin}
      >
        {ready => (
          <span
            className={`m-2.5 flex h-[38px] items-center justify-center gap-[7px] rounded-[10px] border border-border text-xs font-medium text-fg-muted ${
              ready ? 'hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light' : 'opacity-60'
            }`}
          >
            {t('knowledge.home.bulletinAll')}
            <ArrowRightIcon size={14} />
          </span>
        )}
      </MigrationLink>
    </OverviewCard>
  );
}
