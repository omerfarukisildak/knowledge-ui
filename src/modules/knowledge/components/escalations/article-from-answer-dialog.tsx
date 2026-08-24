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

import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { useTranslation } from 'react-i18next';

/**
 * Uzman cevabını kalıcı Bilgi Bankası kaydına çevirme formu (PRD §4.2).
 *
 * V44 onay kademesini kaldırdığı için "genelleştirme" adımı buraya taşındı:
 * şirkete özel bir sorudan gelen kayıt, şirket adı ve kişiye özel detaylardan
 * arındırılmadan Bilgi Bankası'na girmemeli (V25). Bu yüzden alanlar salt okunur
 * bir özet değil, düzenlenebilir bir form.
 */

export interface ArticleFromAnswerDialogProps {
  open: boolean;
  /** Formu dolduran kaynak — soru metni başlığa, cevap metni içeriğe gelir. */
  source: { questionText: string; answerText: string; companyScoped: boolean } | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; content: string }) => void;
}

export function ArticleFromAnswerDialog({
  open,
  source,
  busy,
  onClose,
  onSubmit
}: ArticleFromAnswerDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Form her yeni kayıtta kaynaktan yeniden dolar; önceki cevabın metni kalmaz.
  useEffect(() => {
    if (!open || !source) {
      return;
    }
    setTitle(source.questionText);
    setContent(source.answerText);
    setError(null);
  }, [open, source]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      setError(t('knowledge.escalations.article.required'));

      return;
    }
    setError(null);
    onSubmit({ content: content.trim(), title: title.trim() });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogTitle>{t('knowledge.escalations.article.title')}</DialogTitle>
      <DialogContent dividers>
        <div className="flex flex-col gap-4">
          <Alert severity="info">
            {source?.companyScoped
              ? t('knowledge.escalations.article.companyNotice')
              : t('knowledge.escalations.article.generalNotice')}
          </Alert>

          <TextField
            fullWidth
            label={t('knowledge.escalations.article.titleLabel')}
            onChange={event => setTitle(event.target.value)}
            size="small"
            value={title}
          />
          <TextField
            fullWidth
            label={t('knowledge.escalations.article.contentLabel')}
            maxRows={16}
            minRows={8}
            multiline
            onChange={event => setContent(event.target.value)}
            value={content}
          />

          {error ? <Alert severity="error">{error}</Alert> : null}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={onClose}
        >
          {t('knowledge.escalations.article.later')}
        </Button>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={handleSubmit}
          startIcon={<BookOpenIcon />}
          variant="contained"
        >
          {t('knowledge.escalations.article.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
