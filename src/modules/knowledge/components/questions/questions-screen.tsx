'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Book as BookIcon } from '@phosphor-icons/react/dist/ssr/Book';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
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

import { QuestionAvatar } from './question-avatar';
import { QuestionDetailDialog } from './question-detail-dialog';
import { QuestionStatusBadge, QuestionTagList } from './question-ui';

/**
 * Sorular ekranı (FR-24) — prototip karşılığı: `sorular.html` + `js/pages/sorular.js`.
 *
 * Görünüm, prototipin sıcak-nötr panel dilini birebir yeniden üretir; MUI
 * bileşenleri yerine düz işaretleme + Tailwind kullanılır (renkler `styles.css`
 * içindeki `body[data-sayfa="sorular"]` bloklarından piksel piksel alınmıştır).
 */

const PAGE_SIZE = 10;

/** Başlık satırı ile kayıt satırları aynı ızgarayı paylaşır (prototiple aynı oran). */
const GRID =
  'grid grid-cols-[minmax(140px,1.05fr)_minmax(200px,2.1fr)_minmax(105px,1fr)_minmax(115px,1fr)_minmax(95px,0.85fr)_minmax(180px,1.5fr)] gap-x-3 items-center';

const COLUMN_KEYS = ['asker', 'question', 'company', 'status', 'createdAt', 'tags'] as const;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

/**
 * Prototipteki `gorunumSorulariniHazirla()` karşılığı.
 *
 * 1) Aynı soru metninin farklı durum/tekrar gönderimlerle oluşan kopyalarından
 *    yalnızca ilki listede kalır.
 * 2) Etiketi olmayan (ya da 1 taneden az olan) sorular, listenin dolu görünmesi
 *    için havuzdan KOZMETİK olarak 2 etikete tamamlanır — erişimle ilgisi yok,
 *    yalnızca görünüm zenginliği (03 §FR-24 notu).
 */
function prepareViewQuestions(questions: QuestionListItem[], tagPool: Tag[]): QuestionListItem[] {
  if (!tagPool.length) {
    return questions;
  }

  const seen = new Set<string>();
  const unique = questions.filter(question => {
    const key = question.text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);

    return true;
  });

  return unique.map((question, index) => {
    const existing = (question.tag_id ?? []).filter(id => tagPool.some(tag => tag.id === id));
    const tagIds = [...existing];
    for (let offset = 0; tagIds.length < Math.min(2, tagPool.length); offset += 1) {
      const candidate = tagPool[(index * 2 + offset) % tagPool.length].id;
      if (!tagIds.includes(candidate)) {
        tagIds.push(candidate);
      }
    }

    return { ...question, tag_id: tagIds };
  });
}

/** Prototipteki sayfalama penceresi: 1, son, aktif±1 + aradaki boşluklarda "…". */
function paginationItems(pageCount: number, current: number): Array<number | 'gap'> {
  const shown = new Set([1, pageCount, current - 1, current, current + 1]);
  const pages = [...shown].filter(page => page >= 1 && page <= pageCount).sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) {
      result.push('gap');
    }
    result.push(page);
    previous = page;
  }

  return result;
}

