'use client';

import * as React from 'react';

import NextLink from 'next/link';

import Tooltip from '@mui/material/Tooltip';

import { useTranslation } from 'react-i18next';

import { isRouteMigrated } from 'src/modules/knowledge/navigation';

/**
 * Taşınma durumuna duyarlı bağlantı (plan §6).
 *
 * Hedef ekran taşındıysa gerçek bir bağlantı, taşınmadıysa "bu ekran henüz
 * taşınmadı" ipucu taşıyan pasif bir kutu üretir — kullanıcı var olmayan bir
 * route'a düşmez. Dasi'nin keşif kartlarında elle yazılan bu kalıp, panoda dört
 * metrik + iki liste daha aynı şeye ihtiyaç duyduğu için buraya taşındı.
 */
export function MigrationLink({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  /** `ready` ile pasif görünümü (soluk zemin, hover yokluğu) çağıran belirler. */
  children: React.ReactNode | ((ready: boolean) => React.ReactNode);
}): React.JSX.Element {
  const { t } = useTranslation();
  const ready = isRouteMigrated(href);
  const content = typeof children === 'function' ? children(ready) : children;

  if (ready) {
    return (
      <NextLink
        className={`no-underline ${className ?? ''}`}
        href={href}
      >
        {content}
      </NextLink>
    );
  }

  return (
    <Tooltip title={t('knowledge.discover.notMigrated')}>
      <div
        aria-disabled
        className={className}
      >
        {content}
      </div>
    </Tooltip>
  );
}
