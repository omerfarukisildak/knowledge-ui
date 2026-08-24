import { config } from 'src/config';
import type { Settings } from 'src/types/settings';

export function applyDefaultSettings(settings: Partial<Settings>): Settings {
  return {
    primaryColor: config.site.primaryColor,
    direction: 'ltr',
    navColor: 'discrete',
    ...settings
  };
}