export function QuestionsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
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

  // Görünüm listesi: metin tekilleştirme + kozmetik etiket doldurma (prototiple aynı).
  const viewQuestions = useMemo(() => prepareViewQuestions(questions, tags), [questions, tags]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');

    return viewQuestions.filter(
      question =>
        (!needle || question.text.toLocaleLowerCase('tr-TR').includes(needle)) &&
        (!status || question.status === status) &&
        (!companyId || question.company_id === companyId) &&
        (!tagId || (question.tag_id ?? []).includes(tagId)) &&
        (!onlyMine || question.asker_id === user?.id)
    );
  }, [companyId, onlyMine, viewQuestions, search, status, tagId, user?.id]);

  // Filtre değiştiğinde ilk sayfaya dön; aksi hâlde boş bir sayfada kalınıyor.
  useEffect(() => {
    setPage(1);
  }, [search, status, companyId, tagId, onlyMine]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, filtered.length);
  const slice = filtered.slice(from, to);

  // Detay, ham `getQuestion`'dan gelir; ama etiketler listedeki KOZMETİK olarak
  // doldurulmuş görünüm kaydından alınır (prototipteki `soruDetayAc` de görünüm
  // kaydının tag_id'sini detaya bindirir) — böylece modalda da etiketler dolu görünür.
  const withViewTags = useCallback(
    (question: QuestionDetail): QuestionDetail => {
      const view = viewQuestions.find(entry => entry.id === question.id);

      return view ? { ...question, tag_id: view.tag_id } : question;
    },
    [viewQuestions]
  );

  const openDetail = useCallback(
    async (id: string) => {
      const question = await run(() => getQuestion(id), { message: t('knowledge.questions.detail.loadFailed') });
      if (!question) {
        return;
      }
      setDetail(withViewTags(question));
      setDetailOpen(true);
    },
    [run, t, withViewTags]
  );

  const refreshDetail = useCallback(
    async (id: string) => {
      const question = await getQuestion(id).catch(() => null);
      if (question) {
        setDetail(withViewTags(question));
      }
    },
    [withViewTags]
  );

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

  const selectClass =
    'min-w-[150px] max-w-[230px] rounded-lg border border-[#e5e5e2] bg-white px-2.5 py-2 text-[13px] text-[#171816] outline-none focus:border-[#0053fd] dark:border-border dark:bg-surface dark:text-fg';

  return (
    <div className="kb-surface mx-auto w-full max-w-[1200px] p-4 md:p-6">
      <section className="overflow-hidden rounded-2xl border border-[#e7e7e5] bg-white shadow-[0_1px_2px_rgba(18,18,16,0.025)] dark:border-border dark:bg-surface">
        {/* Araç çubuğu — prototipteki `.ds-soru-araclar` */}
        <div className="flex min-h-[68px] flex-wrap items-center gap-3.5 border-b border-[#ececea] px-4 py-3 dark:border-border">
          <div className="inline-flex items-center rounded-[9px] bg-[#f2f2f0] p-[3px] dark:bg-surface-1">
            <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-white px-[9px] py-1.5 text-[13px] text-[#222321] shadow-[0_1px_2px_rgba(0,0,0,0.07)] dark:bg-surface-2 dark:text-fg">
              <FileTextIcon size={15} />
              {t('knowledge.questions.viewList', { defaultValue: 'Liste' })}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Arama — prototipteki `.ds-soru-arama` */}
            <label className="flex h-[38px] w-[min(270px,45vw)] items-center gap-2 rounded-[10px] border border-[#e1e1df] bg-white px-2.5 text-[#8a8c87] dark:border-border dark:bg-surface">
              <MagnifyingGlassIcon
                className="shrink-0"
                size={16}
              />
              <input
                aria-label={t('knowledge.questions.search')}
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#171816] outline-none dark:text-fg"
                onChange={event => setSearch(event.target.value)}
                placeholder={t('knowledge.questions.search')}
                ref={searchRef}
                type="search"
                value={search}
              />
              <kbd className="hidden whitespace-nowrap rounded-[5px] border border-[#e2e2df] bg-[#f7f7f5] px-[5px] py-1 text-[11px] leading-none text-[#858782] sm:inline dark:border-border dark:bg-surface-1 dark:text-fg-muted">
                ⌘ K
              </kbd>
            </label>

            <button
              aria-expanded={filtersOpen}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-[9px] border border-[#e5e5e2] bg-white px-3 py-[7px] text-[13px] font-medium text-[#3f453f] shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition hover:border-[#d9d9d6] hover:bg-[#f7f7f5] dark:border-border dark:bg-surface dark:text-fg dark:hover:bg-surface-1"
              onClick={() => setFiltersOpen(open => !open)}
              type="button"
            >
              <FunnelIcon size={16} />
              {t('knowledge.questions.filters')}
            </button>

            {/* "Yeni Soru Sor" ekranı henüz taşınmadıysa buton yine tam renkli
                durur (prototiple birebir); tıklanınca hazır olduğunda yönlendirir,
                değilse bilgilendirir. */}
            <button
              className="inline-flex min-h-[36px] items-center gap-2 rounded-[9px] border border-[#0053fd] bg-[#0053fd] px-3 py-[7px] text-[13px] font-medium text-white transition hover:border-[#0043d6] hover:bg-[#0043d6]"
              onClick={() => {
                if (newQuestionReady) {
                  router.push(paths.knowledgeNewQuestion);
                } else {
                  toast.info(t('knowledge.discover.notMigrated'));
                }
              }}
              type="button"
            >
              <PlusIcon size={16} />
              {t('knowledge.questions.newQuestion')}
            </button>
          </div>
        </div>

        {/* Filtre çubuğu — prototipteki `.ds-filtreler` */}
        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[#ececea] bg-[#fafaf9] px-4 py-3 dark:border-border dark:bg-surface-1">
            <select
              aria-label={t('knowledge.questions.columns.status')}
              className={selectClass}
              onChange={event => setStatus(event.target.value)}
              value={status}
            >
              <option value="">{t('knowledge.questions.allStatuses')}</option>
              <option value="eskale_edildi">{t('knowledge.status.eskale_edildi')}</option>
              <option value="cozuldu">{t('knowledge.status.cozuldu')}</option>
            </select>
            <select
              aria-label={t('knowledge.questions.columns.company')}
              className={selectClass}
              onChange={event => setCompanyId(event.target.value)}
              value={companyId}
            >
              <option value="">{t('knowledge.questions.allCompanies')}</option>
              {companies.map(company => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              ))}
            </select>
            <select
              aria-label={t('knowledge.questions.columns.tags')}
              className={selectClass}
              onChange={event => setTagId(event.target.value)}
              value={tagId}
            >
              <option value="">{t('knowledge.questions.allTags')}</option>
              {tags.map(tag => (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[14px] text-[#171816] dark:text-fg">
              <input
                checked={onlyMine}
                className="h-4 w-4 cursor-pointer accent-[#0053fd]"
                onChange={event => setOnlyMine(event.target.checked)}
                type="checkbox"
              />
              {t('knowledge.questions.onlyMine')}
            </label>
            <span className="ml-auto text-[13px] text-[#979994] dark:text-fg-muted">
              {t('knowledge.questions.filterSummary', { shown: filtered.length, total: viewQuestions.length })}
            </span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col">
            {[0, 1, 2, 3, 4].map(index => (
              <div
                className="flex min-h-[66px] items-center gap-3 border-b border-[#e6e6e3] px-4 dark:border-border"
                key={index}
              >
                <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#ececea] dark:bg-surface-1" />
                <span className="h-3 flex-1 animate-pulse rounded bg-[#ececea] dark:bg-surface-1" />
              </div>
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
            <div className="w-full overflow-x-auto">
              <div className="min-w-[920px]">
                {/* Başlık satırı */}
                <div
                  className={`${GRID} min-h-[46px] border-b border-[#ececea] px-4 text-[11.5px] font-semibold text-[#666863] dark:border-border dark:text-fg-muted`}
                  role="row"
                >
                  {COLUMN_KEYS.map(key => (
                    <span key={key}>
                      {t(`knowledge.questions.columns.${key}`)}
                      <span className="ml-1 text-[9px] text-[#aaa]">↕</span>
                    </span>
                  ))}
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
                      className={`${GRID} min-h-[66px] cursor-pointer border-b border-[#e6e6e3] px-4 py-2 text-left transition-colors hover:bg-[#fafaf8] focus:bg-[#fafaf8] focus:outline-none dark:border-border dark:hover:bg-surface-1`}
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
                      {/* Soran */}
                      <span className="flex min-w-0 items-center gap-[9px]">
                        <QuestionAvatar
                          name={asker?.name}
                          size={32}
                          userId={question.asker_id}
                        />
                        <span className="truncate text-[12.5px] text-[#424440] dark:text-fg">
                          {asker?.name ?? question.asker_id}
                        </span>
                      </span>

                      {/* Soru */}
                      <span className="flex min-w-0 flex-col">
                        <strong
                          className="block truncate text-[13px] font-[550] text-[#222321] dark:text-fg"
                          title={question.text}
                        >
                          {truncate(question.text, 84)}
                        </strong>
                        <small className="mt-0.5 block truncate text-[11.5px] text-[#969893] dark:text-fg-muted">
                          {answerSummary(question)}
                          {question.flag_count
                            ? ` · ${t('knowledge.questions.reportCount', { count: question.flag_count })}`
                            : ''}
                        </small>
                      </span>

                      {/* Şirket */}
                      <span className="flex min-w-0 items-center gap-[9px] text-[12.5px] text-[#424440] dark:text-fg">
                        {company ? (
                          <>
                            <span className="grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full bg-[#e4efec] text-[11px] font-[650] text-[#53736b]">
                              {company.name.slice(0, 1)}
                            </span>
                            <span className="truncate">{company.name}</span>
                          </>
                        ) : (
                          <>
                            <span className="grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full bg-[#eef1f7] text-[#6b7280]">
                              <BookIcon size={14} />
                            </span>
                            <span className="truncate">{t('knowledge.questions.generalLegislation')}</span>
                          </>
                        )}
                      </span>

                      {/* Durum */}
                      <span>
                        <QuestionStatusBadge status={question.status} />
                      </span>

                      {/* Oluşturuldu */}
                      <span className="flex min-w-0 items-center gap-[9px] text-[12.5px] text-[#424440] dark:text-fg">
                        <ClockIcon
                          className="shrink-0 text-[#8c8e89]"
                          size={14}
                        />
                        <span className="truncate">{formatRelative(question.created_at)}</span>
                      </span>

                      {/* Etiketler */}
                      <span className="flex min-w-0 flex-wrap items-center gap-[5px]">
                        <QuestionTagList
                          max={2}
                          pool={tags}
                          tags={questionTags}
                        />
                        {question.privacy_class === 'kisisel_veri' && privacy ? (
                          <span
                            className="inline-flex items-center gap-[5px] whitespace-nowrap text-[10.5px] font-medium text-[#8b93b5]"
                            title={t(privacy.descriptionKey)}
                          >
                            <ShieldCheckIcon
                              className="shrink-0"
                              size={13}
                            />
                            {t(privacy.labelKey)}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alt bar — sayaç + sayfalama */}
            <div className="flex min-h-[58px] flex-wrap items-center gap-3 bg-[#fafaf9] px-4 py-2.5 text-[12.5px] text-[#777974] dark:bg-surface-1 dark:text-fg-muted">
              <span>
                {t('knowledge.questions.rangeSummary', { from: from + 1, to, total: filtered.length })
                  .split(/(\d+[–-]\d+|\d+)/)
                  .map((part, index) =>
                    /^\d/.test(part) ? (
                      <strong
                        className="text-[#333431] dark:text-fg"
                        key={index}
                      >
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
              </span>

              <nav
                aria-label={t('knowledge.questions.title')}
                className="ml-auto flex items-center gap-1.5"
              >
                <button
                  aria-label={t('common.previous', { defaultValue: 'Önceki' })}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#e5e5e2] bg-white text-[12.5px] font-semibold text-[#62645f] transition hover:border-[#d5d5d2] hover:bg-[#f1f1ef] disabled:cursor-default disabled:opacity-[0.38] dark:border-border dark:bg-surface dark:text-fg-muted"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  type="button"
                >
                  ‹
                </button>
                {paginationItems(pageCount, currentPage).map((item, index) =>
                  item === 'gap' ? (
                    <span
                      className="px-1 text-[#aaa]"
                      key={`gap-${index}`}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      aria-current={item === currentPage ? 'page' : undefined}
                      className={`grid h-8 w-8 place-items-center rounded-lg border text-[12.5px] font-semibold transition ${
                        item === currentPage
                          ? 'border-[#0053fd] bg-[#0053fd] text-white'
                          : 'border-[#e5e5e2] bg-white text-[#62645f] hover:border-[#d5d5d2] hover:bg-[#f1f1ef] dark:border-border dark:bg-surface dark:text-fg-muted'
                      }`}
                      key={item}
                      onClick={() => setPage(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  aria-label={t('common.next', { defaultValue: 'Sonraki' })}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#e5e5e2] bg-white text-[12.5px] font-semibold text-[#62645f] transition hover:border-[#d5d5d2] hover:bg-[#f1f1ef] disabled:cursor-default disabled:opacity-[0.38] dark:border-border dark:bg-surface dark:text-fg-muted"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  type="button"
                >
                  ›
                </button>
              </nav>
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
