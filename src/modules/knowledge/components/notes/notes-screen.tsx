'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Note as NoteIcon } from '@phosphor-icons/react/dist/ssr/Note';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createNote, getCompanies, getNotes } from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { CompanyListItem, NoteListItem } from 'src/modules/knowledge/types';
import { formatDate, formatRelative } from 'src/modules/knowledge/utils/format-date';
import { paths } from 'src/paths';

import { NoteCreateDialog } from './note-create-dialog';

/**
 * Operasyon Notları — prototip karşılığı: `know-how.html` + `js/pages/know-how.js`.
 *
 * Ç2: FR-10 know-how'ı şirket sayfasının İÇİNDE tutar; bu ekran onun yerine
 * geçmez, tüm şirketleri kapsayan çapraz bir görünüm ekler.
 * Ç8: know-how tanımı gereği şirkete özeldir. Liste MT/OGY ataması olan
 * şirketlerle sınırlı (Bilgi Uzmanı ve Admin muaf) — kapı servis katmanında,
 * ekrandaki kapsam notu yalnızca listenin neden kısa olduğunu açıklar.
 */

/** Artımlı liste: prototipin `artimliListe` yardımcısı 20'lik adımlarla açıyordu. */
const PAGE_STEP = 20;

const GRID = 'grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,2.6fr)_auto] gap-4';

