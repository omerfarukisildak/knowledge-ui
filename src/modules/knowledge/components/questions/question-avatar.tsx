'use client';

import * as React from 'react';

import { getInitials } from 'src/utils/get-initials';

/**
 * Soru ekranındaki kişi avatarı — prototipin `.ds-kullanici-foto` sprite'ının
 * birebir karşılığı (`assets/avatars/kullanici-avatar-sprite.png`, 4×2 ızgara).
 *
 * Sprite yalnızca tohum kullanıcıları u1–u7 için yüz içerir; 8. göz boştur, o
 * yüzden Merve Aksoy (u8) ve sprite dışı kimlikler (ör. gerçek geliştirici '37')
 * baş harflerle gösterilir — tıpkı prototipteki gibi.
 */

const SPRITE = '/assets/avatars/kullanici-avatar-sprite.png';

/** background-position değerleri: sprite 4 sütun × 2 satır. */
const SPRITE_POSITION: Record<string, string> = {
  u1: '0% 0%',
  u2: '33.333% 0%',
  u3: '66.667% 0%',
  u4: '100% 0%',
  u5: '0% 100%',
  u6: '33.333% 100%',
  u7: '66.667% 100%'
};

export interface QuestionAvatarProps {
  userId?: string | null;
  name?: string | null;
  /** Piksel cinsinden kare boyut. */
  size?: number;
  className?: string;
}

export function QuestionAvatar({ userId, name, size = 32, className = '' }: QuestionAvatarProps): React.JSX.Element {
  const position = userId ? SPRITE_POSITION[userId] : undefined;

  const common: React.CSSProperties = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    boxShadow: 'inset 0 0 0 1px rgba(28,29,27,.06)'
  };

  // Sprite'ta yüzü olan tohum kullanıcı.
  if (position) {
    return (
      <span
        aria-label={`${name ?? 'Kullanıcı'} profil fotoğrafı`}
        className={`inline-block shrink-0 rounded-full bg-[#ececea] bg-no-repeat ${className}`}
        role="img"
        style={{
          ...common,
          backgroundImage: `url('${SPRITE}')`,
          backgroundSize: '400% 200%',
          backgroundPosition: position
        }}
      />
    );
  }

  // Yüzü olmayan kimlik: baş harf rozeti (prototipteki "ME" karşılığı).
  return (
    <span
      aria-label={`${name ?? 'Kullanıcı'} profil fotoğrafı`}
      className={`inline-grid shrink-0 place-items-center rounded-full bg-[#e4e9f8] font-bold uppercase text-[#40529c] ${className}`}
      role="img"
      style={{ ...common, fontSize: Math.round(size * 0.36), letterSpacing: '.01em' }}
    >
      {getInitials(name ?? '?')}
    </span>
  );
}
