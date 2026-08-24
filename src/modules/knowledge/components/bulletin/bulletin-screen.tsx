'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { CalendarBlank as CalendarBlankIcon } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Envelope as EnvelopeIcon } from '@phosphor-icons/react/dist/ssr/Envelope';
import { LinkSimple as LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getBulletins } from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';
import { type ChipTone, SoftChip } from 'src/modules/knowledge/components/common/status-chip';
import { KNOWLEDGE_APP } from 'src/modules/knowledge/constants';
import type {
  BulletinListItem,
  LegislationContentWithSource,
  LegislationSourceKind
} from 'src/modules/knowledge/types';
import { formatDate } from 'src/modules/knowledge/utils/format-date';
import { paths } from 'src/paths';

/**
 * Haftalık Mevzuat Bülteni (FR-15) — prototip karşılığı: `bulten.html`.
 *
 * V29: bülten GÜNLÜK değil HAFTALIK — her Pazartesi bir sayı yayımlanır, bu
 * yüzden kayıtlar gün değil HAFTALIK SAYI olarak gruplanır.
 * 07 §3: gazete/akış formatı, en yeni üstte, her kayıt kapak görselli bir blog
 * yazısı gibi, kaynağa tıklanabilir referansla.
 * PRD §4.7: bülten onay kademesinden geçmez — haber niteliğindedir.
 */

/** Kaynak türü rozeti: resmî mevzuat en yetkili, özel kaynak yalnızca destek. */
const SOURCE_TONE: Record<LegislationSourceKind, ChipTone> = {
  resmi: 'success',
  kurum_duyurusu: 'info',
  ictihat: 'warning',
  ozel_kaynak: 'neutral'
};

/**
 * Kaydın manşetini ve kapağını en YETKİLİ kaynak belirler (öncelik 1 = resmî).
 * Bülten kaydının kendi başlığı yok; `summary` giriş paragrafı olarak kullanılır.
 */
