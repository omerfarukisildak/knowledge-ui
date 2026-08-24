import type { ModuleKey, ModulePermissionResponse } from 'src/contexts/module-context';
import { paths } from 'src/paths';

/**
 * Modül kaydı: hangi modül var, giriş route'u nedir, öncelik sırası ne.
 *
 * Sidebar içeriği burada DEĞİL — her modül kendi menüsünü sağlıyor
 * (`src/modules/knowledge/navigation.ts`) ve kabuk onu okuyor.
 */
export interface ModuleNavConfig {
  key: string;
  /** i18n anahtarı. */
  title: string;
  icon: string;
  /** Kullanıcının erişebildiği ilk modül olduğunda açılacak route. */
  entryPath: string;
  module: ModuleKey;
}

// Bu listenin sırası uygulama genelindeki modül önceliğini belirler.
export const MODULE_PRIORITY: ModuleKey[] = ['knowledge'];

export const moduleNavConfig = {
  knowledge: {
    key: 'knowledge',
    title: 'knowledge.module',
    icon: 'bookOpen',
    entryPath: paths.knowledgeDasi,
    module: 'knowledge'
  }
} satisfies Record<ModuleKey, ModuleNavConfig>;

export function getFirstAllowedModuleEntry(permissions: ModulePermissionResponse): string | null {
  for (const moduleKey of MODULE_PRIORITY) {
    if (permissions[moduleKey]) {
      return moduleNavConfig[moduleKey].entryPath;
    }
  }

  return null;
}
