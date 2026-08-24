import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { File as FileIcon } from '@phosphor-icons/react/dist/ssr/File';
import { Gear as GearIcon } from '@phosphor-icons/react/dist/ssr/Gear';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

export const icons = {
  bookOpen: BookOpenIcon,
  file: FileIcon,
  gear: GearIcon,
  house: HouseIcon,
  magnifyingGlass: MagnifyingGlassIcon,
  users: UsersIcon
} as Record<string, Icon>;
