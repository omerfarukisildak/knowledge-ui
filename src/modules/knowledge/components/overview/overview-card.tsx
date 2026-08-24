'use client';

import * as React from 'react';

/**
 * Pano kartının kabuğu — prototipin `.ds-pano-kart` + `.ds-pano-kart-baslik`
 * ikilisi. Üç kart (genel bakış, son doğrulanan bilgiler, bülten, bekleyenler)
 * aynı başlık ritmini paylaşıyor: küçük büyük harfli üst etiket, başlık ve sağda
 * bir aksiyon/rozet.
 */
export function OverviewCard({
  kicker,
  title,
  action,
  /** Bülten kartında başlık altındaki çizgi yok (prototip: `.ds-pano-bulten`). */
  divider = true,
  children
}: {
  kicker: string;
  title: string;
  action?: React.ReactNode;
  divider?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="min-w-0 overflow-hidden rounded-bubble border border-border bg-surface shadow-card">
      <div
        className={`flex min-h-[68px] items-center justify-between gap-4 px-[17px] py-3.5 ${
          divider ? 'border-b border-border' : ''
        }`}
      >
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">{kicker}</span>
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
