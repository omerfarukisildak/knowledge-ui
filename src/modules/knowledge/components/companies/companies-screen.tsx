'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { ArrowsMerge as ArrowsMergeIcon } from '@phosphor-icons/react/dist/ssr/ArrowsMerge';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Question as QuestionIcon } from '@phosphor-icons/react/dist/ssr/Question';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getCompanies, mergeCompanies } from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { CompanyListItem, KnowledgeUser } from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

import { CompanyMergeDialog } from './company-merge-dialog';

/**
 * Şirketler — prototip karşılığı: `sirketler.html` + `js/pages/sirketler.js`.
 *
 * 03 §8: ekran tüm rollerde AYNI bileşendir, aksiyonlar role göre değişir —
 * mükerrer kayıt birleştirme yalnızca Admin'de görünür (RACI).
 * Ç8: şirket KAYDI herkese görünür, şirkete ÖZEL içerik atanmış ekibe. Bu yüzden
 * erişimi olmayan satırda "soru yok" demiyoruz; "erişim yok" diyoruz — kayıt
 * olabilir, görünmüyor.
 */

const PAGE_SIZE = 10;

const GRID = 'grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_auto] gap-4';

/** Satırdaki soru özeti — Ç8 erişim durumu dâhil dört hâl. */
function QuestionSummary({ company }: { company: CompanyListItem }): React.JSX.Element {
  const { t } = useTranslation();
  const total = company.question_count ?? 0;
  const open = Math.max(0, total - (company.solved_count ?? 0));

  const cell = (icon: React.ReactNode, tone: string, label: string, hint: string) => (
    <span className="flex min-w-0 items-center gap-2">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${tone}`}>{icon}</span>
      <span className="flex min-w-0 flex-col leading-tight">
        <strong className="truncate text-[12.5px]">{label}</strong>
        <small className="truncate text-[11px] text-fg-muted">{hint}</small>
      </span>
    </span>
  );

  if (company.access === false) {
    return cell(
      <ShieldCheckIcon size={14} />,
      'bg-fg-muted/10 text-fg-muted',
      t('knowledge.companies.noAccess'),
      t('knowledge.companies.noAccessHint')
    );
  }

  if (!total) {
    return cell(
      <QuestionIcon size={14} />,
      'bg-fg-muted/10 text-fg-muted',
      t('knowledge.companies.noQuestions'),
      t('knowledge.companies.noQuestionsHint')
    );
  }

  if (!open) {
    return cell(
      <CheckCircleIcon size={14} />,
      'bg-success/15 text-success-strong dark:text-success-light',
      t('knowledge.companies.allAnswered'),
      t('knowledge.companies.allAnsweredHint', { count: total })
    );
  }

  return cell(
    <ClockIcon size={14} />,
    'bg-warning/15 text-warning-strong dark:text-warning-light',
    t('knowledge.companies.awaiting', { count: open }),
    t('knowledge.companies.awaitingHint', { count: total })
  );
}

function AccountManagers({ company }: { company: CompanyListItem }): React.JSX.Element {
  const { t } = useTranslation();
  const managers: KnowledgeUser[] = company.mts?.length ? company.mts : company.mt ? [company.mt] : [];

  if (!managers.length) {
    return <span className="text-[12.5px] text-fg-muted">{t('knowledge.companies.noManager')}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex shrink-0 items-center -space-x-1.5">
        {managers.slice(0, 3).map(manager => (
          <span
            className="rounded-full ring-2 ring-[var(--mui-palette-background-paper)]"
            key={manager.id}
          >
            <UserAvatar
              name={manager.name}
              size={24}
            />
          </span>
        ))}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <strong className="truncate text-[12.5px]">{managers.map(manager => manager.name).join(', ')}</strong>
        <small className="text-[11px] text-fg-muted">
          {t('knowledge.companies.managerCount', { count: managers.length })}
        </small>
      </span>
    </span>
  );
}

export function CompaniesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { hasRole, isFetched } = useKnowledgeRole();
  const { run } = useAsyncAction();

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [mergeSource, setMergeSource] = useState<CompanyListItem | null>(null);
  const [busy, setBusy] = useState(false);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = hasRole('admin');

  const loadData = useCallback(async () => {
    setCompanies(await getCompanies());
  }, []);

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Şirketler yüklenemedi.', error);
        toast.error(t('knowledge.companies.loadFailed'));
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

  /** Portföy özeti — rakamlar veriden türer, sabit metin yok. */
  const summary = useMemo(() => {
    const questions = companies.reduce((total, company) => total + (company.question_count ?? 0), 0);
    const solved = companies.reduce((total, company) => total + (company.solved_count ?? 0), 0);

    return {
      companies: companies.length,
      questions,
      open: Math.max(0, questions - solved),
      // Ç8: erişilemeyen şirket varsa toplam "tüm şirketler" değil, "erişimindekiler".
      partial: companies.some(company => company.access === false)
    };
  }, [companies]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');

    return companies
      .filter(company => !needle || company.name.toLocaleLowerCase('tr-TR').includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [companies, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, filtered.length);
  const slice = filtered.slice(from, to);

  const handleMerge = useCallback(
    async (targetId: string) => {
      if (!mergeSource) {
        return;
      }
      setBusy(true);
      const result = await run(() => mergeCompanies({ source_id: mergeSource.id, target_id: targetId }), {
        message: t('knowledge.companies.merge.failed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      setMergeSource(null);
      toast.success(
        t('knowledge.companies.merge.done', {
          count: result.moved_records,
          source: result.deleted_name,
          target: result.target.name
        })
      );
      await loadData().catch(() => undefined);
    },
    [loadData, mergeSource, run, t]
  );

  const metrics = [
    {
      hint: t('knowledge.companies.metric.portfolioHint'),
      icon: <BuildingsIcon size={17} />,
      key: 'portfolio',
      label: t('knowledge.companies.metric.portfolio'),
      tone: 'bg-info/15 text-info-strong dark:text-info-light',
      value: summary.companies
    },
    {
      hint: summary.partial
        ? t('knowledge.companies.metric.questionsHintScoped')
        : t('knowledge.companies.metric.questionsHintAll'),
      icon: <QuestionIcon size={17} />,
      key: 'questions',
      label: t('knowledge.companies.metric.questions'),
      tone: 'bg-info/15 text-info-strong dark:text-info-light',
      value: summary.questions
    },
    {
      hint: t('knowledge.companies.metric.openHint'),
      icon: <TrayIcon size={17} />,
      key: 'open',
      label: t('knowledge.companies.metric.open'),
      tone: 'bg-warning/15 text-warning-strong dark:text-warning-light',
      value: summary.open
    }
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.companies.title')}</h1>
        <p className="mt-1 max-w-[80ch] text-[13.5px] text-fg-muted">{t('knowledge.companies.subtitle')}</p>
      </header>

      <section
        aria-label={t('knowledge.companies.summaryLabel')}
        className="mb-5 grid gap-3 sm:grid-cols-3"
      >
        {metrics.map(metric => (
          <div
            className="flex min-w-0 items-start gap-3 rounded-bubble border border-border bg-surface p-3.5 shadow-card"
            key={metric.key}
          >
            <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] ${metric.tone}`}>
              {metric.icon}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[12px] font-semibold text-fg-muted">{metric.label}</span>
              <strong className="mt-0.5 text-[26px] leading-none tracking-[-0.03em]">{metric.value}</strong>
              <small className="mt-1 text-[11.5px] text-fg-muted">{metric.hint}</small>
            </span>
          </div>
        ))}
      </section>

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
            placeholder={t('knowledge.companies.search')}
            size="small"
            type="search"
            value={search}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map(index => (
              <Skeleton
                height={56}
                key={index}
                variant="rounded"
              />
            ))}
          </div>
        ) : slice.length === 0 ? (
          <div className="p-4">
            <EmptyState
              description={t('knowledge.companies.emptyDescription')}
              title={t('knowledge.companies.emptyTitle')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div
                  className={`${GRID} border-b border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-fg-muted`}
                  role="row"
                >
                  <span>{t('knowledge.companies.columns.company')}</span>
                  <span>{t('knowledge.companies.columns.managers')}</span>
                  <span>{t('knowledge.companies.columns.ogy')}</span>
                  <span>{t('knowledge.companies.columns.questions')}</span>
                  <span />
                </div>

                {slice.map(company => (
                  <div
                    className={`${GRID} items-center border-b border-border px-4 py-3`}
                    key={company.id}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-fg-muted/10 text-[11px] font-semibold">
                        {company.name.slice(0, 1)}
                      </span>
                      <strong
                        className="truncate text-sm"
                        title={company.name}
                      >
                        {company.name}
                      </strong>
                    </span>

                    <AccountManagers company={company} />

                    {company.ogy ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <UserAvatar
                          name={company.ogy.name}
                          size={24}
                        />
                        <span className="flex min-w-0 flex-col leading-tight">
                          <strong className="truncate text-[12.5px]">{company.ogy.name}</strong>
                          <small className="text-[11px] text-fg-muted">{t('knowledge.companies.ogyLabel')}</small>
                        </span>
                      </span>
                    ) : (
                      <span className="text-[12.5px] text-fg-muted">{t('knowledge.companies.noOgy')}</span>
                    )}

                    <QuestionSummary company={company} />

                    <span className="flex items-center justify-end gap-1">
                      {/* 03 §8 + RACI: birleştirme yalnızca Admin'de görünür. */}
                      {isAdmin ? (
                        <Tooltip title={t('knowledge.companies.merge.action')}>
                          <IconButton
                            aria-label={t('knowledge.companies.merge.actionFor', { name: company.name })}
                            onClick={() => setMergeSource(company)}
                            size="small"
                          >
                            <ArrowsMergeIcon size={16} />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {/* Şirket detay sayfası henüz taşınmadı. */}
                      <MigrationLink href={paths.knowledgeCompany(company.id)}>
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
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] text-fg-muted">
                {t('knowledge.companies.rangeSummary', { from: from + 1, to, total: filtered.length })}
              </span>
              <Pagination
                count={pageCount}
                onChange={(_event, value) => setPage(value)}
                page={currentPage}
                shape="rounded"
                size="small"
              />
            </div>
          </>
        )}
      </section>

      <CompanyMergeDialog
        busy={busy}
        companies={companies}
        onClose={() => setMergeSource(null)}
        onSubmit={handleMerge}
        open={Boolean(mergeSource)}
        source={mergeSource}
      />
    </div>
  );
}
