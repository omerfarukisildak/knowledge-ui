import type { Direction, PrimaryColor } from 'src/styles/theme/types';

export type NavColor = 'discrete';

export interface Settings {
  primaryColor: PrimaryColor;
  direction?: Direction;
  navColor?: NavColor;
}
