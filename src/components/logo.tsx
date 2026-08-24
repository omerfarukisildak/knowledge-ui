'use client';

import * as React from 'react';

/** Default max bounding box for the logo (image keeps intrinsic aspect ratio). */
const DEFAULT_MAX_HEIGHT = 60;
const DEFAULT_MAX_WIDTH = 240;

export interface LogoProps {
  /** Max height (px). Width follows intrinsic aspect ratio unless capped by `width`. */
  height?: number;
  /** Max width (px). */
  width?: number;
  url?: string;
  /** `width` / `height` on `<img>` and aspect ratio; override for square compact marks (Datassist Ürün UI 2). */
  intrinsic?: { height: number; width: number };
  alt?: string;
  objectPosition?: string;
}

/** Kare kompakt logo (44×44). */
export const SIDEBAR_COMPACT_LOGO_URL =
  process.env.NEXT_PUBLIC_SIDEBAR_COMPACT_LOGO_URL ?? '/assets/datassist-logo-compact.png';

/** Natural pixel size of `public/assets/datassist-logo.png` (used to reserve aspect ratio / reduce CLS). */
export const DATASSIST_LOGO_INTRINSIC = { height: 68, width: 400 } as const;

export function Logo({
  height = DEFAULT_MAX_HEIGHT,
  width = DEFAULT_MAX_WIDTH,
  url = '/assets/datassist-logo.png',
  intrinsic = DATASSIST_LOGO_INTRINSIC,
  alt = 'logo',
  objectPosition = 'left center'
}: LogoProps): React.JSX.Element {
  return (
    <img
      key="knowledge-ui-datassist-logo"
      alt={alt}
      decoding="async"
      height={intrinsic.height}
      src={url}
      width={intrinsic.width}
      style={{
        aspectRatio: `${intrinsic.width} / ${intrinsic.height}`,
        display: 'block',
        height: 'auto',
        maxHeight: height,
        maxWidth: width,
        objectFit: 'contain',
        objectPosition,
        width: 'auto'
      }}
    />
  );
}
