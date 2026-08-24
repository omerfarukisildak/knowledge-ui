'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { Flag as FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getFlags, updateArticle, updateFlag } from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { FlagListItem } from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

import { FlagCard } from './flag-card';
import { FlagContentDialog } from './flag-content-dialog';
import { FlagDecisionDialog, type FlagDecisionMode, type FlagDecisionValues } from './flag-decision-dialog';
import { FLAG_STATUSES, type FlagStatus } from './flag-meta';

/**
 * Raporlanan İçerikler — prototip karşılığı: `raporlanan.html` + `js/pages/raporlanan.js`.
 *
 * PRD §4.6: rapor, içeriği üreten kişiye değil Bilgi Uzmanı HAVUZUNA döner.
 * PRD §4.8 (V40): Açık → İnceleniyor → Kapandı; kapanışta karar `outcome`'da
 * saklanır. 05 §5: PII/maskeleme gerekçeli raporlar öncelikli sırada.
 * Admin ekranı salt görüntüler (RACI).
 */

/** Filtre sekmeleri: üç durum + "tümü". Boş string = filtre yok. */
type StatusFilter = FlagStatus | '';

export function ReportedScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { hasRole, isFetched, isReadOnly } = useKnowledgeRole();
  const { run } = useAsyncAction();

  const [flags, setFlags] = useState<FlagListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('acik');
  const [busy, setBusy] = useState(false);

  const [contentFlag, setContentFlag] = useState<FlagListItem | null>(null);
  const [decision, setDecision] = useState<{ flag: FlagListItem; mode: FlagDecisionMode } | null>(null);

  const canWork = hasRole('bilgi_uzmani', 'admin');
  const readOnly = isReadOnly(paths.knowledgeReported);

  // `getFlags` bildiren/inceleyen/yanıtlayan kişileri satıra bindiriyor;
  // ayrıca kullanıcı listesi çekmeye gerek yok.
  const loadData = useCallback(async () => {
    setFlags(await getFlags());
  }, []);

  useEffect(() => {
    if (!isFetched || !canWork) {
      if (isFetched) {
        setIsLoading(false);
      }

      return;
    }

    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Rapor listesi yüklenemedi.', error);
        toast.error(t('knowledge.reported.loadFailed'));
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

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(
      FLAG_STATUSES.map(status => [status, flags.filter(flag => flag.status === status).length])
    ) as Record<FlagStatus, number>;

    return { ...byStatus, all: flags.length, active: byStatus.acik + byStatus.inceleniyor };
  }, [flags]);

  const shown = useMemo(() => (filter ? flags.filter(flag => flag.status === filter) : flags), [filter, flags]);

  /** Açık → İnceleniyor. Karar bu aşamada verilir, burada değil. */
  const handleStartReview = useCallback(
    async (flag: FlagListItem) => {
      setBusy(true);
      const result = await run(() => updateFlag(flag.id, { status: 'inceleniyor' }), {
        message: t('knowledge.reported.reviewFailed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      toast.success(t('knowledge.reported.reviewStarted'));
      await loadData().catch(() => undefined);
    },
    [loadData, run, t]
  );

  const handleDecision = useCallback(
    async (values: FlagDecisionValues) => {
      if (!decision) {
        return;
      }
      const { flag, mode } = decision;
      setBusy(true);

      // KB kaydı hedefliyse önce içerik güncellenir: rapor kapandığı hâlde
      // kayıt eski kalırsa aynı içerik tekrar raporlanır.
      if (mode === 'update-article' && flag.target) {
        const updated = await run(
          () => updateArticle(flag.target!.id, { content: values.content, title: values.title }),
          { message: t('knowledge.reported.decision.articleFailed') }
        );
        if (!updated) {
          setBusy(false);

          return;
        }
      }

      const closed = await run(
        () =>
          updateFlag(flag.id, {
            description: values.description,
            outcome: mode === 'no-change' ? 'degisiklik_gerekmedi' : 'guncellendi',
            source_title: values.sourceTitle,
            source_url: values.sourceUrl,
            status: 'kapandi'
          }),
        { message: t('knowledge.reported.decision.closeFailed') }
      );
      setBusy(false);
      if (!closed) {
        return;
      }

      setDecision(null);
      toast.success(
        mode === 'no-change'
          ? t('knowledge.reported.decision.noChangeDone')
          : t('knowledge.reported.decision.updateDone')
      );
      await loadData().catch(() => undefined);
    },
    [decision, loadData, run, t]
  );

  /* ═══ Rol kapısı ═══════════════════════════════════════════════════════ */

  if (isFetched && !canWork) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-4 md:px-8 md:py-6">
        <EmptyState
          description={t('knowledge.reported.noAccessDescription')}
          title={t('knowledge.reported.noAccessTitle')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-5 flex flex-wrap items-center gap-4 rounded-bubble border border-border bg-surface px-[17px] py-4 shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-warning/15 text-warning-strong dark:text-warning-light">
          <FlagIcon size={21} />
        </span>
        {/* Taban genişlik: dar ekranda sayaç yan satırda kalıp metni sıkıştırmasın. */}
        <div className="min-w-[240px] flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            {t('knowledge.reported.kicker')}
          </span>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.reported.title')}</h1>
          <p className="mt-1 max-w-[62ch] text-[13.5px] text-fg-muted">{t('knowledge.reported.subtitle')}</p>
        </div>
        <div className="flex flex-col items-start sm:items-end">
          <strong className="text-[30px] leading-none tracking-[-0.04em]">{counts.active}</strong>
          <span className="text-[12.5px] font-medium">{t('knowledge.reported.activeCount')}</span>
          <small className="text-[11.5px] text-fg-muted">{t('knowledge.reported.activeHint')}</small>
        </div>
      </header>

      {readOnly ? (
        <Alert
          className="mb-4"
          severity="info"
        >
          {t('knowledge.reported.readOnlyNotice')}
        </Alert>
      ) : null}

      <section className="overflow-hidden rounded-bubble border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-[17px] pt-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {t('knowledge.reported.queueKicker')}
            </span>
            <small className="text-[12.5px] text-fg-muted">
              {t('knowledge.reported.shownCount', { count: shown.length })}
            </small>
          </div>
          <Tabs
            onChange={(_event, value: StatusFilter) => setFilter(value)}
            value={filter}
            variant="scrollable"
          >
            {FLAG_STATUSES.map(status => (
              <Tab
                className="min-h-0 normal-case"
                key={status}
                label={`${t(`knowledge.reported.status.${status}`)} · ${counts[status]}`}
                value={status}
              />
            ))}
            <Tab
              className="min-h-0 normal-case"
              label={`${t('knowledge.reported.allTab')} · ${counts.all}`}
              value=""
            />
          </Tabs>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1].map(index => (
                <Skeleton
                  height={200}
                  key={index}
                  variant="rounded"
                />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <EmptyState
              description={
                filter === 'acik'
                  ? t('knowledge.reported.emptyOpenDescription')
                  : t('knowledge.reported.emptyDescription')
              }
              title={filter === 'acik' ? t('knowledge.reported.emptyOpenTitle') : t('knowledge.reported.emptyTitle')}
            />
          ) : (
            <div className="flex flex-col gap-3.5">
              {shown.map(flag => (
                <FlagCard
                  busy={busy}
                  flag={flag}
                  key={flag.id}
                  onNoChange={() => setDecision({ flag, mode: 'no-change' })}
                  onStartReview={() => handleStartReview(flag)}
                  /**
                   * KB kaydı buradan düzenlenebilir; cevap/soru hedeflerinde
                   * içerik başka bir ekranın sahibi olduğu için uzman yalnızca
                   * ne düzelttiğini not bırakır (prototip: `guncellemeNotuAc`).
                   */
                  onUpdate={() =>
                    setDecision({
                      flag,
                      mode: flag.target_kind === 'kb_kaydi' && flag.target ? 'update-article' : 'update-note'
                    })
                  }
                  onViewContent={() => setContentFlag(flag)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <FlagContentDialog
        flag={contentFlag}
        onClose={() => setContentFlag(null)}
        open={Boolean(contentFlag)}
      />

      <FlagDecisionDialog
        busy={busy}
        flag={decision?.flag ?? null}
        mode={decision?.mode ?? 'update-note'}
        onClose={() => setDecision(null)}
        onSubmit={handleDecision}
        open={Boolean(decision)}
      />
    </div>
  );
}
