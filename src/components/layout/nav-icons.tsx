import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { ChartBar as ChartBarIcon } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Envelope as EnvelopeIcon } from '@phosphor-icons/react/dist/ssr/Envelope';
import { File as FileIcon } from '@phosphor-icons/react/dist/ssr/File';
import { Gear as GearIcon } from '@phosphor-icons/react/dist/ssr/Gear';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Note as NoteIcon } from '@phosphor-icons/react/dist/ssr/Note';
import { Receipt as ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Sparkle as SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

export const icons = {
  bell: BellIcon,
  bookOpen: BookOpenIcon,
  buildings: BuildingsIcon,
  chartBar: ChartBarIcon,
  envelope: EnvelopeIcon,
  file: FileIcon,
  gear: GearIcon,
  house: HouseIcon,
  magnifyingGlass: MagnifyingGlassIcon,
  note: NoteIcon,
  receipt: ReceiptIcon,
  shieldCheck: ShieldCheckIcon,
  sparkle: SparkleIcon,
  tag: TagIcon,
  tray: TrayIcon,
  users: UsersIcon
} as Record<string, Icon>;
