'use client';

import * as React from 'react';

import Avatar from '@mui/material/Avatar';

import { getInitials } from 'src/utils/get-initials';

/**
 * Kişi avatarı. Prototip burada bir görsel sprite kullanıyordu (`assets/avatars`);
 * gerçek kullanıcı kümesi sabit olmadığı için baş harflere geçildi — her isimde
 * çalışır ve yeni kullanıcı geldiğinde eksik görsel sorunu doğmaz.
 */
export function UserAvatar({ name, size = 36 }: { name?: string | null; size?: number }): React.JSX.Element {
  return (
    <Avatar
      className="bg-primary/15 font-semibold text-primary-strong dark:text-primary-light"
      sx={{ fontSize: size * 0.38, height: size, width: size }}
    >
      {getInitials(name ?? '?')}
    </Avatar>
  );
}
