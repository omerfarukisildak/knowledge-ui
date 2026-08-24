'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

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
import { QuestionAvatar } from 'src/modules/knowledge/components/questions/question-avatar';
import { ESCALATION_SLA } from 'src/modules/knowledge/constants';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { EscalationPoolItem, KnowledgeUser, Tag } from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

import { ArticleFromAnswerDialog } from './article-from-answer-dialog';
import { Duration } from './duration';
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

    // Kartlardaki etiketler: kayıt etiketi canlı havuzda karşılık bulmuyorsa
    // (backend etiket kimlikleri tohum kimliklerinden farklı) liste dolu görünsün
    // diye havuzdan KOZMETİK 2 etikete tamamlanır — Sorular ekranıyla aynı kural.
    setItems(
      pool.map((item, index) => {
        const existing = (item.tag_id ?? []).filter(id => tagList.some(tag => tag.id === id));
        if (existing.length >= 2 || !tagList.length) {
          return { ...item, tag_id: existing };
        }
        const ids = [...existing];
        for (let offset = 0; ids.length < Math.min(2, tagList.length); offset += 1) {
          const candidate = tagList[(index * 2 + offset) % tagList.length].id;
          if (!ids.includes(candidate)) {
            ids.push(candidate);
          }
        }

        return { ...item, tag_id: ids };
      })
    );
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
    {
      key: 'critical',
      count: stats.critical,
      label: t('knowledge.escalations.legend.critical'),
      range: t('knowledge.escalations.legend.criticalRange', ESCALATION_SLA),
      pill: 'border-[#f4c9c5] bg-[#fff0ed] text-[#d94b3d]',
      dot: 'bg-[#d94b3d]'
    },
    {
      key: 'warning',
      count: stats.warning,
      label: t('knowledge.escalations.legend.warning'),
      range: t('knowledge.escalations.legend.warningRange', ESCALATION_SLA),
      pill: 'border-[#e4d3b5] bg-[#fff5df] text-[#a66b08]',
      dot: 'bg-[#a66b08]'
    },
    {
      key: 'normal',
      count: stats.onTime,
      label: t('knowledge.escalations.legend.normal'),
      range: t('knowledge.escalations.legend.normalRange', ESCALATION_SLA),
      pill: 'border-[#c1dacc] bg-[#eaf7ef] text-[#2f8456]',
      dot: 'bg-[#2f8456]'
    }
  ];

  return (
    <div className="kb-surface mx-auto w-full max-w-[1180px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-4 overflow-hidden rounded-[17px] border border-[#dfe3e7] bg-white shadow-[0_8px_30px_-26px_rgba(26,38,54,0.34),0_1px_2px_rgba(22,31,43,0.03)] dark:border-border dark:bg-surface">
        <div className="flex flex-col gap-4 px-[22px] py-4 lg:flex-row lg:items-center lg:gap-[26px]">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[#667068] dark:text-fg-muted">
              <i className="inline-block h-[7px] w-[7px] rounded-full bg-[#3bbf88] shadow-[0_0_0_3px_#e1f5ec]" />
              {t('knowledge.escalations.kicker')}
            </span>
            <h1 className="mt-1.5 text-[26px] font-bold leading-[1.1] tracking-[-0.028em] text-[#1f2521] dark:text-fg">
              {t('knowledge.escalations.title')}
            </h1>
            <p className="mt-1.5 max-w-[700px] text-[13px] leading-[1.45] text-[#687069] dark:text-fg-muted">
              {t('knowledge.escalations.subtitle')}
            </p>
          </div>

          {/* Havuzun kişiye atanmadığını gösteren tek yüzey. */}
          <div
            className="grid w-full shrink-0 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-[5px] rounded-[13px] border border-[#e2e6eb] bg-[#f8fafc] px-[15px] py-3 lg:w-auto lg:min-w-[245px] dark:border-border dark:bg-surface-1"
            style={{ gridTemplateAreas: '"baslik avatar" "not avatar"' }}
          >
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.075em] text-[#6e7780] dark:text-fg-muted"
              style={{ gridArea: 'baslik' }}
            >
              {t('knowledge.escalations.poolLabel')}
            </span>
            <div
              className="flex items-center self-center"
              style={{ gridArea: 'avatar' }}
            >
              {experts.map((expert, index) => (
                <span
                  className="rounded-full"
                  key={expert.id}
                  style={{ boxShadow: '0 0 0 3px #f8fafc', marginLeft: index ? -9 : 0 }}
                  title={expert.name}
                >
                  <QuestionAvatar
                    name={expert.name}
                    size={33}
                    userId={expert.id}
                  />
                </span>
              ))}
            </div>
            <span
              className="text-[11.5px] text-[#747d76] dark:text-fg-muted"
              style={{ gridArea: 'not' }}
            >
              <b className="font-[650] text-[#2e3530] dark:text-fg">
                {t('knowledge.escalations.poolCount', { count: experts.length })}
              </b>{' '}
              {t('knowledge.escalations.poolSees')}
            </span>
          </div>
        </div>

        {/* Metrik şeridi — hairline bölmeli */}
        <div className="mx-[18px] mb-3 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] bg-[#e5e8ec] lg:grid-cols-4 dark:bg-border">
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.queueHint')}
            icon={<TrayIcon size={16} />}
            name={t('knowledge.escalations.metric.queue')}
            tone="info"
            value={
              <>
                {stats.total}
                <small className="ml-1 text-[11.5px] font-[550] text-[#989d98]">
                  {t('knowledge.escalations.metric.queueUnit')}
                </small>
              </>
            }
          />
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.breachHint', ESCALATION_SLA)}
            icon={<LightningIcon size={16} />}
            name={t('knowledge.escalations.metric.breach')}
            tone={stats.critical ? 'critical' : 'info'}
            value={
              <>
                {stats.critical}
                <small className="ml-1 text-[11.5px] font-[550] text-[#989d98]">/ {stats.total}</small>
              </>
            }
          />
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.longestHint')}
            icon={<ClockIcon size={16} />}
            name={t('knowledge.escalations.metric.longest')}
            tone="info"
            value={stats.total ? <Duration hours={stats.longestHours} /> : <>—</>}
          />
          <ConsoleMetric
            hint={t('knowledge.escalations.metric.averageHint', ESCALATION_SLA)}
            icon={<ChartLineUpIcon size={16} />}
            name={t('knowledge.escalations.metric.average')}
            tone="info"
            value={stats.total ? <Duration hours={stats.averageHours} /> : <>—</>}
          />
        </div>

        {/* Dağılım şeridi — etiketli segment pill'leri + lejant */}
        <div className="flex flex-col gap-[22px] border-t border-[#e7eaed] bg-[#fcfcfb] px-[22px] py-2.5 lg:flex-row lg:items-center dark:border-border dark:bg-surface-1">
          <div
            aria-label={t('knowledge.escalations.distribution', {
              critical: stats.critical,
              normal: stats.onTime,
              warning: stats.warning
            })}
            className="flex h-6 max-w-[480px] flex-1 gap-1"
            role="img"
          >
            {stats.total ? (
              segments
                .filter(segment => segment.count)
                .map(segment => (
                  <span
                    className={`inline-flex min-w-[42px] items-center justify-center gap-1 overflow-hidden rounded-md border font-[tabular-nums] ${segment.pill}`}
                    key={segment.key}
                    style={{ flex: segment.count }}
                  >
                    <b className="text-[11px] font-[760]">{segment.count}</b>
                    <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] font-[650]">
                      {segment.label}
                    </small>
                  </span>
                ))
            ) : (
              <span className="flex-1 rounded-md bg-[#eceeeb]" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {segments.map(segment => (
              <span
                className="inline-flex items-center gap-[7px] text-[11px] text-[#656d66] dark:text-fg-muted"
                key={segment.key}
              >
                <i className={`inline-block h-[7px] w-[7px] rounded-sm ${segment.dot}`} />
                <b className="font-bold text-[#2f3630] dark:text-fg">{segment.count}</b>
                {segment.label} · {segment.range}
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
        <section className="overflow-hidden rounded-[15px] border border-[#e1e4e0] bg-white shadow-[0_1px_2px_rgba(18,18,16,0.025)] dark:border-border dark:bg-surface">
          <header className="flex min-h-[68px] flex-wrap items-center gap-2.5 border-b border-[#eceeeb] bg-[#fafaf9] px-[19px] py-3.5 dark:border-border dark:bg-surface-1">
            <div className="min-w-0">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.09em] text-[#667068] dark:text-fg-muted">
                {t('knowledge.escalations.queueKicker')}
              </span>
              <h2 className="mt-1 text-[15px] font-[650] text-[#303530] dark:text-fg">
                {t('knowledge.escalations.queueTitle')}
              </h2>
            </div>
            <small className="ml-auto text-[11px] text-[#929792] dark:text-fg-muted">
              {readOnly ? t('knowledge.escalations.queueHintReadOnly') : t('knowledge.escalations.queueHint')}
            </small>
          </header>

          <div
            aria-label={t('knowledge.escalations.queueTitle')}
            className="grid gap-3 bg-[#f7f7f5] p-3 md:grid-cols-2 xl:grid-cols-3 dark:bg-canvas"
            onKeyDown={handleGridKeyDown}
            ref={gridRef}
            role="list"
          >
            {items.map(item => (
              <div
                className="flex"
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

/** Tam sınıf adları — dinamik kurulan adları Tailwind göremez (prototip V41). */
const METRIC_TONES = {
  info: 'bg-[#eaf1fb] text-[#3f6fae]',
  critical: 'bg-[#fff0ed] text-[#d94b3d]'
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
    <div className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-2.5 bg-[#f8f9fb] px-3.5 py-2.5 dark:bg-surface-1">
      <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] ${METRIC_TONES[tone]}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.07em] text-[#737b75] dark:text-fg-muted">
          {name}
        </span>
        <span className="mt-[3px] block text-[21px] font-bold leading-[1.05] tracking-[-0.025em] text-[#252b26] dark:text-fg">
          {value}
        </span>
        <small className="mt-[3px] block text-[10px] leading-snug text-[#8a918b] dark:text-fg-muted">{hint}</small>
      </span>
    </div>
  );
}
