'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { PaperPlaneTilt as PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { useTranslation } from 'react-i18next';

import type { FlagListItem } from 'src/modules/knowledge/types';

import { safeSourceUrl } from './flag-meta';

/**
 * İnceleniyor aşamasının karar formu — prototipteki üç modalın birleşimi
 * (`guncelleAc`, `guncellemeNotuAc`, `uzmanYanitiAc`).
 *
 * Üçü de aynı iskeleti paylaşıyordu: gerekçeyi hatırlat, karara özel alanları
 * göster, raporu kapat. Ayrı bileşenlere bölmek aynı formu üç kez yazmak
 * olurdu; fark eden tek şey hangi alanların açık olduğu.
 *
 *   · `update-article`  — hedef KB kaydı: başlık + içerik düzenlenir (05 §6)
 *   · `update-note`     — hedef cevap/soru: buradan düzenlenemez, not bırakılır
 *   · `no-change`       — karar "değişiklik gerekmedi": gerekçe + dayanak kaynağı
 */

export type FlagDecisionMode = 'update-article' | 'update-note' | 'no-change';

export interface FlagDecisionValues {
  title: string;
  content: string;
  description: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface FlagDecisionDialogProps {
  open: boolean;
  mode: FlagDecisionMode;
  flag: FlagListItem | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: FlagDecisionValues) => void;
}

export function FlagDecisionDialog({
  open,
  mode,
  flag,
  busy,
  onClose,
  onSubmit
}: FlagDecisionDialogProps): React.JSX.Element {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Form her açılışta hedeften yeniden dolar; önceki raporun metni kalmaz.
  useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(flag?.target?.title ?? '');
    setContent(flag?.target?.body ?? '');
    setDescription('');
    setSourceTitle('');
    setSourceUrl('');
    setError(null);
  }, [flag, mode, open]);

  const handleSubmit = () => {
    if (mode === 'update-article' && (!title.trim() || !content.trim())) {
      setError(t('knowledge.reported.decision.requiredArticle'));

      return;
    }
    // Not ve gerekçe zorunlu: karar kayıt altına alınmazsa aynı içerik tekrar
    // raporlandığında uzman geçmiş kararı göremez.
    if (mode !== 'update-article' && !description.trim()) {
      setError(
        mode === 'no-change'
          ? t('knowledge.reported.decision.requiredReply')
          : t('knowledge.reported.decision.requiredNote')
      );

      return;
    }
    if (mode === 'no-change' && sourceUrl.trim() && !safeSourceUrl(sourceUrl)) {
      setError(t('knowledge.reported.decision.invalidUrl'));

      return;
    }
    setError(null);
    onSubmit({
      content: content.trim(),
      description: description.trim(),
      sourceTitle: sourceTitle.trim(),
      sourceUrl: sourceUrl.trim(),
      title: title.trim()
    });
  };

  const noticeKey =
    mode === 'update-article'
      ? 'knowledge.reported.decision.articleNotice'
      : mode === 'update-note'
        ? 'knowledge.reported.decision.noteNotice'
        : null;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      scroll="paper"
    >
      <DialogTitle>
        {mode === 'no-change'
          ? t('knowledge.reported.decision.noChangeTitle')
          : t('knowledge.reported.decision.updateTitle')}
      </DialogTitle>
      <DialogContent dividers>
        <div className="flex flex-col gap-4">
          {noticeKey ? <Alert severity="info">{t(noticeKey)}</Alert> : null}

          <div className="rounded-bubble border border-border bg-warning/5 px-3.5 py-2.5">
            <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              {t('knowledge.reported.reasonLabel')}
            </small>
            <p className="mt-0.5 text-[13.5px] leading-relaxed">{flag?.reason}</p>
          </div>

          {mode === 'update-article' ? (
            <>
              <TextField
                fullWidth
                label={t('knowledge.reported.decision.titleLabel')}
                onChange={event => setTitle(event.target.value)}
                size="small"
                value={title}
              />
              <TextField
                fullWidth
                label={t('knowledge.reported.decision.contentLabel')}
                maxRows={16}
                minRows={8}
                multiline
                onChange={event => setContent(event.target.value)}
                value={content}
              />
              <TextField
                fullWidth
                helperText={t('knowledge.reported.decision.noteHelper')}
                label={t('knowledge.reported.decision.noteLabel')}
                onChange={event => setDescription(event.target.value)}
                placeholder={t('knowledge.reported.decision.notePlaceholder')}
                size="small"
                value={description}
              />
            </>
          ) : mode === 'update-note' ? (
            <TextField
              fullWidth
              label={t('knowledge.reported.decision.whatChangedLabel')}
              minRows={5}
              multiline
              onChange={event => setDescription(event.target.value)}
              placeholder={t('knowledge.reported.decision.whatChangedPlaceholder')}
              value={description}
            />
          ) : (
            <>
              <TextField
                fullWidth
                helperText={t('knowledge.reported.decision.replyHelper')}
                label={t('knowledge.reported.decision.replyLabel')}
                minRows={5}
                multiline
                onChange={event => setDescription(event.target.value)}
                placeholder={t('knowledge.reported.decision.replyPlaceholder')}
                value={description}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  fullWidth
                  label={t('knowledge.reported.decision.sourceTitleLabel')}
                  onChange={event => setSourceTitle(event.target.value)}
                  placeholder={t('knowledge.reported.decision.sourceTitlePlaceholder')}
                  size="small"
                  value={sourceTitle}
                />
                <TextField
                  fullWidth
                  label={t('knowledge.reported.decision.sourceUrlLabel')}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://…"
                  size="small"
                  type="url"
                  value={sourceUrl}
                />
              </div>
            </>
          )}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={onClose}
        >
          {t('knowledge.reported.decision.cancel')}
        </Button>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={handleSubmit}
          startIcon={mode === 'no-change' ? <PaperPlaneTiltIcon /> : <CheckIcon />}
          variant="contained"
        >
          {mode === 'no-change'
            ? t('knowledge.reported.decision.submitNoChange')
            : t('knowledge.reported.decision.submitUpdate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
