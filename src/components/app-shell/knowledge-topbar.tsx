'use client';

import * as React from 'react';

import { usePathname } from 'next/navigation';

import IconButton from '@mui/material/IconButton';

import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { useTranslation } from 'react-i18next';

import { HeaderActions } from 'src/components/app-shell/header-actions';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { visibleNavGroups } from 'src/modules/knowledge/navigation';

/**
 * Üst çubuk — prototipin `app-shell.js → topbarHTML()` karşılığı.
 *
 * Solda sayfa adı (prototipte Sorular ve benzeri liste ekranlarında görünür),
 * sağda dil ve oturum aksiyonları. Prototipteki bildirim zili taşınmadı: bildirim
 * akışı (`getFlagBildirimleri`) henüz gelmedi ve prototip de bu ekranlarda zili
 * gizliyordu.
 */
export function KnowledgeTopbar({ onMenuClick }: { onMenuClick: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { role } = useKnowledgeRole();
  const pathname = usePathname() ?? '';

  /** Sayfa adı menü yapısından türetilir; ekranlar kendi başlığını bildirmek zorunda kalmaz. */
  const pageTitle = React.useMemo(() => {
    for (const group of visibleNavGroups(role)) {
      for (const item of group.items) {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
          return t(item.title);
        }
      }
    }

    return '';
  }, [pathname, role, t]);

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-topbar items-center gap-4 border-b border-border bg-canvas px-5 lg:left-sidebar lg:px-[30px]">
      <div className="mr-auto flex min-w-0 items-center gap-3">
        <IconButton
          aria-label={t('knowledge.module')}
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <ListIcon />
        </IconButton>
        <span className="truncate text-[17px] font-semibold">{pageTitle}</span>
      </div>
      <HeaderActions />
    </header>
  );
}
