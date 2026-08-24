'use client';

import * as React from 'react';
import { useCallback, useRef, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';

import { FileArrowUp as FileArrowUpIcon } from '@phosphor-icons/react/dist/ssr/FileArrowUp';
import { UploadSimple as UploadSimpleIcon } from '@phosphor-icons/react/dist/ssr/UploadSimple';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { KB_DOCUMENT_ACCEPT, KB_DOCUMENT_RULES, documentExtension } from 'src/modules/knowledge/constants';
import type { CreateDocumentInput } from 'src/modules/knowledge/types';

/**
 * Belge yükleme alanı — Bilgi Bankası'na döküman ekler.
 *
 * V42'den taşınan iki kural burada da geçerli:
 *   1. Metin çıkarımı yalnızca düz metin türlerinde otomatik. PDF/Word'de metin
 *      alanı uzmana bırakılır; boş bırakılırsa belge yüklenir ama İNDEKSLENMEZ
 *      ve Dasi onu kaynak olarak kullanmaz (03 §3, Vizyon İlke #1). Bu, ekranda
 *      açıkça söylenir — kullanıcı belgenin cevaplarda çıkmayacağını bilir.
 *   2. Kalıcı dosya deposu yok; veri URL'i yalnızca oturum boyunca tutulur.
 */

/** 4 MB üstünde veri URL'i üretilmez — bellekte tutmanın anlamı yok. */
const MAX_INLINE_PREVIEW_BYTES = 4 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readAsText(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

function readAsDataUrl(file: File): Promise<string | undefined> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? '') || undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

interface StagedFile {
  file: File;
  name: string;
  extension: string;
  /** Düz metin türlerinde dosyadan okundu; diğerlerinde uzman girer. */
  text: string;
  autoExtracted: boolean;
}

export function DocumentUpload({
  busy,
  onUpload
}: {
  busy?: boolean;
  onUpload: (input: CreateDocumentInput & { file: File }) => Promise<boolean>;
}): React.JSX.Element {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const maxMb = Math.round(KB_DOCUMENT_RULES.maxBytes / 1024 / 1024);

  const stageFile = useCallback(
    async (file: File) => {
      setError(null);
      const extension = documentExtension(file.name);

      if (!(KB_DOCUMENT_RULES.extensions as readonly string[]).includes(extension)) {
        setError(t('knowledge.articles.documents.upload.badType', { extension }));
        setStaged(null);

        return;
      }
      if (file.size > KB_DOCUMENT_RULES.maxBytes) {
        setError(t('knowledge.articles.documents.upload.tooBig', { max: maxMb, size: formatBytes(file.size) }));
        setStaged(null);

        return;
      }

      const extractable = (KB_DOCUMENT_RULES.textExtractable as readonly string[]).includes(extension);
      setReading(true);
      const text = extractable ? await readAsText(file) : '';
      setReading(false);

      setStaged({ autoExtracted: extractable, extension, file, name: file.name, text: text.trim() });
    },
    [maxMb, t]
  );

  const handleSubmit = useCallback(async () => {
    if (!staged) {
      return;
    }
    // Büyük dosyada veri URL'i üretmiyoruz; önizleme kaybolur, yükleme çalışır.
    const dataUrl = staged.file.size <= MAX_INLINE_PREVIEW_BYTES ? await readAsDataUrl(staged.file) : undefined;

    const ok = await onUpload({
      data_url: dataUrl,
      extracted_text: staged.text || undefined,
      file: staged.file,
      file_name: staged.file.name,
      mime_type: staged.file.type || 'application/octet-stream',
      name: staged.name.trim() || staged.file.name,
      size_bytes: staged.file.size
    });

    if (ok) {
      setStaged(null);
      setError(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [onUpload, staged]);

  return (
    <div className="flex flex-col gap-3">
      {/* Bırakma alanı: tıklamak da dosya seçiciyi açar. */}
      <div
        className={`flex flex-col items-center gap-2 rounded-bubble border-2 border-dashed px-6 py-8 text-center transition ${
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-surface-1'
        }`}
        onDragLeave={event => {
          event.preventDefault();
          setDragging(false);
        }}
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            void stageFile(file);
          }
        }}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary-strong dark:text-primary-light">
          <UploadSimpleIcon size={21} />
        </span>
        <strong className="text-[15px]">{t('knowledge.articles.documents.upload.dropTitle')}</strong>
        <p className="text-[12.5px] text-fg-muted">
          {t('knowledge.articles.documents.upload.dropHint', {
            max: maxMb,
            types: KB_DOCUMENT_RULES.extensions.join(', ')
          })}
        </p>
        <Button
          className="mt-1 normal-case"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          startIcon={<FileArrowUpIcon />}
          variant="outlined"
        >
          {t('knowledge.articles.documents.upload.pick')}
        </Button>
        <input
          accept={KB_DOCUMENT_ACCEPT}
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              void stageFile(file);
            }
          }}
          ref={inputRef}
          type="file"
        />
      </div>

      {reading ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {staged ? (
        <div className="flex flex-col gap-3 rounded-bubble border border-border bg-surface px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="min-w-0 flex-1 truncate text-[13.5px]">{staged.file.name}</strong>
            <span className="text-[12px] text-fg-muted">{formatBytes(staged.file.size)}</span>
            <Button
              className="normal-case"
              disabled={busy}
              onClick={() => {
                setStaged(null);
                if (inputRef.current) {
                  inputRef.current.value = '';
                }
              }}
              size="small"
              startIcon={<XIcon />}
            >
              {t('knowledge.articles.documents.upload.remove')}
            </Button>
          </div>

          <TextField
            fullWidth
            label={t('knowledge.articles.documents.upload.nameLabel')}
            onChange={event => setStaged(current => (current ? { ...current, name: event.target.value } : current))}
            size="small"
            value={staged.name}
          />

          <TextField
            fullWidth
            helperText={
              staged.autoExtracted
                ? t('knowledge.articles.documents.upload.textAuto')
                : t('knowledge.articles.documents.upload.textManual')
            }
            label={t('knowledge.articles.documents.upload.textLabel')}
            maxRows={12}
            minRows={4}
            multiline
            onChange={event => setStaged(current => (current ? { ...current, text: event.target.value } : current))}
            value={staged.text}
          />

          {/* 03 §3: indekslenmeyecek belge, yüklemeden ÖNCE söylenir. */}
          {!staged.text.trim() ? (
            <Alert severity="warning">{t('knowledge.articles.documents.upload.notIndexedWarning')}</Alert>
          ) : null}

          <div className="flex justify-end">
            <Button
              className="normal-case"
              disabled={busy}
              onClick={handleSubmit}
              startIcon={<UploadSimpleIcon />}
              variant="contained"
            >
              {t('knowledge.articles.documents.upload.submit')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { formatBytes };
