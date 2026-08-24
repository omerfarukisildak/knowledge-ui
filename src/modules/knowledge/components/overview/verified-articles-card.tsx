'use client';

import * as React from 'react';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { SealCheck as SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { useTranslation } from 'react-i18next';

import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';
import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import type { ArticleListItem, Tag } from 'src/modules/knowledge/types';
import { formatDate } from 'src/modules/knowledge/utils/format-date';
import { paths } from 'src/paths';

import { OverviewCard } from './overview-card';

/**
 * "Son doğrulanan bilgiler" kartı — prototipin `.ds-pano-bilgi` listesi.
 *
 * Prototipten sapma: satırlar `verified` süzgecinden geçiyor. Prototip tüm KB
 * kayıtlarını listeleyip her satıra doğrulama tiki basıyordu; kartın adı
 * "doğrulanan bilgiler" olduğu için doğrulanmamış bir kayda tik basmak
 * kullanıcıya yanlış bilgi vermek olur.
 */

/** Kolon ızgarası tek yerde: başlık satırı ile kayıt satırları aynı şeyi okur. */
const GRID =
  'grid grid-cols-[30px_minmax(0,1fr)_18px] items-center gap-3 md:grid-cols-[30px_minmax(0,1fr)_180px_18px] xl:grid-cols-[30px_minmax(0,1fr)_180px_92px_18px]';

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function VerifiedArticlesCard({
  articles,
  tags
}: {
  articles: ArticleListItem[];
  tags: Tag[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const rows = articles.filter(article => article.verified).slice(0, 6);

  return (
    <OverviewCard
      action={
        <MigrationLink href={paths.knowledgeArticles}>
          {ready => (
            <span
              className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-fg-muted ${
                ready ? 'hover:text-primary dark:hover:text-primary-light' : 'opacity-60'
              }`}
            >
              {t('knowledge.home.seeAll')}
              <ArrowRightIcon size={14} />
            </span>
          )}
        </MigrationLink>
      }
      kicker={t('knowledge.home.kicker.knowledgeBase')}
      title={t('knowledge.home.articlesTitle')}
    >
      {rows.length ? (
        <>
          <div
            className={`${GRID} hidden border-b border-border py-2.5 pl-[61px] pr-[17px] text-[10.5px] font-semibold text-fg-muted xl:grid`}
          >
            <span className="col-start-2">{t('knowledge.home.columns.article')}</span>
            <span>{t('knowledge.home.columns.tags')}</span>
            <span>{t('knowledge.home.columns.updated')}</span>
          </div>

          <div>
            {rows.map(article => (
              <MigrationLink
                href={`${paths.knowledgeArticles}?kayit=${encodeURIComponent(article.id)}`}
                key={article.id}
              >
                {ready => (
                  <div
                    className={`${GRID} min-h-[65px] border-b border-border px-[17px] py-2.5 last:border-b-0 ${
                      ready ? 'hover:bg-primary/5' : 'opacity-70'
                    }`}
                  >
                    <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-success/15 text-success-strong dark:text-success-light">
                      <SealCheckIcon size={15} />
                    </span>

                    <span className="min-w-0">
                      <strong
                        className="block truncate text-[12.5px] font-semibold"
                        title={article.title}
                      >
                        {truncate(article.title, 82)}
                      </strong>
                      <small className="mt-0.5 block truncate text-[10.5px] text-fg-muted">
                        {truncate(article.content, 105)}
                      </small>
                    </span>

                    <span className="hidden min-w-0 overflow-hidden md:flex">
                      <TagChips
                        max={2}
                        pool={tags}
                        tags={article.tags}
                      />
                    </span>

                    <span className="hidden whitespace-nowrap text-[10.5px] text-fg-muted xl:block">
                      {formatDate(article.updated_at || article.date)}
                    </span>

                    <ArrowRightIcon
                      className="text-fg-muted"
                      size={14}
                    />
                  </div>
                )}
              </MigrationLink>
            ))}
          </div>
        </>
      ) : (
        <p className="px-[17px] py-8 text-center text-sm text-fg-muted">{t('knowledge.home.articlesEmpty')}</p>
      )}
    </OverviewCard>
  );
}
