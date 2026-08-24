import { extendTheme } from '@mui/material/styles';

import { colorSchemes } from './color-schemes';
import { components } from './components/components';
import type { Direction, PrimaryColor, Theme } from './types';
import { typography } from './typography';

interface Config {
  primaryColor: PrimaryColor;
  direction?: Direction;
}

export function createTheme(config: Config): Theme {
  const theme = extendTheme({
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1440 } },
    colorSchemeSelector: 'data-mui-color-scheme',
    colorSchemes: colorSchemes({ primaryColor: config.primaryColor }),
    components,
    direction: config.direction,
    shape: { borderRadius: 8 },
    typography
  });

  return theme;
}
