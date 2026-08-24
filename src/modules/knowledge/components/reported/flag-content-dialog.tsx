'use client';

import * as React from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import { Flag as FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import type { FlagListItem } from 'src/modules/knowledge/types';

/**
 * "İçeriği görüntüle" modalı — prototipin `icerikAc()` karşılığı.
 *
 * Uzman kararı vermeden önce raporlanan kaydın kendisini görmek zorunda; rapor
 * gerekçesi ile içerik yan yana durur ki karşılaştırma ekran değiştirmeden
 * yapılabilsin.
 */
export function FlagContentDialog({
  open,
  flag,
  onClose
}: {
  open: boolean;
  flag: FlagListItem | null;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const target = flag?.target ?? null;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      scroll="paper"
    >
      <DialogTitle className="flex items-center justify-between gap-4">
        {t('knowledge.reported.contentDialog.title')}
        <IconButton
          aria-label={t('knowledge.reported.contentDialog.close')}
          onClick={onClose}
          size="small"
        >
          <XIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {flag ? (
          <div className="flex flex-col gap-5">
            <section className="flex gap-2.5 rounded-bubble border border-border bg-warning/5 px-3.5 py-3">
              <span className="mt-0.5 shrink-0 text-warning-strong dark:text-warning-light">
                <FlagIcon size={15} />
              </span>
              <div className="min-w-0">
                <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  {t('knowledge.reported.contentDialog.reasonLabel')}
                </small>
                <p className="mt-0.5 text-[13.5px] leading-relaxed">{flag.reason}</p>
              </div>
            </section>

            <section>
              <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                {t('knowledge.reported.contentDialog.recordLabel')}
              </small>
              {target ? (
                <div className="mt-1.5 rounded-bubble border border-border bg-surface-1 px-4 py-3">
                  <h4 className="text-[15px] font-semibold leading-snug">{target.title}</h4>
                  {target.body ? (
                    <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed">{target.body}</p>
                  ) : null}
                </div>
              ) : (
                // Hedef silinmiş veya birleştirilmiş olabilir; rapor yine kapatılabilir.
                <div className="mt-1.5">
                  <EmptyState title={t('knowledge.reported.contentDialog.missing')} />
                </div>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
