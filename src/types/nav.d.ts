import type { ModuleKey } from 'src/contexts/module-context';

export interface NavItemConfig {
  key: string;
  title?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: string;
  href?: string;
  items?: NavItemConfig[];
  module?: ModuleKey;
  // Matcher cannot be a function in order to be able to use it on the server.
  matcher?: { type: 'startsWith' | 'equals'; href: string };
}
