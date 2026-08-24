'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';

import { File as FileIcon } from '@phosphor-icons/react/dist/ssr/File';
import { Funnel as FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel';
import { LinkSimple as LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  createDocument,
  createFeedback,
  createFlag,
  deleteDocument,
  getArticles,
  getDocumentFileUrl,
  getDocuments,
  getFeedbackSummary,
  getTags,
  updateArticle
} from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import { usePromptDialog } from 'src/modules/knowledge/hooks/use-prompt-dialog';
import type {
  ArticleListItem,
  CreateDocumentInput,
  FeedbackSummary,
  KnowledgeDocumentListItem,
  Tag
} from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

import { ArticleDetailDialog } from './article-detail-dialog';
import { ArticleEditDialog } from './article-edit-dialog';
import { DocumentsPanel } from './documents-panel';

/**
 * Bilgi Bankası (FR-21) — prototip karşılığı: `bilgi-bankasi.html`.
 *
 * V25: kaynağa dayanan GENEL mevzuat bilgisi. Şirkete özel soru–cevap burada
 * değil, Sorular ve şirket sayfalarında durur; servis katmanı şirkete özel
 * kayıtları bu listeye hiç döndürmez.
 * V44: onay kademesi yok — listedeki her kayıt yayında.
 * Operasyon salt görüntüler, düzenleme Bilgi Uzmanı Havuzu'nda (RACI).
 */

const PAGE_SIZE = 10;

/** Kolon genişlikleri tek yerde: başlık satırı ile kayıtlar aynı ızgarayı paylaşır. */
const GRID = 'grid grid-cols-[minmax(0,2.6fr)_minmax(0,1.1fr)_minmax(0,1fr)] gap-4';

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function ArticlesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { hasRole, isFetched, isReadOnly } = useKnowledgeRole();
  const { run } = useAsyncAction();
  const { prompt, promptDialog } = usePromptDialog();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /**
   * Bilgi Bankası iki tür içerik tutuyor: yazılmış KAYITLAR ve yüklenen
   * BELGELER. Prototipte tek maddeli bırakılmış görünüm seçici bu ayrım için
   * ayrılmıştı; ikinci madde onun yerine geliyor.
   */
  const [view, setView] = useState<'articles' | 'documents'>('articles');

  const [search, setSearch] = useState('');
  const [tagId, setTagId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<ArticleListItem | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [editing, setEditing] = useState<ArticleListItem | null>(null);
  const [busy, setBusy] = useState(false);

  const searchRef = useRef<HTMLInputElement | null>(null);

  const readOnly = isReadOnly(paths.knowledgeArticles);
  // Düzenleme yetkisi havuzun kendisinde: Admin bile kaydı değiştirmiyor (RACI).
  const canEdit = hasRole('bilgi_uzmani');
  /** Belge yükleme/kaldırma da aynı havuzun işi (RACI). */
  const canManageDocuments = hasRole('bilgi_uzmani');

  /**
   * Etiketler bu ekranda İKİNCİL: filtre açılırı ve çipleri besliyor, kayıtları
   * değil. `getTags` canlı backend'e gittiği için tek bir 401/503 `Promise.all`
   * üzerinden tüm ekranı düşürüyordu — kayıtlar mock'tan gelip sorunsuz
   * render edilebilecekken. Bu yüzden etiketler ayrı çözülüyor: hata hâlinde
   * filtre boş kalır, liste çalışmaya devam eder.
   */
  const loadData = useCallback(async () => {
    const [articleList, documentList, tagList] = await Promise.all([
      getArticles(),
      getDocuments(),
      getTags().catch(error => {
        console.error('[knowledge] Etiketler yüklenemedi; filtre boş kalıyor.', error);
        toast.warning(t('knowledge.articles.tagsUnavailable'));

        return [] as Tag[];
      })
    ]);

    setArticles(articleList);
    setDocuments(documentList);
    setTags(tagList);
  }, [t]);

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Bilgi Bankası yüklenemedi.', error);
        toast.error(t('knowledge.articles.loadFailed'));
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

  /** ⌘K / Ctrl+K arama kutusuna odaklanır — Sorular ekranıyla aynı kısayol. */
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

    return articles.filter(
      article =>
        (!tagId || (article.tag_id ?? []).includes(tagId)) &&
        (!needle || `${article.title} ${article.content}`.toLocaleLowerCase('tr-TR').includes(needle))
    );
  }, [articles, search, tagId]);

  useEffect(() => {
    setPage(1);
  }, [search, tagId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, filtered.length);
  const slice = filtered.slice(from, to);

  const openDetail = useCallback(async (article: ArticleListItem) => {
    setDetail(article);
    setFeedback(null);
    // Onay/red özeti kayıt bazlı; listede taşınmıyor, detay açılışında çekilir.
    const summary = await getFeedbackSummary({ target_id: article.id, target_kind: 'kb_kaydi' }).catch(() => null);
    setFeedback(summary);
  }, []);

  const handleFeedback = useCallback(
    async (value: 'onay' | 'red') => {
      if (!detail) {
        return;
      }
      setBusy(true);
      const result = await run(() => createFeedback({ target_id: detail.id, target_kind: 'kb_kaydi', value }), {
        message: t('knowledge.articles.detail.feedbackFailed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      toast.success(t('knowledge.articles.detail.feedbackSaved'));
      const summary = await getFeedbackSummary({ target_id: detail.id, target_kind: 'kb_kaydi' }).catch(() => null);
      setFeedback(summary);
    },
    [detail, run, t]
  );

  const handleReport = useCallback(async () => {
    if (!detail) {
      return;
    }
    const reason = await prompt({
      confirmLabel: t('knowledge.articles.detail.report'),
      description: t('knowledge.articles.report.description'),
      placeholder: t('knowledge.articles.report.placeholder'),
      title: t('knowledge.articles.report.title')
    });
    if (!reason) {
      return;
    }

    setBusy(true);
    const result = await run(() => createFlag({ reason, target_id: detail.id, target_kind: 'kb_kaydi' }), {
      message: t('knowledge.articles.report.failed')
    });
    setBusy(false);
    if (!result) {
      return;
    }
    toast.success(t('knowledge.articles.report.sent'));
    setDetail(null);
    await loadData().catch(() => undefined);
  }, [detail, loadData, prompt, run, t]);

  /** Belgeler de aynı arama ve etiket filtresinden geçer. */
  const filteredDocuments = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');

    return documents.filter(
      document =>
        (!tagId || (document.tag_id ?? []).includes(tagId)) &&
        (!needle ||
          `${document.name} ${document.file_name} ${document.extracted_text ?? ''}`
            .toLocaleLowerCase('tr-TR')
            .includes(needle))
    );
  }, [documents, search, tagId]);

  const handleUpload = useCallback(
    async (input: CreateDocumentInput & { file: File }) => {
      setBusy(true);
      const result = await run(() => createDocument(input), {
        message: t('knowledge.articles.documents.upload.failed')
      });
      setBusy(false);
      if (!result) {
        return false;
      }
      toast.success(
        result.indexed
          ? t('knowledge.articles.documents.upload.done')
          : t('knowledge.articles.documents.upload.doneNotIndexed')
      );
      await loadData().catch(() => undefined);

      return true;
    },
    [loadData, run, t]
  );

  const handleDeleteDocument = useCallback(
    async (document: KnowledgeDocumentListItem) => {
      setBusy(true);
      const result = await run(() => deleteDocument(document.id), {
        message: t('knowledge.articles.documents.deleteFailed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      toast.success(t('knowledge.articles.documents.deleted'));
      await loadData().catch(() => undefined);
    },
    [loadData, run, t]
  );

  /**
   * İndirme yalnızca bu oturumda yüklenen dosyada çalışır — kalıcı depo yok.
   * Kaynak bulunamazsa sessizce hiçbir şey yapmak yerine nedenini söylüyoruz.
   */
  const handleDownloadDocument = useCallback(
    async (document: KnowledgeDocumentListItem) => {
      const url = await getDocumentFileUrl(document.id).catch(() => null);
      if (!url) {
        toast.error(t('knowledge.articles.documents.downloadUnavailable'));

        return;
      }
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      link.click();
    },
    [t]
  );

  const handleUpdate = useCallback(
    async ({ title, content }: { title: string; content: string }) => {
      if (!editing) {
        return;
      }
      setBusy(true);
      const result = await run(() => updateArticle(editing.id, { content, title }), {
        message: t('knowledge.articles.edit.failed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      setEditing(null);
      toast.success(t('knowledge.articles.edit.saved'));
      await loadData().catch(() => undefined);
    },
    [editing, loadData, run, t]
  );

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.articles.title')}</h1>
          <p className="mt-1 max-w-[76ch] text-[13.5px] text-fg-muted">{t('knowledge.articles.subtitle')}</p>
        </div>
        {readOnly ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-fg-muted">
            <LockIcon size={13} />
            {t('knowledge.articles.readOnlyChip')}
          </span>
        ) : null}
      </header>

      <section className="rounded-bubble border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
          <Tabs
            className="min-h-0"
            onChange={(_event, value: 'articles' | 'documents') => setView(value)}
            value={view}
          >
            <Tab
              className="min-h-0 normal-case"
              label={`${t('knowledge.articles.view.articles')} · ${articles.length}`}
              value="articles"
            />
            <Tab
              className="min-h-0 normal-case"
              label={`${t('knowledge.articles.view.documents')} · ${documents.length}`}
              value="documents"
            />
          </Tabs>
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
            placeholder={t('knowledge.articles.search')}
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
        </div>

        <Collapse in={filtersOpen}>
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <TextField
              className="min-w-[200px]"
              label={t('knowledge.articles.columns.tags')}
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
            <span className="ml-auto text-[13px] text-fg-muted">
              {view === 'documents'
                ? t('knowledge.articles.documents.filterSummary', {
                    shown: filteredDocuments.length,
                    total: documents.length
                  })
                : t('knowledge.articles.filterSummary', { shown: filtered.length, total: articles.length })}
            </span>
          </div>
        </Collapse>

        {view === 'documents' ? (
          <DocumentsPanel
            busy={busy}
            canManage={canManageDocuments}
            documents={filteredDocuments}
            isLoading={isLoading}
            onDelete={handleDeleteDocument}
            onDownload={handleDownloadDocument}
            onUpload={handleUpload}
            tags={tags}
          />
        ) : isLoading ? (
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
              description={t('knowledge.articles.emptyDescription')}
              title={t('knowledge.articles.emptyTitle')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div
                  className={`${GRID} border-b border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-fg-muted`}
                  role="row"
                >
                  <span>{t('knowledge.articles.columns.record')}</span>
                  <span>{t('knowledge.articles.columns.tags')}</span>
                  <span>{t('knowledge.articles.columns.source')}</span>
                </div>

                {slice.map(article => {
                  const source = article.source_legislation;

                  return (
                    <div
                      className={`${GRID} w-full cursor-pointer items-center border-b border-border px-4 py-3 text-left transition hover:bg-primary/5`}
                      key={article.id}
                      onClick={() => openDetail(article)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDetail(article);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary-strong dark:text-primary-light">
                          <FileIcon size={14} />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <strong
                            className="truncate text-sm"
                            title={article.title}
                          >
                            {truncate(article.title, 88)}
                          </strong>
                          <small className="truncate text-fg-muted">
                            {truncate(article.content, 92)}
                            {article.flag_count
                              ? ` · ${t('knowledge.articles.openReports', { count: article.flag_count })}`
                              : ''}
                          </small>
                        </span>
                      </span>

                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {article.tags.length ? (
                          <TagChips
                            max={2}
                            pool={tags}
                            tags={article.tags}
                          />
                        ) : (
                          <span className="text-[12.5px] text-fg-muted">{t('knowledge.articles.detail.noTags')}</span>
                        )}
                      </span>

                      {/* 05 §3: kaynağı olmayan kayıt tire ile işaretlenir. */}
                      <span className="flex min-w-0 items-center gap-1.5 text-[13px]">
                        {source ? (
                          <a
                            className="inline-flex min-w-0 items-center gap-1.5 text-primary-strong no-underline hover:underline dark:text-primary-light"
                            href={source.url}
                            onClick={event => event.stopPropagation()}
                            rel="noopener noreferrer"
                            target="_blank"
                            title={source.title}
                          >
                            <LinkSimpleIcon
                              className="shrink-0"
                              size={13}
                            />
                            <span className="truncate">{truncate(source.source?.name ?? source.title, 22)}</span>
                          </a>
                        ) : (
                          <span className="text-fg-muted">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] text-fg-muted">
                {t('knowledge.articles.rangeSummary', { from: from + 1, to, total: filtered.length })}
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

      <ArticleDetailDialog
        article={detail}
        busy={busy}
        canEdit={canEdit}
        feedback={feedback}
        onClose={() => setDetail(null)}
        onEdit={() => {
          setEditing(detail);
          setDetail(null);
        }}
        onFeedback={handleFeedback}
        onReport={handleReport}
        open={Boolean(detail)}
        readOnly={readOnly}
        tags={tags}
      />

      <ArticleEditDialog
        article={editing}
        busy={busy}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        open={Boolean(editing)}
      />

      {promptDialog}
    </div>
  );
}