export function NotesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { hasRole, isFetched } = useKnowledgeRole();
  const { run } = useAsyncAction();

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [shown, setShown] = useState(PAGE_STEP);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const isExpertOrAdmin = hasRole('bilgi_uzmani', 'admin');

  const loadData = useCallback(async () => {
    const [noteList, companyList] = await Promise.all([getNotes(), getCompanies()]);

    setNotes(noteList);
    // Ç8: not yazılabilecek ve filtrelenebilecek şirketler erişim alanıyla sınırlı.
    setCompanies(companyList.filter(company => company.access !== false));
  }, []);

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Operasyon notları yüklenemedi.', error);
        toast.error(t('knowledge.notes.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isFetched, loadData, t]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');

    return notes.filter(
      note =>
        (!companyId || note.company_id === companyId) &&
        (!needle || note.text.toLocaleLowerCase('tr-TR').includes(needle))
    );
  }, [companyId, notes, search]);

  useEffect(() => {
    setShown(PAGE_STEP);
  }, [search, companyId]);

  const slice = filtered.slice(0, shown);

  const handleCreate = useCallback(
    async ({ companyId: targetId, text }: { companyId: string; text: string }) => {
      setBusy(true);
      const result = await run(() => createNote(targetId, { text }), {
        message: t('knowledge.notes.create.failed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      setCreateOpen(false);
      toast.success(t('knowledge.notes.create.done'));
      await loadData().catch(() => undefined);
    },
    [loadData, run, t]
  );

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-4 flex flex-wrap items-center gap-4 rounded-bubble border border-border bg-surface px-[17px] py-4 shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-primary/15 text-primary-strong dark:text-primary-light">
          <NoteIcon size={21} />
        </span>
        {/*
          `min-w-0 flex-1` tek başına dar ekranda metni ince bir şeride
          sıkıştırıp aksiyon grubunu yan satırda tutuyordu. Taban genişlik
          vermek, yer kalmadığında sarmayı zorluyor.
        */}
        <div className="min-w-[240px] flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            {t('knowledge.notes.kicker')}
          </span>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.notes.title')}</h1>
          <p className="mt-1 max-w-[70ch] text-[13.5px] text-fg-muted">{t('knowledge.notes.subtitle')}</p>
        </div>
        <div className="flex flex-1 items-center justify-between gap-4 sm:flex-none sm:justify-end">
          <span className="flex flex-col items-start sm:items-end">
            <strong className="text-[26px] leading-none tracking-[-0.03em]">{notes.length}</strong>
            <small className="text-[11.5px] text-fg-muted">{t('knowledge.notes.accessibleCount')}</small>
          </span>
          <Button
            className="normal-case"
            disabled={!companies.length}
            onClick={() => setCreateOpen(true)}
            startIcon={<PlusIcon />}
            variant="contained"
          >
            {t('knowledge.notes.newNote')}
          </Button>
        </div>
      </header>

      {/* Kapsam notu: listenin neden bu uzunlukta olduğunu role göre söyler. */}
      <div className="mb-5 flex gap-2.5 rounded-bubble border border-border bg-surface-1 px-4 py-3">
        <span className="mt-0.5 shrink-0 text-fg-muted">
          <ShieldCheckIcon size={15} />
        </span>
        <p className="text-[13px] leading-relaxed text-fg-muted">
          {isExpertOrAdmin ? t('knowledge.notes.scopeExpert') : t('knowledge.notes.scopeOperations')}
        </p>
      </div>

      <section className="rounded-bubble border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <kbd className="rounded border border-border px-1.5 py-0.5 text-[11px] text-fg-muted">⌘K</kbd>
                </InputAdornment>
              )
            }}
            className="min-w-[220px] flex-1"
            inputRef={searchRef}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('knowledge.notes.search')}
            size="small"
            type="search"
            value={search}
          />
          <TextField
            className="min-w-[190px]"
            label={t('knowledge.notes.columns.company')}
            onChange={event => setCompanyId(event.target.value)}
            select
            size="small"
            value={companyId}
          >
            <MenuItem value="">
              {isExpertOrAdmin ? t('knowledge.notes.allCompanies') : t('knowledge.notes.myCompanies')}
            </MenuItem>
            {companies.map(company => (
              <MenuItem
                key={company.id}
                value={company.id}
              >
                {company.name}
              </MenuItem>
            ))}
          </TextField>
          <span className="text-[13px] text-fg-muted">
            {t('knowledge.notes.filterSummary', { shown: filtered.length, total: notes.length })}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map(index => (
              <Skeleton
                height={64}
                key={index}
                variant="rounded"
              />
            ))}
          </div>
        ) : slice.length === 0 ? (
          <div className="p-4">
            <EmptyState
              description={
                isExpertOrAdmin
                  ? t('knowledge.notes.emptyExpertDescription')
                  : t('knowledge.notes.emptyOperationsDescription')
              }
              title={t('knowledge.notes.emptyTitle')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[820px]">
                <div
                  className={`${GRID} border-b border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-fg-muted`}
                  role="row"
                >
                  <span>{t('knowledge.notes.columns.author')}</span>
                  <span>{t('knowledge.notes.columns.company')}</span>
                  <span>{t('knowledge.notes.columns.note')}</span>
                  <span />
                </div>

                {slice.map(note => (
                  <div
                    className={`${GRID} items-start border-b border-border px-4 py-3`}
                    key={note.id}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <UserAvatar
                        name={note.author?.name}
                        size={28}
                      />
                      <span className="flex min-w-0 flex-col leading-tight">
                        <strong className="truncate text-[13px]">{note.author?.name ?? '—'}</strong>
                        <small className="truncate text-[11px] text-fg-muted">
                          {note.author ? t(`knowledge.questions.titles.${note.author.role}`) : ''}
                        </small>
                      </span>
                    </span>

                    <span className="flex min-w-0 flex-col leading-tight">
                      <strong className="truncate text-[13px]">
                        {note.company?.name ?? t('knowledge.notes.companyMissing')}
                      </strong>
                      <small className="inline-flex items-center gap-1 text-[11px] text-fg-muted">
                        <LockIcon size={11} />
                        {t('knowledge.notes.companyScoped')}
                      </small>
                    </span>

                    <span className="flex min-w-0 flex-col gap-1">
                      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{note.text}</p>
                      {note.date ? (
                        <time
                          className="inline-flex items-center gap-1 text-[11.5px] text-fg-muted"
                          title={formatDate(note.date)}
                        >
                          <ClockIcon size={11} />
                          {formatRelative(note.date)}
                        </time>
                      ) : null}
                    </span>

                    <span className="flex items-center justify-end">
                      {/* Şirket detay sayfası henüz taşınmadı. */}
                      {note.company ? (
                        <MigrationLink href={paths.knowledgeCompany(note.company.id)}>
                          {ready => (
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-md ${
                                ready ? 'text-primary hover:bg-primary/10' : 'text-fg-subtle'
                              }`}
                            >
                              <ArrowRightIcon size={16} />
                            </span>
                          )}
                        </MigrationLink>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] text-fg-muted">
                {t('knowledge.notes.rangeSummary', { shown: slice.length, total: filtered.length })}
              </span>
              {slice.length < filtered.length ? (
                <Button
                  className="normal-case"
                  onClick={() => setShown(current => current + PAGE_STEP)}
                  variant="outlined"
                >
                  {t('knowledge.notes.loadMore')}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </section>

      <NoteCreateDialog
        busy={busy}
        companies={companies}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        open={createOpen}
      />
    </div>
  );
}
