'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import Skeleton from '@mui/material/Skeleton';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  getArticles,
  getBulletins,
  getEscalationPool,
  getFlags,
  getQuestions,
  getTags
} from 'src/modules/knowledge/api';
import { SoftChip } from 'src/modules/knowledge/components/common/status-chip';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import type {
  ArticleListItem,
  BulletinListItem,
  EscalationPoolItem,
  FlagListItem,
  QuestionListItem,
  Tag
} from 'src/modules/knowledge/types';
import { paths } from 'src/paths';

import { BulletinCard } from './bulletin-card';
import { MetricCard, type OverviewMetric } from './metric-card';
import { OverviewCard } from './overview-card';
import { PendingCard, type PendingItem } from './pending-card';
import { VerifiedArticlesCard } from './verified-articles-card';

/**
 * Ana Sayfa — rol bazlı günlük çalışma panosu.
 * Prototip karşılığı: `ana-sayfa.html` + `js/pages/ana-sayfa.js`.
 *
 * Kendi verisini üretmez; yalnızca servis katmanındaki mevcut fonksiyonların
 * sonuçlarını bir araya getirir. Rol farkı iki yerde: ikinci metrik kartı ve
 * "Seni bekleyenler" listesi (uzman/admin için havuz + raporlar, diğer roller
 * için kendi soruları + yeni doğrulanan bilgiler).
 */

interface OverviewData {
  myOpenQuestions: QuestionListItem[];
  pool: EscalationPoolItem[];
  flags: FlagListItem[];
  bulletins: BulletinListItem[];
  articles: ArticleListItem[];
  tags: Tag[];
}

export function OverviewScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { user, hasRole, isFetched } = useKnowledgeRole();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isExpertOrAdmin = hasRole('bilgi_uzmani', 'admin');

  useEffect(() => {
    // Rol kapısı okunmadan yükleme yapılmaz: hem "kendi sorularım" hem havuz
    // erişimi kullanıcıya bağlı, erken çağrı yanlış rakam gösterirdi.
    if (!isFetched || !user) {
      return;
    }

    let cancelled = false;

    (async () => {
      const [questions, pool, flags, bulletins, articles, tags] = await Promise.all([
        getQuestions({ asker_id: user.id }),
        isExpertOrAdmin ? getEscalationPool() : Promise.resolve([]),
        isExpertOrAdmin ? getFlags({ status: 'acik' }) : Promise.resolve([]),
        getBulletins(),
        getArticles(),
        getTags()
      ]);

      if (cancelled) {
        return;
      }

      setData({
        myOpenQuestions: questions.filter(question => question.status === 'eskale_edildi'),
        pool,
        flags,
        bulletins,
        articles,
        tags
      });
    })()
      .catch(error => {
        console.error('[knowledge] Ana sayfa yüklenemedi.', error);
        toast.error(t('knowledge.home.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isExpertOrAdmin, isFetched, t, user]);

  /** Bültenin en yeni sayısındaki kayıt sayısı — "bugünün gelişmeleri". */
  const newBulletinCount = useMemo(() => {
    const latest = data?.bulletins[0]?.date;

    return latest ? data!.bulletins.filter(entry => entry.date === latest).length : 0;
  }, [data]);

  const metrics = useMemo<OverviewMetric[]>(() => {
    if (!data) {
      return [];
    }

    return [
      {
        key: 'bulletin',
        icon: 'envelope',
        tone: 'info',
        value: newBulletinCount,
        nameKey: 'knowledge.home.metric.bulletin.name',
        hintKey: 'knowledge.home.metric.bulletin.hint',
        href: paths.knowledgeBulletin
      },
      isExpertOrAdmin
        ? {
            key: 'escalations',
            icon: 'tray',
            tone: 'purple',
            value: data.pool.length,
            nameKey: 'knowledge.home.metric.escalations.name',
            hintKey: 'knowledge.home.metric.escalations.hint',
            href: paths.knowledgeEscalations
          }
        : {
            key: 'verified',
            icon: 'bookOpen',
            tone: 'purple',
            value: data.articles.filter(article => article.verified).length,
            nameKey: 'knowledge.home.metric.verified.name',
            hintKey: 'knowledge.home.metric.verified.hint',
            href: paths.knowledgeArticles
          },
      // V44: doğrulama kuyruğu kaldırıldığı için bu kart kuyruk değil SONUÇ
      // gösteriyor — Bilgi Bankası'ndaki kalıcı kayıt hacmi.
      {
        key: 'articles',
        icon: 'bookOpen',
        tone: 'success',
        value: data.articles.length,
        nameKey: 'knowledge.home.metric.articles.name',
        hintKey: 'knowledge.home.metric.articles.hint',
        href: paths.knowledgeArticles
      },
      {
        key: 'myOpen',
        icon: 'question',
        tone: 'warning',
        value: data.myOpenQuestions.length,
        nameKey: 'knowledge.home.metric.myOpen.name',
        hintKey: 'knowledge.home.metric.myOpen.hint',
        href: paths.knowledgeQuestions
      }
    ];
  }, [data, isExpertOrAdmin, newBulletinCount]);

  const pendingItems = useMemo<PendingItem[]>(() => {
    if (!data) {
      return [];
    }

    if (isExpertOrAdmin) {
      return [
        {
          key: 'pool',
          icon: 'tray',
          tone: 'info',
          value: data.pool.length,
          labelKey: 'knowledge.home.pending.pool',
          href: paths.knowledgeEscalations
        },
        {
          key: 'reported',
          icon: 'bell',
          tone: 'warning',
          value: data.flags.length,
          labelKey: 'knowledge.home.pending.reported',
          href: paths.knowledgeReported
        }
      ];
    }

    return [
      {
        key: 'myQuestions',
        icon: 'question',
        tone: 'info',
        value: data.myOpenQuestions.length,
        labelKey: 'knowledge.home.pending.myQuestions',
        href: paths.knowledgeQuestions
      },
      {
        key: 'newArticles',
        icon: 'bookOpen',
        tone: 'success',
        // Prototipin ölçüsü: solda listelenen "son doğrulananlar" kadarı,
        // en fazla 5 — tüm arşiv değil, bu turda okunacak olan.
        value: Math.min(data.articles.filter(article => article.verified).length, 5),
        labelKey: 'knowledge.home.pending.newArticles',
        href: paths.knowledgeArticles
      }
    ];
  }, [data, isExpertOrAdmin]);

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3.5 px-4 py-4 md:px-8 md:py-6">
        {[0, 1, 2].map(index => (
          <Skeleton
            height={index === 0 ? 260 : 180}
            key={index}
            variant="rounded"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-4 md:px-8 md:py-6">
      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <OverviewCard
            action={
              <SoftChip
                label={t('knowledge.home.todayBadge')}
                tone="info"
              />
            }
            kicker={t('knowledge.home.kicker.daily')}
            title={t('knowledge.home.overviewTitle')}
          >
            <div className="grid gap-2.5 bg-surface-1 p-3.5 dark:bg-canvas sm:grid-cols-2">
              {metrics.map(metric => (
                <MetricCard
                  key={metric.key}
                  metric={metric}
                />
              ))}
            </div>
          </OverviewCard>

          <VerifiedArticlesCard
            articles={data.articles}
            tags={data.tags}
          />
        </div>

        <aside className="grid min-w-0 items-start gap-3.5 md:grid-cols-2 xl:grid-cols-1">
          <BulletinCard
            bulletins={data.bulletins}
            newCount={newBulletinCount}
          />
          <PendingCard items={pendingItems} />
        </aside>
      </div>
    </div>
  );
}
