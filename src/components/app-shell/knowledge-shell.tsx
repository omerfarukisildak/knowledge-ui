'use client';

import * as React from 'react';
import { useMemo } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import GlobalStyles from '@mui/material/GlobalStyles';

import type { ShellActionLink, ShellBranding, ShellNavGroup, ShellNavItem } from '@datassist/ui-shell-next';
import { AppShellLayout } from '@datassist/ui-shell-next';
import { useTranslation } from 'react-i18next';

import { getFirstAllowedModuleEntry, moduleNavItems } from 'src/components/app-shell/module-registry';
import { icons } from 'src/components/layout/nav-icons';
import { LOGO_SHELL_COMPACT_BOX, LOGO_SHELL_FOOTER_BOX, LOGO_SHELL_SIDEBAR_BOX, Logo } from 'src/components/logo';
import { config } from 'src/config';
import type { ModuleKey } from 'src/contexts/module-context';
import { useModuleContext } from 'src/hooks/use-module-context';
import { paths } from 'src/paths';
import type { NavItemConfig } from 'src/types/nav';

import { HeaderActions } from './header-actions';

export interface KnowledgeShellProps {
  children: React.ReactNode;
}

export function KnowledgeShell({ children }: KnowledgeShellProps): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { hasModulePermission, permissions } = useModuleContext();

  const queryString = searchParams.toString();
  const currentPathname = queryString ? `${pathname}?${queryString}` : pathname;

  const groups = useMemo(() => buildShellGroups(moduleNavItems, hasModulePermission, t), [hasModulePermission, t]);
  const shellMode = groups.length > 1 ? 'multi-module' : 'single-module';
  const homeHref = getFirstAllowedModuleEntry(permissions) ?? paths.knowledge;

  const branding = useMemo<ShellBranding>(
    () => ({
      compactLogo: <Logo {...LOGO_SHELL_COMPACT_BOX} />,
      footerLogo: <Logo {...LOGO_SHELL_FOOTER_BOX} />,
      fullLogo: <Logo {...LOGO_SHELL_SIDEBAR_BOX} />,
      homeHref,
      moduleBadge: config.site.shortName
    }),
    [homeHref]
  );

  const galleryUrl = process.env.NEXT_PUBLIC_GALLERY_URL ?? paths.index;
  const galleryLink = useMemo<ShellActionLink>(
    () => ({
      external: galleryUrl.startsWith('http'),
      href: galleryUrl,
      key: 'gallery',
      label: t('appGallery')
    }),
    [galleryUrl, t]
  );

  return (
    <AppShellLayout
      branding={branding}
      currentPathname={currentPathname}
      groups={groups}
      headerRightSlot={<HeaderActions />}
      helpConfig={{ galleryLink }}
      mode={shellMode}
      selectors={[]}
      storageKey="knowledge-shell-collapsed"
    >
      <GlobalStyles
        styles={{
          ':root': {
            '--Content-margin': '0 auto',
            '--Content-maxWidth': 'var(--maxWidth-xl)',
            '--Content-padding': 0,
            '--Content-width': '100%',
            '--shell-compact-logo-size': '44px',
            // Keep shell badge + nav active state on theme primary (MUI is source of truth)
            '--color-primary': 'var(--mui-palette-primary-main)',
            '--color-primary-hover': 'var(--mui-palette-primary-dark)'
          },
          // Edge border on shell (survives zoom); aside fills height so footer stays pinned at bottom
          '.sidebar-shell': {
            borderRight: '1px solid var(--color-border)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          },
          '.sidebar-shell > aside.sidebar': {
            borderRight: 'none !important',
            flex: '1 1 auto',
            height: '100%',
            maxHeight: '100%',
            minHeight: '0'
          },
          '.sidebar .sidebar__nav-stack': {
            flex: '1 1 auto',
            minHeight: '0'
          },
          '.sidebar .sidebar__footer': {
            flexShrink: 0,
            marginTop: 'auto !important'
          },
          // Active nav: same colour as the module badge, with contrast text
          '.sidebar__nav .nav-item--active, .sidebar__nav .nav-item--active:hover': {
            backgroundColor: 'var(--color-primary) !important',
            color: 'var(--mui-palette-primary-contrastText) !important'
          },
          '.sidebar__nav .nav-item--active .nav-item__icon, .sidebar__nav .nav-item--active .nav-item__icon svg': {
            color: 'var(--mui-palette-primary-contrastText) !important'
          },
          '.MuiDrawer-root .sidebar__nav .nav-item--active, .MuiDrawer-root .sidebar__nav .nav-item--active:hover': {
            backgroundColor: 'var(--color-primary) !important',
            color: 'var(--mui-palette-primary-contrastText) !important'
          },
          '.MuiDrawer-root .app a, .MuiDrawer-root .nav-item, .MuiDrawer-root .sidebar-footer__link': {
            textDecoration: 'none !important'
          },
          // Map the shell's own CSS variables onto the MUI dark colour scheme
          '[data-mui-color-scheme="dark"]': {
            '--color-primary': 'var(--mui-palette-primary-main)',
            '--color-primary-hover': 'var(--mui-palette-primary-dark)',
            '--color-text': 'var(--mui-palette-text-primary)',
            '--color-muted': 'var(--mui-palette-text-secondary)',
            '--color-border': 'var(--mui-palette-divider)',
            '--color-surface': 'var(--mui-palette-background-default)',
            '--header-eyebrow': 'var(--mui-palette-text-secondary)',
            '--sidebar-bg': 'var(--mui-palette-background-paper)'
          },
          '[data-mui-color-scheme="dark"] .shell, [data-mui-color-scheme="dark"] .main': {
            backgroundColor: 'var(--mui-palette-background-default) !important',
            color: 'var(--mui-palette-text-primary)'
          },
          '[data-mui-color-scheme="dark"] .sidebar, [data-mui-color-scheme="dark"] .topbar': {
            backgroundColor: 'var(--mui-palette-background-paper) !important'
          },
          '[data-mui-color-scheme="dark"] .sidebar-shell': {
            borderRightColor: 'var(--mui-palette-divider) !important'
          },
          '[data-mui-color-scheme="dark"] .topbar': {
            borderBottomColor: 'var(--mui-palette-divider) !important'
          },
          '[data-mui-color-scheme="dark"] .sidebar__section, [data-mui-color-scheme="dark"] .nav-group__title, [data-mui-color-scheme="dark"] .nav-group__chev, [data-mui-color-scheme="dark"] .sidebar-footer__link':
            {
              color: 'var(--mui-palette-text-secondary) !important'
            },
          '[data-mui-color-scheme="dark"] .sidebar__nav .nav-item, [data-mui-color-scheme="dark"] .sidebar__nav .nav-item:visited, [data-mui-color-scheme="dark"] .sidebar__nav .nav-item:active':
            {
              color: 'var(--mui-palette-text-secondary) !important'
            },
          '[data-mui-color-scheme="dark"] .sidebar__nav .nav-item--active, [data-mui-color-scheme="dark"] .sidebar__nav .nav-item--active:hover':
            {
              backgroundColor: 'var(--mui-palette-primary-main) !important',
              color: 'var(--mui-palette-primary-contrastText) !important'
            },
          '[data-mui-color-scheme="dark"] .nav-item:hover:not(.nav-item--active), [data-mui-color-scheme="dark"] .nav-group__toggle:hover, [data-mui-color-scheme="dark"] .sidebar-toggle:hover':
            {
              backgroundColor: 'var(--mui-palette-action-hover) !important',
              color: 'var(--mui-palette-text-primary) !important'
            },
          '[data-mui-color-scheme="dark"] .sidebar__footer': {
            borderTopColor: 'var(--mui-palette-divider) !important'
          },
          '[data-mui-color-scheme="dark"] .app-footer': {
            backgroundColor: 'var(--mui-palette-background-level1) !important',
            borderTopColor: 'var(--mui-palette-divider) !important',
            color: 'var(--mui-palette-text-secondary)'
          },
          '[data-mui-color-scheme="dark"] .app-footer__nav, [data-mui-color-scheme="dark"] .app-footer__link': {
            color: 'var(--mui-palette-text-secondary) !important'
          },
          '[data-mui-color-scheme="dark"] .app-footer__link:hover': {
            color: 'var(--mui-palette-primary-main) !important'
          },
          '[data-mui-color-scheme="dark"] .lang-btn': {
            backgroundColor: 'var(--mui-palette-action-hover) !important'
          },
          '[data-mui-color-scheme="dark"] .avatar': {
            backgroundColor: 'var(--mui-palette-background-level2) !important',
            borderColor: 'var(--mui-palette-divider) !important'
          },
          // Logo sizing inside the sidebar (full vs collapsed)
          '.sidebar-logo--full img, .sidebar-logo--full svg': {
            height: 'auto !important',
            maxHeight: 40,
            maxWidth: '168px !important',
            objectFit: 'contain',
            objectPosition: 'left center',
            width: 'auto !important'
          },
          '.sidebar.is-collapsed .sidebar__top': {
            marginInlineEnd: 0,
            maxWidth: '100%',
            overflow: 'hidden'
          },
          '.sidebar.is-collapsed .sidebar-logo--full': {
            display: 'none !important'
          },
          '.sidebar.is-collapsed .sidebar-logo--compact img, .sidebar.is-collapsed .sidebar-logo--compact svg': {
            height: 'var(--shell-compact-logo-size) !important',
            maxHeight: 'var(--shell-compact-logo-size) !important',
            maxWidth: 'var(--shell-compact-logo-size) !important',
            width: 'var(--shell-compact-logo-size) !important'
          },
          '.topbar__spacer': {
            display: 'none !important'
          },
          '.topbar__actions': {
            flex: '1 1 auto !important',
            justifyContent: 'stretch !important',
            minWidth: '0 !important',
            width: '100% !important'
          },
          '.topbar__actions > *': {
            width: '100%'
          }
        }}
      />
      {children}
    </AppShellLayout>
  );
}

