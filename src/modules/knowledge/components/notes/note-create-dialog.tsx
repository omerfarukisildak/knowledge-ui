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
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { useTranslation } from 'react-i18next';

import type { CompanyListItem } from 'src/modules/knowledge/types';

/**
 * Operasyon notu ekleme — prototipin `notEkleAc()` karşılığı.
 *
 * Şirket listesi Ç8 ile daraltılmış geliyor: erişimin olmayan şirkete not
 * yazamazsın, o yüzden seçenek olarak da sunulmaz. Kapı servis katmanında da
 * duruyor; buradaki daraltma yalnızca kullanıcıyı reddedilecek bir seçime
 * sokmamak için.
 */
export function NoteCreateDialog({
  open,
  companies,
  busy,
  onClose,
  onSubmit
}: {
  open: boolean;
  /** Yalnızca erişilebilir şirketler. */
  companies: CompanyListItem[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: { companyId: string; text: string }) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [companyId, setCompanyId] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Tek şirketi olan kullanıcıya seçim yaptırmanın anlamı yok.
    setCompanyId(companies.length === 1 ? companies[0].id : '');
    setText('');
    setError(null);
  }, [companies, open]);

  const handleSubmit = () => {
    if (!companyId) {
      setError(t('knowledge.notes.create.pickCompany'));

      return;
    }
    if (!text.trim()) {
      setError(t('knowledge.notes.create.emptyText'));

      return;
    }
    setError(null);
    onSubmit({ companyId, text: text.trim() });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogTitle>{t('knowledge.notes.create.title')}</DialogTitle>
      <DialogContent dividers>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5 rounded-bubble border border-border bg-surface-1 px-3.5 py-3">
            <span className="mt-0.5 shrink-0 text-fg-muted">
              <LockIcon size={15} />
            </span>
            <div className="min-w-0">
              <strong className="block text-[13.5px]">{t('knowledge.notes.create.scopeTitle')}</strong>
              <small className="text-[12.5px] text-fg-muted">{t('knowledge.notes.create.scopeHint')}</small>
            </div>
          </div>

          <TextField
            fullWidth
            label={t('knowledge.notes.create.companyLabel')}
            onChange={event => setCompanyId(event.target.value)}
            select
            size="small"
            value={companyId}
          >
            <MenuItem value="">{t('knowledge.notes.create.companyPlaceholder')}</MenuItem>
            {companies.map(company => (
              <MenuItem
                key={company.id}
                value={company.id}
              >
                {company.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            helperText={t('knowledge.notes.create.textHint')}
            label={t('knowledge.notes.create.textLabel')}
            minRows={5}
            multiline
            onChange={event => setText(event.target.value)}
            placeholder={t('knowledge.notes.create.textPlaceholder')}
            value={text}
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
          {t('knowledge.notes.create.cancel')}
        </Button>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={handleSubmit}
          startIcon={<CheckIcon />}
          variant="contained"
        >
          {t('knowledge.notes.create.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
