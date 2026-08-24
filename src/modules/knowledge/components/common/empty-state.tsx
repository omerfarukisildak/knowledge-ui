'use client';

import * as React from 'react';

/** Prototipin `bosDurum()` yardımcısı: başlık + açıklama + opsiyonel aksiyon. */
export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 rounded-bubble border border-dashed border-border px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {description ? <p className="max-w-md text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
