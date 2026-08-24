import { paths } from 'src/paths';

import type { KnowledgeRole } from './types';

/**
 * Bilgi Bankası sidebar yapısı — prototipin `config.js → SIDEBAR` karşılığı.
 * Kaynak: `Tanıtım/03-veri-modeli-ve-mimari.md` §8 rol filtresi + referans görsel.
 *
 * Kabuk (`src/components/app-shell/knowledge-sidebar.tsx`) bu yapıyı okur; hiçbir
 * ekran kendi menüsünü çizmez.
 */

export interface KnowledgeNavItem {
  key: string;
  /** i18n anahtarı — `knowledge.nav.*` */
  title: string;
  href: string;
  icon: string;
  /** Bu maddeyi görebilen roller (03 §8 + PRD §3 + 06-raci-matrisi). */
  roles: KnowledgeRole[];
  /** Maddeyi görür ama sayfa içinde aksiyon alamaz. */
  readOnlyFor?: KnowledgeRole[];
}

export interface KnowledgeNavGroup {
  key: string;
  /** i18n anahtarı — `knowledge.navGroup.*` */
  title: string;
  items: KnowledgeNavItem[];
}

const ALL_ROLES: KnowledgeRole[] = ['operasyon', 'bilgi_uzmani', 'admin'];
const EXPERT_AND_ADMIN: KnowledgeRole[] = ['bilgi_uzmani', 'admin'];

export const knowledgeNavGroups: KnowledgeNavGroup[] = [
  {
    key: 'main',
    title: 'knowledge.navGroup.main',
    items: [
      {
        key: 'dasi',
        title: 'knowledge.nav.dasi',
        href: paths.knowledgeDasi,
        icon: 'sparkle',
        roles: ALL_ROLES
      },
      {
        key: 'overview',
        title: 'knowledge.nav.overview',
        href: paths.knowledge,
        icon: 'house',
        roles: ALL_ROLES
      },
      {
        key: 'questions',
        title: 'knowledge.nav.questions',
        href: paths.knowledgeQuestions,
        icon: 'file',
        roles: ALL_ROLES
      }
    ]
  },
  {
    key: 'workflow',
    title: 'knowledge.navGroup.workflow',
    items: [
      {
        key: 'escalations',
        title: 'knowledge.nav.escalations',
        href: paths.knowledgeEscalations,
        icon: 'tray',
        roles: EXPERT_AND_ADMIN,
        readOnlyFor: ['admin']
      },
      {
        key: 'reported',
        title: 'knowledge.nav.reported',
        href: paths.knowledgeReported,
        icon: 'bell',
        roles: EXPERT_AND_ADMIN,
        readOnlyFor: ['admin']
      }
    ]
  },
  {
    key: 'library',
    title: 'knowledge.navGroup.library',
    items: [
      {
        key: 'articles',
        title: 'knowledge.nav.articles',
        href: paths.knowledgeArticles,
        icon: 'bookOpen',
        roles: ALL_ROLES,
        readOnlyFor: ['operasyon']
      },
      {
        key: 'companies',
        title: 'knowledge.nav.companies',
        href: paths.knowledgeCompanies,
        icon: 'buildings',
        roles: ALL_ROLES
      },
      {
        key: 'notes',
        title: 'knowledge.nav.notes',
        href: paths.knowledgeNotes,
        icon: 'note',
        roles: ALL_ROLES
      },
      {
        key: 'bulletin',
        title: 'knowledge.nav.bulletin',
        href: paths.knowledgeBulletin,
        icon: 'envelope',
        roles: ALL_ROLES
      },
      {
        key: 'tags',
        title: 'knowledge.nav.tags',
        href: paths.knowledgeTags,
        icon: 'tag',
        roles: EXPERT_AND_ADMIN
      }
    ]
  },
  {
    key: 'administration',
    title: 'knowledge.navGroup.administration',
    items: [
      {
        key: 'users',
        title: 'knowledge.nav.users',
        href: paths.knowledgeUsers,
        icon: 'users',
        roles: ['admin']
      },
      {
        key: 'roles',
        title: 'knowledge.nav.roles',
        href: paths.knowledgeRoles,
        icon: 'shieldCheck',
        roles: ['admin']
      },
      {
        key: 'settings',
        title: 'knowledge.nav.settings',
        href: paths.knowledgeSettings,
        icon: 'gear',
        roles: ['admin']
      },
      {
        key: 'metrics',
        title: 'knowledge.nav.metrics',
        href: paths.knowledgeMetrics,
        icon: 'chartBar',
        roles: ['admin']
      }
    ]
  }
];

/**
 * Prototipten TAŞINMIŞ ekranlar. Taşıma ekran ekran ilerliyor: bir ekran
 * bittiğinde buraya bir satır eklenir, o madde sidebar'da görünür ve ekran içi
 * bağlantıları tıklanabilir hâle gelir. Henüz taşınmamış hedefe link verilmez —
 * kullanıcı var olmayan bir route'a düşmez.
 */
export const MIGRATED_ROUTES: string[] = [
  paths.knowledgeDasi,
  paths.knowledge,
  paths.knowledgeQuestions,
  paths.knowledgeEscalations,
  paths.knowledgeReported,
  paths.knowledgeArticles,
  paths.knowledgeCompanies,
  paths.knowledgeNotes,
  paths.knowledgeBulletin,
  paths.knowledgeTags
];

export function isRouteMigrated(href: string): boolean {
  return MIGRATED_ROUTES.includes(href);
}

/** Rol + taşınma durumu filtresinden geçen sidebar grupları. */
export function visibleNavGroups(role: KnowledgeRole | null): KnowledgeNavGroup[] {
  if (!role) {
    return [];
  }

  return knowledgeNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(role) && isRouteMigrated(item.href))
    }))
    .filter(group => group.items.length > 0);
}

/** Bu rol bu ekranda aksiyon alabilir mi (prototipin `saltOkurMu` karşılığı). */
export function isReadOnlyFor(href: string, role: KnowledgeRole | null): boolean {
  if (!role) {
    return true;
  }

  for (const group of knowledgeNavGroups) {
    const item = group.items.find(entry => entry.href === href);
    if (item) {
      return (item.readOnlyFor ?? []).includes(role);
    }
  }

  return false;
}
