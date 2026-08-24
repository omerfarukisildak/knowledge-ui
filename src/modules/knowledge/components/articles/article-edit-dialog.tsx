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
import { useTranslation } from 'react-i18next';

import type { ArticleListItem } from 'src/modules/knowledge/types';

/**
 * KB kaydı güncelleme formu — prototipin `duzenleAc()` karşılığı.
 * 05 §6: kaydedilen her değişiklikte önceki sürüm saklanır.
 */
export function ArticleEditDialog({
  open,
  article,
  busy,
  onClose,
  onSubmit
}: {
  open: boolean;
  article: ArticleListItem | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; content: string }) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !article) {
      return;
    }
    setTitle(article.title);
    setContent(article.content);
    setError(null);
  }, [article, open]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      setError(t('knowledge.articles.edit.required'));

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
      scroll="paper"
    >
      <DialogTitle>{t('knowledge.articles.edit.title')}</DialogTitle>
      <DialogContent dividers>
        <div className="flex flex-col gap-4">
          <Alert severity="info">{t('knowledge.articles.edit.notice')}</Alert>
          <TextField
            fullWidth
            label={t('knowledge.articles.edit.titleLabel')}
            onChange={event => setTitle(event.target.value)}
            size="small"
            value={title}
          />
          <TextField
            fullWidth
            label={t('knowledge.articles.edit.contentLabel')}
            maxRows={18}
            minRows={9}
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
          {t('knowledge.articles.edit.cancel')}
        </Button>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={handleSubmit}
          startIcon={<CheckIcon />}
          variant="contained"
        >
          {t('knowledge.articles.edit.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
