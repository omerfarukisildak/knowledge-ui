'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';

import { DownloadSimple as DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { FilePdf as FilePdfIcon } from '@phosphor-icons/react/dist/ssr/FilePdf';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { FileXls as FileXlsIcon } from '@phosphor-icons/react/dist/ssr/FileXls';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { WarningCircle as WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { useTranslation } from 'react-i18next';

import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { documentExtension } from 'src/modules/knowledge/constants';
import type { CreateDocumentInput, KnowledgeDocumentListItem, Tag } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { DocumentUpload, formatBytes } from './document-upload';

/**
 * Dökümanlar görünümü: yükleme alanı (yalnızca Bilgi Uzmanı) + belge listesi.
 *
 * Listenin en önemli işi indeksleme durumunu göstermek: metni çıkarılmamış
 * belge Dasi'nin cevaplarında kaynak olarak ÇIKMAZ (03 §3) ve kullanıcı bunu
 * rozetten görür — sessizce kaybolmaz.
 */

const EXTENSION_ICONS: Record<string, React.ElementType> = {
  pdf: FilePdfIcon,
  xls: FileXlsIcon,
  xlsx: FileXlsIcon
};

export interface DocumentsPanelProps {
  documents: KnowledgeDocumentListItem[];
  tags: Tag[];
  isLoading?: boolean;
  busy?: boolean;
  /** Yükleme/kaldırma yetkisi Bilgi Uzmanı Havuzu'nda (RACI). */
  canManage?: boolean;
  onUpload: (input: CreateDocumentInput & { file: File }) => Promise<boolean>;
  onDelete: (document: KnowledgeDocumentListItem) => void;
  onDownload: (document: KnowledgeDocumentListItem) => void;
}

export function DocumentsPanel({
  documents,
  tags,
  isLoading,
  busy,
  canManage,
  onUpload,
  onDelete,
  onDownload
}: DocumentsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);
  /** Kaldırma geri alınamaz; hangi belgenin silineceği adıyla teyit edilir. */
  const [pendingDelete, setPendingDelete] = useState<KnowledgeDocumentListItem | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded(current => (current === id ? null : id));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {canManage ? (
        <DocumentUpload
          busy={busy}
          onUpload={onUpload}
        />
      ) : (
        <Alert severity="info">{t('knowledge.articles.documents.readOnlyNotice')}</Alert>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map(index => (
            <Skeleton
              height={64}
              key={index}
              variant="rounded"
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          description={t('knowledge.articles.documents.emptyDescription')}
          title={t('knowledge.articles.documents.emptyTitle')}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {documents.map(document => {
            const extension = documentExtension(document.file_name);
            const Icon = EXTENSION_ICONS[extension] ?? FileTextIcon;
            const isOpen = expanded === document.id;

            return (
              <article
                className="overflow-hidden rounded-bubble border border-border bg-surface"
                key={document.id}
              >
                <div className="flex flex-wrap items-start gap-3 px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-fg-muted/10 text-fg-muted">
                    <Icon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="min-w-0 truncate text-[14.5px]">{document.name}</strong>
                      {document.indexed ? null : (
                        // Belgenin cevaplarda çıkmayacağı ekranda görünür olmalı.
                        <Tooltip title={t('knowledge.articles.documents.notIndexedHint')}>
                          <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning-strong dark:text-warning-light">
                            <WarningCircleIcon size={12} />
                            {t('knowledge.articles.documents.notIndexed')}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-fg-muted">
                      <span className="truncate">{document.file_name}</span>
                      <span>{formatBytes(document.size_bytes)}</span>
                      <span>{formatDateTime(document.uploaded_at)}</span>
                      {document.uploader ? (
                        <span className="inline-flex items-center gap-1.5">
                          <UserAvatar
                            name={document.uploader.name}
                            size={18}
                          />
                          {document.uploader.name}
                        </span>
                      ) : null}
                    </div>
                    {document.tags.length ? (
                      <div className="mt-1.5">
                        <TagChips
                          pool={tags}
                          tags={document.tags}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {document.extracted_text ? (
                      <button
                        aria-expanded={isOpen}
                        className="rounded-md px-2 py-1 text-[12.5px] text-primary-strong hover:bg-primary/10 dark:text-primary-light"
                        onClick={() => toggle(document.id)}
                        type="button"
                      >
                        {isOpen
                          ? t('knowledge.articles.documents.hideText')
                          : t('knowledge.articles.documents.showText')}
                      </button>
                    ) : null}

                    {/* Kalıcı depo yok: yalnızca bu oturumda yüklenen dosya indirilebilir. */}
                    <Tooltip
                      title={
                        document.previewable
                          ? t('knowledge.articles.documents.download')
                          : t('knowledge.articles.documents.downloadUnavailable')
                      }
                    >
                      <span>
                        <IconButton
                          aria-label={t('knowledge.articles.documents.download')}
                          disabled={!document.previewable}
                          onClick={() => onDownload(document)}
                          size="small"
                        >
                          <DownloadSimpleIcon size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>

                    {canManage ? (
                      <Tooltip title={t('knowledge.articles.documents.delete')}>
                        <IconButton
                          aria-label={t('knowledge.articles.documents.deleteFor', { name: document.name })}
                          disabled={busy}
                          onClick={() => setPendingDelete(document)}
                          size="small"
                        >
                          <TrashIcon size={16} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </div>
                </div>

                {isOpen && document.extracted_text ? (
                  <div className="border-t border-border bg-surface-1 px-4 py-3">
                    <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      {t('knowledge.articles.documents.extractedText')}
                    </small>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{document.extracted_text}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setPendingDelete(null)}
        open={Boolean(pendingDelete)}
      >
        <DialogTitle>{t('knowledge.articles.documents.confirmDelete.title')}</DialogTitle>
        <DialogContent dividers>
          <p className="text-[13.5px] leading-relaxed">
            {t('knowledge.articles.documents.confirmDelete.body', { name: pendingDelete?.name ?? '' })}
          </p>
        </DialogContent>
        <DialogActions>
          <Button
            className="normal-case"
            disabled={busy}
            onClick={() => setPendingDelete(null)}
          >
            {t('knowledge.articles.documents.confirmDelete.cancel')}
          </Button>
          <Button
            className="normal-case"
            color="error"
            disabled={busy}
            onClick={() => {
              const target = pendingDelete;
              setPendingDelete(null);
              if (target) {
                onDelete(target);
              }
            }}
            startIcon={<TrashIcon />}
            variant="contained"
          >
            {t('knowledge.articles.documents.confirmDelete.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