function primaryContent(entry: BulletinListItem): LegislationContentWithSource | null {
  return [...(entry.contents ?? [])].sort((a, b) => (a.source?.priority ?? 9) - (b.source?.priority ?? 9))[0] ?? null;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

function BulletinCard({ entry }: { entry: BulletinListItem }): React.JSX.Element {
  const { t } = useTranslation();
  const primary = primaryContent(entry);
  const cover = entry.cover_image_url ?? primary?.image_url ?? null;

  return (
    <MigrationLink
      className="block h-full min-w-0"
      href={paths.knowledgeBulletinEntry(entry.id)}
    >
      {ready => (
        <article
          className={`flex h-full flex-col overflow-hidden rounded-bubble border border-border bg-surface shadow-card transition ${
            ready ? 'hover:-translate-y-0.5 hover:shadow-lifted' : ''
          }`}
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2">
            {cover ? (
              <img
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                src={cover}
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-fg-subtle">
                <EnvelopeIcon size={26} />
              </span>
            )}
            {primary?.source ? (
              <span className="absolute left-2.5 top-2.5">
                <SoftChip
                  label={primary.source.name}
                  tone={SOURCE_TONE[primary.source.kind] ?? 'neutral'}
                />
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-2 px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-muted">
              <ClockIcon size={12} />
              <span>{formatDate(entry.date)}</span>
              {entry.send_time ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{entry.send_time}</span>
                </>
              ) : null}
            </div>

            <p className="text-[14px] font-medium leading-snug">{entry.summary}</p>

            {(entry.contents ?? []).length ? (
              <div className="flex flex-col gap-1">
                {(entry.contents ?? []).slice(0, 2).map(content => (
                  <span
                    className="inline-flex min-w-0 items-start gap-1.5 text-[12px] text-fg-muted"
                    key={content.id}
                  >
                    <LinkSimpleIcon
                      className="mt-0.5 shrink-0"
                      size={12}
                    />
                    <span className="min-w-0">{truncate(content.title, 78)}</span>
                  </span>
                ))}
              </div>
            ) : null}

            <span
              className={`mt-auto inline-flex items-center gap-1 pt-1 text-[12.5px] font-medium ${
                ready ? 'text-primary-strong dark:text-primary-light' : 'text-fg-subtle'
              }`}
            >
              {t('knowledge.bulletin.openEntry')}
              <ArrowRightIcon size={13} />
            </span>
          </div>
        </article>
      )}
    </MigrationLink>
  );
}

export function BulletinScreen(): React.JSX.Element {
  const { t } = useTranslation();

  const [entries, setEntries] = useState<BulletinListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [week, setWeek] = useState('');

  const loadData = useCallback(async () => {
    setEntries(await getBulletins());
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Bülten yüklenemedi.', error);
        toast.error(t('knowledge.bulletin.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadData, t]);

  /** Sayı tarihleri, en yeni önce. Hafta filtresi ve grup başlıkları buradan. */
  const weeks = useMemo(() => [...new Set(entries.map(entry => entry.date))].sort().reverse(), [entries]);
  const latestWeek = weeks[0] ?? null;

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');

    return entries.filter(
      entry =>
        (!week || entry.date === week) &&
        (!needle ||
          `${entry.summary} ${(entry.contents ?? []).map(content => content.title).join(' ')}`
            .toLocaleLowerCase('tr-TR')
            .includes(needle))
    );
  }, [entries, search, week]);

  const shownWeeks = useMemo(() => [...new Set(filtered.map(entry => entry.date))].sort().reverse(), [filtered]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.bulletin.title')}</h1>
        <p className="mt-1 max-w-[80ch] text-[13.5px] text-fg-muted">
          {t('knowledge.bulletin.subtitle', { day: t('knowledge.bulletin.day'), hour: KNOWLEDGE_APP.bulletinHour })}
        </p>
      </header>

      {/* 11 §2 — prototipte kayıtlar sabit; gerçek zamanlanmış tarama Faz 2'de. */}
      <Alert
        className="mb-5"
        severity="info"
      >
        {t('knowledge.bulletin.mockNotice', { day: t('knowledge.bulletin.day') })}
      </Alert>

      <section className="mb-5 flex flex-wrap items-center gap-2.5 rounded-bubble border border-border bg-surface px-4 py-3">
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlassIcon />
              </InputAdornment>
            )
          }}
          className="min-w-[220px] flex-1"
          onChange={event => setSearch(event.target.value)}
          placeholder={t('knowledge.bulletin.search')}
          size="small"
          type="search"
          value={search}
        />
        <TextField
          className="min-w-[220px]"
          label={t('knowledge.bulletin.weekLabel')}
          onChange={event => setWeek(event.target.value)}
          select
          size="small"
          value={week}
        >
          <MenuItem value="">{t('knowledge.bulletin.allWeeks')}</MenuItem>
          {weeks.map(date => (
            <MenuItem
              key={date}
              value={date}
            >
              {t('knowledge.bulletin.issueLabel', { date: formatDate(date), day: t('knowledge.bulletin.day') })}
            </MenuItem>
          ))}
        </TextField>
        <span className="text-[13px] text-fg-muted">
          {t('knowledge.bulletin.filterSummary', { shown: filtered.length, total: entries.length })}
        </span>
      </section>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(index => (
            <Skeleton
              height={280}
              key={index}
              variant="rounded"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          description={t('knowledge.bulletin.emptyDescription')}
          title={t('knowledge.bulletin.emptyTitle')}
        />
      ) : (
        <div className="flex flex-col gap-7">
          {shownWeeks.map(date => {
            const issueEntries = filtered.filter(entry => entry.date === date);

            return (
              <section key={date}>
                <div className="mb-3 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold">
                    <CalendarBlankIcon size={15} />
                    {t('knowledge.bulletin.issueLabel', {
                      date: formatDate(date),
                      day: t('knowledge.bulletin.day')
                    })}
                  </span>
                  {date === latestWeek ? (
                    <SoftChip
                      label={t('knowledge.bulletin.thisWeek')}
                      tone="success"
                    />
                  ) : null}
                  <SoftChip
                    label={t('knowledge.bulletin.entryCount', { count: issueEntries.length })}
                    tone="neutral"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {issueEntries.map(entry => (
                    <BulletinCard
                      entry={entry}
                      key={entry.id}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
