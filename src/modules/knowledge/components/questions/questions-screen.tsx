'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Funnel as FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  createFeedback,
  createFlag,
  getCompanies,
  getQuestion,
  getQuestions,
  getTags,
  getUsers
} from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { StatusChip } from 'src/modules/knowledge/components/common/status-chip';
import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import { usePromptDialog } from 'src/modules/knowledge/hooks/use-prompt-dialog';
import { isRouteMigrated } from 'src/modules/knowledge/navigation';
import type {
  CompanyListItem,
  KnowledgeUser,
  QuestionDetail,
  QuestionListItem,
  Tag
} from 'src/modules/knowledge/types';
import { formatRelative } from 'src/modules/knowledge/utils/format-date';
import { paths } from 'src/paths';

import { QuestionDetailDialog } from './question-detail-dialog';

/**
 * Sorular ekranı (FR-24) — prototip karşılığı: `sorular.html` + `js/pages/questions.js`.
 *
 * Herkesin sorduğu tüm sorular görünür (varsayılan), "Sadece benimkiler" ile
 * daraltılabilir. KVKK maskeleme kuralı burada da geçerlidir.
 */

const PAGE_SIZE = 10;

/** Kolon genişlikleri tek yerde: başlık satırı ile kayıt satırları aynı ızgarayı paylaşır. */
const GRID = 'grid grid-cols-[minmax(0,1.1fr)_minmax(0,2.4fr)_minmax(0,1.2fr)_auto_auto_minmax(0,1.2fr)] gap-4';

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function QuestionsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useKnowledgeRole();
  const { run } = useAsyncAction();
  const { prompt, promptDialog } = usePromptDialog();

  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<Record<string, KnowledgeUser>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [tagId, setTagId] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<QuestionDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const searchRef = React.useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    const [questionList, tagList, companyList, userList] = await Promise.all([
      getQuestions(),
      getTags(),
      getCompanies(),
      getUsers()
    ]);

    /**
     * V43: bu ekranda yalnızca iki durum var — "Uzman bekliyor" ve "Çözüldü".
     * Dasi'nin kendi çözdüğü kayıtlar (otomatik_cevaplandi ve uzman cevabı
     * olmadan kapanmış sorular) uzman çalışma alanına hiç girmez.
     */
    setQuestions(
      questionList.filter(
        question =>
          question.status === 'eskale_edildi' || (question.status === 'cozuldu' && question.expert_answer_count > 0)
      )
    );
    setTags(tagList);
    // Ç8: filtre seçeneği olarak yalnızca erişilebilir şirketler anlamlı —
    // diğerlerinin soruları listeye hiç gelmiyor.
    setCompanies(companyList.filter(company => company.access !== false));
    setUsers(Object.fromEntries(userList.map(entry => [entry.id, entry])));
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Sorular yüklenemedi.', error);
        toast.error(t('knowledge.dasi.flow.loadFailed'));
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

  /** ⌘K / Ctrl+K arama kutusuna odaklanır. */
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

    return questions.filter(
      question =>
        (!needle || question.text.toLocaleLowerCase('tr-TR').includes(needle)) &&
        (!status || question.status === status) &&
        (!companyId || question.company_id === companyId) &&
        (!tagId || (question.tag_id ?? []).includes(tagId)) &&
        (!onlyMine || question.asker_id === user?.id)
    );
  }, [companyId, onlyMine, questions, search, status, tagId, user?.id]);

  // Filtre değiştiğinde ilk sayfaya dön; aksi hâlde boş bir sayfada kalınıyor.
  useEffect(() => {
    setPage(1);
  }, [search, status, companyId, tagId, onlyMine]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, filtered.length);
  const slice = filtered.slice(from, to);

  const openDetail = useCallback(
    async (id: string) => {
      const question = await run(() => getQuestion(id), { message: t('knowledge.questions.detail.loadFailed') });
      if (!question) {
        return;
      }
      setDetail(question);
      setDetailOpen(true);
    },
    [run, t]
  );

  const refreshDetail = useCallback(async (id: string) => {
    const question = await getQuestion(id).catch(() => null);
    if (question) {
      setDetail(question);
    }
  }, []);

  const handleFeedback = useCallback(
    async (answerId: string, value: 'onay' | 'red') => {
      if (!detail) {
        return;
      }
      setBusy(true);
      const result = await run(() => createFeedback({ value: value, target_id: answerId, target_kind: 'cevap' }), {
        message: t('knowledge.questions.answer.feedbackFailed')
      });
      if (result) {
        toast.success(t('knowledge.questions.answer.feedbackSaved'));
        await refreshDetail(detail.id);
      }
      setBusy(false);
    },
    [detail, refreshDetail, run, t]
  );

  const handleReport = useCallback(
    async (answerId: string) => {
      const reason = await prompt({
        confirmLabel: t('knowledge.questions.answer.report'),
        description: t('knowledge.questions.answer.reportDescription'),
        placeholder: t('knowledge.questions.answer.reportPlaceholder'),
        title: t('knowledge.questions.answer.reportTitle')
      });
      if (!reason) {
        return;
      }

      setBusy(true);
      const result = await run(() => createFlag({ reason: reason, target_id: answerId, target_kind: 'cevap' }), {
        message: t('knowledge.questions.answer.reportFailed')
      });
      if (result) {
        toast.success(t('knowledge.questions.answer.reportSent'));
        await loadData().catch(() => undefined);
        if (detail) {
          await refreshDetail(detail.id);
        }
      }
      setBusy(false);
    },
    [detail, loadData, prompt, refreshDetail, run, t]
  );

  const answerSummary = (question: QuestionListItem): string => {
    if (question.expert_answer_count) {
      return t('knowledge.questions.expertAnswerCount', { count: question.expert_answer_count });
    }

    return question.status === 'eskale_edildi'
      ? t('knowledge.questions.awaitingExpert')
      : t('knowledge.questions.noAnswer');
  };

  const newQuestionReady = isRouteMigrated(paths.knowledgeNewQuestion);

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">{t('knowledge.questions.title')}</h1>
        <p className="mt-1 text-fg-muted">{t('knowledge.questions.subtitle')}</p>
      </header>

      <section className="rounded-bubble border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-b border-border px-4 py-3">
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
            placeholder={t('knowledge.questions.search')}
            size="small"
            type="search"
            value={search}
          />
          <Button
            aria-expanded={filtersOpen}
            className="normal-case"
            onClick={() => setFiltersOpen(open => !open)}
            startIcon={<FunnelIcon />}
            variant="outlined"
          >
            {t('knowledge.questions.filters')}
          </Button>
          {/* "Yeni Soru Sor" ekranı henüz taşınmadı. */}
          <Tooltip title={newQuestionReady ? '' : t('knowledge.discover.notMigrated')}>
            <span>
              <Button
                className="normal-case"
                disabled={!newQuestionReady}
                startIcon={<PlusIcon />}
                variant="contained"
              >
                {t('knowledge.questions.newQuestion')}
              </Button>
            </span>
          </Tooltip>
        </div>

        <Collapse in={filtersOpen}>
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <TextField
              className="min-w-[160px]"
              label={t('knowledge.questions.columns.status')}
              onChange={event => setStatus(event.target.value)}
              select
              size="small"
              value={status}
            >
              <MenuItem value="">{t('knowledge.questions.allStatuses')}</MenuItem>
              <MenuItem value="eskale_edildi">{t('knowledge.status.eskale_edildi')}</MenuItem>
              <MenuItem value="cozuldu">{t('knowledge.status.cozuldu')}</MenuItem>
            </TextField>
            <TextField
              className="min-w-[180px]"
              label={t('knowledge.questions.columns.company')}
              onChange={event => setCompanyId(event.target.value)}
              select
              size="small"
              value={companyId}
            >
              <MenuItem value="">{t('knowledge.questions.allCompanies')}</MenuItem>
              {companies.map(company => (
                <MenuItem
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              className="min-w-[180px]"
              label={t('knowledge.questions.columns.tags')}
              onChange={event => setTagId(event.target.value)}
              select
              size="small"
              value={tagId}
            >
              <MenuItem value="">{t('knowledge.questions.allTags')}</MenuItem>
              {tags.map(tag => (
                <MenuItem
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyMine}
                  onChange={event => setOnlyMine(event.target.checked)}
                />
              }
              label={t('knowledge.questions.onlyMine')}
            />
            <span className="ml-auto text-[13px] text-fg-muted">
              {t('knowledge.questions.filterSummary', { shown: filtered.length, total: questions.length })}
            </span>
          </div>
        </Collapse>

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
              description={
                onlyMine ? t('knowledge.questions.emptyMineDescription') : t('knowledge.questions.emptyDescription')
              }
              title={t('knowledge.questions.emptyTitle')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div
                  className={`${GRID} border-b border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-fg-muted`}
                  role="row"
                >
                  <span>{t('knowledge.questions.columns.asker')}</span>
                  <span>{t('knowledge.questions.columns.question')}</span>
                  <span>{t('knowledge.questions.columns.company')}</span>
                  <span>{t('knowledge.questions.columns.status')}</span>
                  <span>{t('knowledge.questions.columns.createdAt')}</span>
                  <span>{t('knowledge.questions.columns.tags')}</span>
                </div>

                {slice.map(question => {
                  const company = companies.find(entry => entry.id === question.company_id);
                  const asker = users[question.asker_id];
                  const questionTags = (question.tag_id ?? [])
                    .map(id => tags.find(tag => tag.id === id))
                    .filter(Boolean) as Tag[];
                  const privacy = PRIVACY_CLASSES.find(entry => entry.id === question.privacy_class);

                  return (
                    <div
                      className={`${GRID} w-full cursor-pointer items-center border-b border-border px-4 py-3 text-left transition hover:bg-primary/5`}
                      key={question.id}
                      onClick={() => openDetail(question.id)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDetail(question.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <UserAvatar
                          name={asker?.name}
                          size={30}
                        />
                        <span className="truncate text-sm">{asker?.name ?? question.asker_id}</span>
                      </span>

                      <span className="flex min-w-0 flex-col">
                        <strong
                          className="truncate text-sm"
                          title={question.text}
                        >
                          {truncate(question.text, 84)}
                        </strong>
                        <small className="text-fg-muted">
                          {answerSummary(question)}
                          {question.flag_count
                            ? ` · ${t('knowledge.questions.reportCount', { count: question.flag_count })}`
                            : ''}
                        </small>
                      </span>

                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        {company ? (
                          <>
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-fg-muted/10 text-[11px] font-semibold">
                              {company.name.slice(0, 1)}
                            </span>
                            <span className="truncate">{company.name}</span>
                          </>
                        ) : (
                          <>
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-info/15 text-info-strong dark:text-info-light">
                              <BookOpenIcon size={13} />
                            </span>
                            <span className="truncate text-fg-muted">
                              {t('knowledge.questions.generalLegislation')}
                            </span>
                          </>
                        )}
                      </span>

                      <span>
                        <StatusChip status={question.status} />
                      </span>

                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-fg-muted">
                        <ClockIcon />
                        {formatRelative(question.created_at)}
                      </span>

                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <TagChips
                          max={2}
                          pool={tags}
                          tags={questionTags}
                        />
                        {question.privacy_class === 'kisisel_veri' && privacy ? (
                          <Tooltip title={t(privacy.descriptionKey)}>
                            <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] text-warning-strong dark:text-warning-light">
                              <ShieldCheckIcon size={12} />
                              {t(privacy.labelKey)}
                            </span>
                          </Tooltip>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] text-fg-muted">
                {t('knowledge.questions.rangeSummary', { from: from + 1, to, total: filtered.length })}
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

      <QuestionDetailDialog
        busy={busy}
        companies={companies}
        onClose={() => setDetailOpen(false)}
        onFeedback={handleFeedback}
        onReport={handleReport}
        open={detailOpen}
        question={detail}
        tags={tags}
        users={users}
      />
      {promptDialog}
    </div>
  );
}
