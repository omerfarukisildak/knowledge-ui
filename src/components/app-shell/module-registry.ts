import type { ModuleKey, ModulePermissionResponse } from 'src/contexts/module-context';
import { paths } from 'src/paths';
import type { NavItemConfig } from 'src/types/nav';

export interface ModuleNavConfig extends NavItemConfig {
  /** Landing route when the module is the first one the user may access. */
  entryPath: string;
  module: ModuleKey;
  items: NavItemConfig[];
}

// Reorder this list to change the app-wide module priority.
export const MODULE_PRIORITY: ModuleKey[] = ['knowledge'];

export const moduleNavConfig = {
  knowledge: {
    key: 'knowledge',
    title: 'knowledge.module',
    icon: 'bookOpen',
    entryPath: paths.knowledge,
    module: 'knowledge',
    items: [
      {
        key: 'knowledgeOverview',
        title: 'knowledge.overview',
        href: paths.knowledge,
        icon: 'house',
        matcher: { type: 'equals', href: paths.knowledge },
        module: 'knowledge'
      }
    ]
  }
} satisfies Record<ModuleKey, ModuleNavConfig>;

export const moduleNavItems: ModuleNavConfig[] = MODULE_PRIORITY.map(moduleKey => moduleNavConfig[moduleKey]);

export function getFirstAllowedModuleEntry(permissions: ModulePermissionResponse): string | null {
  for (const moduleKey of MODULE_PRIORITY) {
    if (permissions[moduleKey]) {
      return moduleNavConfig[moduleKey].entryPath;
    }
  }

  return null;
}
