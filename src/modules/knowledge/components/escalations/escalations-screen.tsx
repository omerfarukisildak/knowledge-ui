'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';

import { ChartLineUp as ChartLineUpIcon } from '@phosphor-icons/react/dist/ssr/ChartLineUp';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { File as FileIcon } from '@phosphor-icons/react/dist/ssr/File';
import { Lightning as LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { answerQuestion, createArticle, getEscalationPool, getTags, getUsers } from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { MigrationLink } from 'src/modules/knowledge/components/common/migration-link';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { ESCALATION_SLA } from 'src/modules/knowledge/constants';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { EscalationPoolItem, KnowledgeUser, Tag } from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

import { ArticleFromAnswerDialog } from './article-from-answer-dialog';
import { Duration, SLA_TONE } from './duration';
import { EscalationAnswerDialog } from './escalation-answer-dialog';
import { EscalationCard } from './escalation-card';
import { queueStats, waitedHours } from './sla';
import { useLiveClock } from './use-live-clock';

/**
 * Eskalasyon Havuzu — prototip karşılığı: `havuz.html` + `js/pages/havuz.js`.
 *
 * PRD §3/§4.3: havuz KİŞİYE ATANMAZ. Bütün Bilgi Uzmanları aynı kuyruğu görür,
 * kim uygunsa alır; bu yüzden ekranda "bana atanan" diye bir kavram yok.
 * 07 §3: "kimin ne zamandır beklediği şeffaf olmalı" — sıralamayı ve panoyu
 * bekleme süresi belirler. Admin kuyruğu izler, cevap yazamaz (RACI).
 */

interface PendingArticle {
  questionId: string;
  answerId: string;
  questionText: string;
  answerText: string;
  companyScoped: boolean;
}

export function EscalationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { user, hasRole, isFetched, isReadOnly } = useKnowledgeRole();
  const { run } = useAsyncAction();
  const nowMs = useLiveClock();

  const [items, setItems] = useState<EscalationPoolItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<Record<string, KnowledgeUser>>({});
  const [experts, setExperts] = useState<KnowledgeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Kayıt bazında cevap taslağı: kuyrukta gezinirken yazılan metin kaybolmaz. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingArticle, setPendingArticle] = useState<PendingArticle | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);

  const canWork = hasRole('bilgi_uzmani', 'admin');
  const readOnly = isReadOnly(paths.knowledgeEscalations);

  /**
   * Etiketler ikincil: kartlardaki çipleri besliyor, kuyruğu değil. `getTags`
   * canlı backend'e gittiği için hatası `Promise.all` üzerinden tüm kuyruğu
   * düşürmemeli — nöbet ekranı etiketsiz de çalışır.
   */
  const loadData = useCallback(async () => {
    const [pool, tagList, userList] = await Promise.all([
      getEscalationPool(),
      getTags().catch(error => {
        console.error('[knowledge] Etiketler yüklenemedi; kartlar etiketsiz gösteriliyor.', error);

        return [] as Tag[];
      }),
      getUsers()
    ]);

    setItems(pool);
    setTags(tagList);
    setUsers(Object.fromEntries(userList.map(entry => [entry.id, entry])));
    // Pano başlığındaki "N uzman aynı kuyruğu görüyor" satırı — havuzun kişiye
    // atanmadığını rakamla gösteren tek yer.
    setExperts(userList.filter(entry => entry.role === 'bilgi_uzmani' && entry.active));
  }, []);

  useEffect(() => {
    // Rol kapısı okunmadan veri çekilmez: havuz erişimi role bağlı.
    if (!isFetched || !canWork) {
      if (isFetched) {
        setIsLoading(false);
      }

      return;
    }

    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Eskalasyon havuzu yüklenemedi.', error);
        toast.error(t('knowledge.escalations.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canWork, isFetched, loadData, t]);

  const hours = useMemo(() => items.map(item => waitedHours(item, nowMs)), [items, nowMs]);
  const stats = useMemo(() => queueStats(hours), [hours]);

  const selected = items.find(item => item.id === selectedId) ?? null;

  const openDialog = useCallback((id: string) => {
    setSelectedId(id);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    // Odak kapanışta karta döner — klavyeyle gezinen kullanıcı yerini kaybetmez.
    const card = gridRef.current?.querySelector<HTMLElement>(`[data-item="${selectedId}"]`);
    card?.focus({ preventScroll: true });
  }, [selectedId]);

  const setDraft = useCallback((id: string, value: string) => {
    setDrafts(current => ({ ...current, [id]: value }));
  }, []);

  /** Kuyrukta ok tuşlarıyla gezinme — odak komşu karta taşınır. */
  const handleGridKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    const cards = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('[data-item]') ?? []);
    if (!cards.length) {
      return;
    }
    event.preventDefault();
    const current = cards.findIndex(card => card === document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = cards[Math.min(cards.length - 1, Math.max(0, current < 0 ? 0 : current + step))];
    next?.focus();
    next?.scrollIntoView({ block: 'nearest' });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selected) {
      return;
    }
    const text = (drafts[selected.id] ?? '').trim();
    if (!text) {
      toast.error(t('knowledge.escalations.composer.empty'));

      return;
    }

    setBusy(true);
    const result = await run(() => answerQuestion(selected.id, { text }), {
      message: t('knowledge.escalations.composer.failed')
    });
    setBusy(false);

    if (!result) {
      return;
    }

    setDialogOpen(false);
    setDrafts(current => {
      const next = { ...current };
      delete next[selected.id];

      return next;
    });
    toast.success(t('knowledge.escalations.composer.sent'));

    // PRD §4.2 — cevabı kalıcı bilgiye dönüştürme adımı. V44'te onay kademesi
    // olmadığı için kayıt doğrudan yayına gireceğinden form açılıyor: uzman
    // şirket izini burada temizler (V25).
    setPendingArticle({
      answerId: result.answer.id,
      answerText: result.answer.text,
      companyScoped: Boolean(selected.company_id) || selected.privacy_class === 'sirkete_ozel',
      questionId: selected.id,
      questionText: selected.text
    });

    await loadData().catch(() => undefined);
  }, [drafts, loadData, run, selected, t]);

  const handleCreateArticle = useCallback(
    async ({ title, content }: { title: string; content: string }) => {
      if (!pendingArticle) {
        return;
      }

      setBusy(true);
      const article = await run(
        () =>
          createArticle({
            answer_id: pendingArticle.answerId,
            content,
            question_id: pendingArticle.questionId,
            tag_id: items.find(item => item.id === pendingArticle.questionId)?.tag_id ?? [],
            title
          }),
        { message: t('knowledge.escalations.article.failed') }
      );
      setBusy(false);

      if (!article) {
        return;
      }
      setPendingArticle(null);
      toast.success(t('knowledge.escalations.article.created'));
    },
    [items, pendingArticle, run, t]
  );

  /* ═══ Rol kapısı ═══════════════════════════════════════════════════════ */

  if (isFetched && !canWork) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-4 md:px-8 md:py-6">
        <EmptyState
          description={t('knowledge.escalations.noAccessDescription')}
          title={t('knowledge.escalations.noAccessTitle')}
        />
      </div>
    );
  }

  /* ═══ Pano şeridi ══════════════════════════════════════════════════════ */

  const segments = [
    { className: SLA_TONE.critical.bar, count: stats.critical, label: t('knowledge.escalations.legend.critical') },
    { className: SLA_TONE.warning.bar, count: stats.warning, label: t('knowledge.escalations.legend.warning') },
    { className: SLA_TONE.normal.bar, count: stats.onTime, label: t('knowledge.escalations.legend.normal') }
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-5 overflow-hidden rounded-bubble border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-5 px-[17px] py-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              <i className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-kb-pulse" />
              {t('knowledge.escalations.kicker')}
            </span>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.escalations.title')}</h1>
            <p className="mt-1 max-w-[62ch] text-[13.5px] text-fg-muted">{t('knowledge.escalations.subtitle')}</p>
          </div>

          {/* Havuzun kişiye atanmadığını gösteren tek yüzey. */}
          <div className="flex min-w-0 flex-col items-start gap-1.5 sm:items-end">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {t('knowledge.escalations.poolLabel')}
            </span>
            <div className="flex items-center -space-x-2">
              {experts.map(expert => (
                <Tooltip
                  key={expert.id}
                  title={expert.name}
                >
                  <span className="rounded-full ring-2 ring-[var(--mui-palette-background-paper)]">
                    <UserAvatar
                      name={expert.name}
                      size={28}
                    />
                  </span>
                </Tooltip>
              ))}
            </div>
            <span className="text-[12px] text-fg-muted">
              {t('knowledge.escalations.poolNote', { count: experts.length })}
            </span>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border px-[17px] py-4 sm:grid-cols-2 lg:grid-cols-4">
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.queueHint')}
            icon={<TrayIcon size={17} />}
            name={t('knowledge.escalations.metric.queue')}
            tone="info"
            value={<>{stats.total}</>}
          />
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.breachHint', ESCALATION_SLA)}
            icon={<LightningIcon size={17} />}
            name={t('knowledge.escalations.metric.breach')}
            tone={stats.critical ? 'critical' : 'info'}
            value={
              <>
                {stats.critical}
                <small className="ml-1 text-[13px] font-normal text-fg-muted">/ {stats.total}</small>
              </>
            }
          />
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.longestHint')}
            icon={<ClockIcon size={17} />}
            name={t('knowledge.escalations.metric.longest')}
            tone="info"
            value={stats.total ? <Duration hours={stats.longestHours} /> : <>—</>}
          />
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.averageHint', ESCALATION_SLA)}
            icon={<ChartLineUpIcon size={17} />}
            name={t('knowledge.escalations.metric.average')}
            tone="info"
            value={stats.total ? <Duration hours={stats.averageHours} /> : <>—</>}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-[17px] py-3.5">
          <div
            aria-label={t('knowledge.escalations.distribution', {
              critical: stats.critical,
              normal: stats.onTime,
              warning: stats.warning
            })}
            className="flex h-2 gap-1 overflow-hidden rounded-full"
            role="img"
          >
            {stats.total ? (
              segments
                .filter(segment => segment.count)
                .map(segment => (
                  <span
                    className={`${segment.className} rounded-full`}
                    key={segment.label}
                    style={{ flex: segment.count }}
                  />
                ))
            ) : (
              <span className="flex-1 rounded-full bg-fg-muted/15" />
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-fg-muted">
            {segments.map(segment => (
              <span
                className="inline-flex items-center gap-1.5"
                key={segment.label}
              >
                <i className={`inline-block h-2 w-2 rounded-full ${segment.className}`} />
                <b className="font-semibold text-fg">{segment.count}</b>
                {segment.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(index => (
            <Skeleton
              height={230}
              key={index}
              variant="rounded"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <section className="rounded-bubble border border-border bg-surface p-8 text-center shadow-card">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success-strong dark:text-success-light">
            <CheckCircleIcon size={26} />
          </span>
          <h2 className="mt-3 text-xl font-semibold">{t('knowledge.escalations.empty.title')}</h2>
          <p className="mx-auto mt-1.5 max-w-[54ch] text-[13.5px] text-fg-muted">
            {t('knowledge.escalations.empty.description')}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <MigrationLink href={paths.knowledgeQuestions}>
              {ready => (
                <Button
                  className="normal-case"
                  component="span"
                  disabled={!ready}
                  startIcon={<FileIcon />}
                  variant="outlined"
                >
                  {t('knowledge.escalations.empty.toQuestions')}
                </Button>
              )}
            </MigrationLink>
            <MigrationLink href={paths.knowledgeMetrics}>
              {ready => (
                <Button
                  className="normal-case"
                  component="span"
                  disabled={!ready}
                  startIcon={<ChartLineUpIcon />}
                  variant="outlined"
                >
                  {t('knowledge.escalations.empty.toMetrics')}
                </Button>
              )}
            </MigrationLink>
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {t('knowledge.escalations.queueKicker')}
              </span>
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t('knowledge.escalations.queueTitle')}</h2>
            </div>
            <small className="text-[12.5px] text-fg-muted">
              {readOnly ? t('knowledge.escalations.queueHintReadOnly') : t('knowledge.escalations.queueHint')}
            </small>
          </div>

          <div
            aria-label={t('knowledge.escalations.queueTitle')}
            className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3"
            onKeyDown={handleGridKeyDown}
            ref={gridRef}
            role="list"
          >
            {items.map(item => (
              <div
                data-item={item.id}
                key={item.id}
                role="listitem"
              >
                <EscalationCard
                  hasDraft={Boolean((drafts[item.id] ?? '').trim())}
                  item={item}
                  nowMs={nowMs}
                  onOpen={() => openDialog(item.id)}
                  readOnly={readOnly}
                  tags={tags}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <EscalationAnswerDialog
        busy={busy}
        currentUser={user}
        draft={selected ? (drafts[selected.id] ?? '') : ''}
        item={selected}
        nowMs={nowMs}
        onClose={closeDialog}
        onDraftChange={value => selected && setDraft(selected.id, value)}
        onSubmit={handleSubmit}
        open={dialogOpen}
        readOnly={readOnly}
        tags={tags}
        users={users}
      />

      <ArticleFromAnswerDialog
        busy={busy}
        onClose={() => setPendingArticle(null)}
        onSubmit={handleCreateArticle}
        open={Boolean(pendingArticle)}
        source={pendingArticle}
      />
    </div>
  );
}

/* ═══ Pano metriği ═══════════════════════════════════════════════════════ */

/** Tam sınıf adları — dinamik kurulan adları Tailwind göremez. */
const METRIC_TONES = {
  info: 'bg-info/15 text-info-strong dark:text-info-light',
  critical: 'bg-error/15 text-error-strong dark:text-error-light'
} as const;

function ConsoleMetric({
  icon,
  name,
  value,
  hint,
  tone
}: {
  icon: React.ReactNode;
  name: string;
  value: React.ReactNode;
  hint: string;
  tone: keyof typeof METRIC_TONES;
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[13px] border border-border bg-surface-1 p-3">
      <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] ${METRIC_TONES[tone]}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[12px] font-semibold text-fg-muted">{name}</span>
        <span className="mt-0.5 text-[22px] font-semibold leading-tight tracking-[-0.03em]">{value}</span>
        <small className="mt-0.5 text-[11.5px] leading-snug text-fg-muted">{hint}</small>
      </span>
    </div>
  );
}
