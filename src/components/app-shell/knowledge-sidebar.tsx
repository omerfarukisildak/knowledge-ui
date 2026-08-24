'use client';

import * as React from 'react';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { CaretUpDown as CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';
import { useTranslation } from 'react-i18next';

import { icons } from 'src/components/layout/nav-icons';
import { UserPopover } from 'src/components/layout/user-popover/user-popover';
import { useAuthContext } from 'src/hooks/use-auth-context';
import { usePopover } from 'src/hooks/use-popover';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { visibleNavGroups } from 'src/modules/knowledge/navigation';
import { paths } from 'src/paths';
import { getInitials } from 'src/utils/get-initials';

/**
 * Bilgi Bankası sidebar'ı — prototipin `app-shell.js → sidebarHTML()` karşılığı.
 *
 * Koyu lacivert panel HER İKİ TEMADA da koyu kalır: uygulamanın görsel kimliği
 * burada duruyor ve açık temada beyaza dönmesi referans tasarımı bozuyor. Bu
 * yüzden renkler MUI paletinden değil `--kb-sidebar-*` token'larından geliyor.
 *
 * Menü yapısı `src/modules/knowledge/navigation.ts`'ten gelir; rol filtresi ve
 * "bu ekran taşındı mı" kararı orada.
 */

export interface KnowledgeSidebarProps {
  /** Mobil çekmecede kapatma davranışı için; masaüstünde verilmez. */
  onNavigate?: () => void;
}

export function KnowledgeSidebar({ onNavigate }: KnowledgeSidebarProps): React.JSX.Element {
  const { t } = useTranslation();
  const { role, user } = useKnowledgeRole();
  const { token } = useAuthContext();
  const popover = usePopover<HTMLButtonElement>();

  const groups = visibleNavGroups(role);
  const activePath = usePathname() ?? '';

  const sessionName = [token?.first_name, token?.last_name].filter(Boolean).join(' ') || user?.name || '';
  const roleLabel = role ? t(`knowledge.role.${role}`) : '';

  return (
    <aside className="flex h-full w-sidebar shrink-0 flex-col bg-sidebar text-sidebar-fg">
      {/* Logo — prototipte 132px genişlik, altında uygulama adı */}
      <div className="shrink-0 px-[18px] pt-[22px]">
        <NextLink
          aria-label={t('knowledge.module')}
          className="block"
          href={paths.knowledgeDasi}
          onClick={onNavigate}
        >
          <img
            alt={t('knowledge.module')}
            className="block h-auto w-[132px] object-contain"
            src="/assets/knowledge-sidebar-logo.png"
          />
        </NextLink>
        <div className="mt-[7px] text-[11px] font-medium tracking-wide text-sidebar-fg-mute">
          {t('knowledge.module')}
        </div>
      </div>

      {/*
        Sidebar KAYDIRILMAZ: admin rolünde 15 madde + 4 başlık var ve alçak
        ekranlarda taşıyor. Prototip dikey yoğunluğu ekran yüksekliğine göre
        kademeli sıkıştırıyor; burada aynı davranış `overflow-y-auto` ile
        güvenceye alındı — menüde kaydırma sabit navigasyondan beklenen his
        değil ama içeriğin kesilmesi daha kötü.
      */}
      <nav
        aria-label={t('knowledge.module')}
        className="min-h-0 flex-1 overflow-y-auto pb-2 pt-[30px]"
      >
        {groups.map((group, groupIndex) => (
          <div
            className={groupIndex > 0 ? 'mt-[22px]' : ''}
            key={group.key}
          >
            <div className="px-[18px] pb-2 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-sidebar-fg-mute">
              {t(group.title)}
            </div>
            {group.items.map(item => {
              const Icon = icons[item.icon];
              const isActive =
                activePath === item.href || (item.href !== paths.knowledge && activePath.startsWith(`${item.href}/`));

              return (
                <NextLink
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'relative mx-2.5 my-px flex h-[38px] items-center gap-[11px] rounded-lg px-2 text-[13.5px] no-underline transition-colors',
                    isActive
                      ? 'bg-sidebar-active font-semibold text-sidebar-fg'
                      : 'text-sidebar-fg-soft hover:bg-sidebar-hover hover:text-sidebar-fg'
                  ].join(' ')}
                  href={item.href}
                  key={item.key}
                  onClick={onNavigate}
                >
                  {/* Aktif maddenin sol kenarındaki ince mavi çubuk */}
                  {isActive ? (
                    <span className="absolute -left-1 bottom-[9px] top-[9px] w-0.5 rounded-sm bg-sidebar-edge" />
                  ) : null}
                  {Icon ? (
                    <Icon
                      className={isActive ? '' : 'opacity-85'}
                      size={18}
                    />
                  ) : null}
                  <span className="flex-1 truncate">{t(item.title)}</span>
                </NextLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Kullanıcı kartı — prototipte role değiştirici, burada oturum menüsü */}
      <div className="shrink-0 border-t border-sidebar-divider p-2.5">
        <button
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-[7px] text-left transition-colors hover:bg-sidebar-hover"
          onClick={popover.handleOpen}
          ref={popover.anchorRef}
          title={sessionName}
          type="button"
        >
          <span className="relative grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-sidebar-avatar text-[11.5px] font-semibold text-sidebar-fg">
            {getInitials(sessionName || '?')}
            <span className="absolute -bottom-px -right-px h-[9px] w-[9px] rounded-full border-2 border-sidebar bg-online" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-sidebar-fg">{sessionName}</span>
            <span className="block text-[11.5px] text-sidebar-fg-mute">{roleLabel}</span>
          </span>
          <CaretUpDownIcon
            className="text-sidebar-fg-mute"
            size={16}
          />
        </button>
        <UserPopover
          anchorEl={popover.anchorRef.current}
          onClose={popover.handleClose}
          open={popover.open}
        />
      </div>
    </aside>
  );
}
