'use client';

import * as React from 'react';

import CircularProgress from '@mui/material/CircularProgress';

/**
 * Oturum ve modül izni beklenirken gösterilen iskelet.
 *
 * Kabuğun (`knowledge-shell.tsx`) ölçülerini ve koyu sidebar'ını taklit eder:
 * yükleme ekranı açık zeminli bir panel gösterip hemen ardından koyu laciverte
 * atlıyordu, geçiş göze batıyordu.
 */
export interface LoadingNavProps {
  /**
   * `full` — kabuk sağlayıcıları henüz kurulmadığında tüm ekran.
   * `embedded` — gerçek kabuğun içindeki `loading.tsx` için yalnızca gösterge
   * (çift sidebar/başlık çizilmesin).
   */
  variant?: 'full' | 'embedded';
}

export function LoadingNav({ variant = 'full' }: LoadingNavProps): React.JSX.Element {
  if (variant === 'embedded') {
    return (
      <div className="flex min-h-0 w-full flex-1 items-center justify-center py-16">
        <CircularProgress size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-surface-1 dark:bg-canvas">
      <div className="hidden w-sidebar shrink-0 flex-col bg-sidebar px-[18px] pt-[22px] lg:flex">
        <img
          alt=""
          className="block h-auto w-[132px] object-contain opacity-90"
          src="/assets/knowledge-sidebar-logo.png"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-topbar shrink-0 border-b border-border bg-canvas" />
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <CircularProgress size={48} />
        </div>
      </div>
    </div>
  );
}