function buildShellGroups(
  navItems: NavItemConfig[],
  hasModulePermission: (module: ModuleKey) => boolean,
  translate: (key: string) => string
): ShellNavGroup[] {
  return navItems.reduce<ShellNavGroup[]>((groups, item) => {
    if (!canShowNavItem(item, hasModulePermission)) {
      return groups;
    }

    const items = buildShellItems(item.items ?? [], hasModulePermission, translate);

    if (items.length === 0) {
      return groups;
    }

    groups.push({
      icon: renderIcon(item.icon),
      items,
      key: item.key,
      title: item.title ? translate(item.title) : ''
    });

    return groups;
  }, []);
}

function buildShellItems(
  navItems: NavItemConfig[],
  hasModulePermission: (module: ModuleKey) => boolean,
  translate: (key: string) => string
): ShellNavItem[] {
  return navItems.reduce<ShellNavItem[]>((items, item) => {
    if (!canShowNavItem(item, hasModulePermission)) {
      return items;
    }

    const childItems = item.items ? buildShellItems(item.items, hasModulePermission, translate) : undefined;

    if (item.items && childItems?.length === 0 && !item.href) {
      return items;
    }

    items.push({
      badge: item.label,
      external: item.external,
      href: item.href,
      icon: renderIcon(item.icon),
      items: childItems,
      key: item.key,
      matcher: item.matcher,
      title: item.title ? translate(item.title) : ''
    });

    return items;
  }, []);
}

function canShowNavItem(item: NavItemConfig, hasModulePermission: (module: ModuleKey) => boolean): boolean {
  return !(item.module && !hasModulePermission(item.module));
}

function renderIcon(iconKey?: string): React.ReactNode {
  if (!iconKey) {
    return undefined;
  }

  const Icon = icons[iconKey];

  if (!Icon) {
    return undefined;
  }

  return <Icon />;
}
