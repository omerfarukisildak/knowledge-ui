'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { useTranslation } from 'react-i18next';

import { TAG_CATEGORIES, normalizeTagName } from 'src/modules/knowledge/constants';
import type { Tag } from 'src/modules/knowledge/types';

/**
 * Etiket ekle/düzenle — prototipin `ekleAc()` karşılığı (tek form, iki mod).
 *
 * Durum alanı yalnızca DÜZENLEMEDE var: yeni etiket her zaman aktif doğar,
 * pasif doğan bir etiket kimseye görünmezdi.
 *
 * `nameOnly` canlı backend sözleşmesini yansıtır: `LabelCreateRequestDto`
 * yalnızca `label` taşıdığı için kategori ve durum alanları o modda hiç
 * gösterilmez — kaydedilmeyecek bir alanı doldurtmak kullanıcıyı yanıltırdı.
 */
export function TagEditDialog({
  open,
  tag,
  busy,
  nameOnly,
  onClose,
  onSubmit
}: {
  open: boolean;
  /** `null` ise yeni etiket modu. */
  tag: Tag | null;
  busy?: boolean;
  /** Veri kaynağı yalnızca adı saklıyor: kategori/durum alanları gizlenir. */
  nameOnly?: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; category: string; status?: 'aktif' | 'pasif' }) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(TAG_CATEGORIES[0].id);
  const [status, setStatus] = useState<'aktif' | 'pasif'>('aktif');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(tag?.name ?? '');
    setCategory(tag?.category || TAG_CATEGORIES[0].id);
    setStatus(tag?.status ?? 'aktif');
    setError(null);
  }, [open, tag]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(t('knowledge.tags.edit.nameRequired'));

      return;
    }
    setError(null);
    onSubmit({ category, name, ...(tag && !nameOnly ? { status } : {}) });
  };

  /** Kebab-case normalizasyonu mock kaynağa özgü; canlı taksonomi insan-okur. */
  const preview = nameOnly ? '' : normalizeTagName(name);

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
    >
      <DialogTitle>{tag ? t('knowledge.tags.edit.editTitle') : t('knowledge.tags.edit.createTitle')}</DialogTitle>
      <DialogContent dividers>
        <div className="flex flex-col gap-4">
          <TextField
            fullWidth
            /* Normalize edilmiş hâli canlı gösteriyoruz: kullanıcı kaydettikten
               sonra adın neden değiştiğini merak etmesin. */
            helperText={
              preview && preview !== name.trim()
                ? t('knowledge.tags.edit.namePreview', { name: preview })
                : t(nameOnly ? 'knowledge.tags.edit.nameHintLive' : 'knowledge.tags.edit.nameHint')
            }
            label={t('knowledge.tags.edit.nameLabel')}
            onChange={event => setName(event.target.value)}
            placeholder={nameOnly ? 'Kıdem Tazminatı' : 'kidem-tazminati'}
            size="small"
            value={name}
          />

          {nameOnly ? (
            <Alert severity="info">{t('knowledge.tags.edit.nameOnlyNotice')}</Alert>
          ) : (
            <TextField
              fullWidth
              helperText={t('knowledge.tags.edit.categoryHint')}
              label={t('knowledge.tags.edit.categoryLabel')}
              onChange={event => setCategory(event.target.value)}
              select
              size="small"
              value={category}
            >
              {TAG_CATEGORIES.map(entry => (
                <MenuItem
                  key={entry.id}
                  value={entry.id}
                >
                  {t(entry.labelKey)}
                </MenuItem>
              ))}
            </TextField>
          )}

          {tag && !nameOnly ? (
            <TextField
              fullWidth
              label={t('knowledge.tags.edit.statusLabel')}
              onChange={event => setStatus(event.target.value as 'aktif' | 'pasif')}
              select
              size="small"
              value={status}
            >
              <MenuItem value="aktif">{t('knowledge.tags.status.aktif')}</MenuItem>
              <MenuItem value="pasif">{t('knowledge.tags.status.pasif')}</MenuItem>
            </TextField>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={onClose}
        >
          {t('knowledge.tags.edit.cancel')}
        </Button>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={handleSubmit}
          startIcon={<CheckIcon />}
          variant="contained"
        >
          {tag ? t('knowledge.tags.edit.save') : t('knowledge.tags.edit.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
