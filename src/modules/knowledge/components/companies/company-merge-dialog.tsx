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

import { ArrowsMerge as ArrowsMergeIcon } from '@phosphor-icons/react/dist/ssr/ArrowsMerge';
import { useTranslation } from 'react-i18next';

import type { CompanyListItem } from 'src/modules/knowledge/types';

/**
 * Mükerrer şirket birleştirme — prototipin `birlestirAc()` karşılığı.
 * RACI: yalnızca Admin. Ekranın tek geri alınamaz işlemi.
 *
 * Bu yüzden iki aşamalı: önce hedef seçilir, sonra ne olacağı adlarla ve
 * rakamlarla tekrar edilip ayrı bir onay istenir. Tek tıkla silinebilen bir
 * şirket kaydı, yanlış satıra basıldığında geri getirilemez.
 */
export function CompanyMergeDialog({
  open,
  source,
  companies,
  busy,
  onClose,
  onSubmit
}: {
  open: boolean;
  /** Silinecek (kaynak) şirket. */
  source: CompanyListItem | null;
  companies: CompanyListItem[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (targetId: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [targetId, setTargetId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTargetId('');
    setConfirming(false);
    setError(null);
  }, [open, source]);

  const others = companies.filter(company => company.id !== source?.id);
  const target = others.find(company => company.id === targetId) ?? null;

  const handleNext = () => {
    if (!targetId) {
      setError(t('knowledge.companies.merge.pickTarget'));

      return;
    }
    setError(null);
    setConfirming(true);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogTitle>{t('knowledge.companies.merge.title')}</DialogTitle>
      <DialogContent dividers>
        {source ? (
          <div className="flex flex-col gap-4">
            <Alert severity="warning">{t('knowledge.companies.merge.warning')}</Alert>

            {confirming && target ? (
              // İkinci aşama: ne olacağını adlarla tekrar et.
              <div className="rounded-bubble border border-error/40 bg-error/5 px-4 py-3.5">
                <strong className="block text-[15px]">{t('knowledge.companies.merge.confirmTitle')}</strong>
                <p className="mt-1.5 text-[13.5px] leading-relaxed">
                  {t('knowledge.companies.merge.confirmBody', { source: source.name, target: target.name })}
                </p>
                <p className="mt-2 text-[12.5px] text-fg-muted">
                  {t('knowledge.companies.merge.movesSummary', {
                    notes: source.know_how_count,
                    questions: source.question_count
                  })}
                </p>
              </div>
            ) : (
              <>
                <TextField
                  disabled
                  fullWidth
                  helperText={t('knowledge.companies.merge.movesSummary', {
                    notes: source.know_how_count,
                    questions: source.question_count
                  })}
                  label={t('knowledge.companies.merge.sourceLabel')}
                  size="small"
                  value={source.name}
                />
                <TextField
                  fullWidth
                  label={t('knowledge.companies.merge.targetLabel')}
                  onChange={event => setTargetId(event.target.value)}
                  select
                  size="small"
                  value={targetId}
                >
                  <MenuItem value="">{t('knowledge.companies.merge.targetPlaceholder')}</MenuItem>
                  {others.map(company => (
                    <MenuItem
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}
          </div>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          className="normal-case"
          disabled={busy}
          onClick={confirming ? () => setConfirming(false) : onClose}
        >
          {confirming ? t('knowledge.companies.merge.back') : t('knowledge.companies.merge.cancel')}
        </Button>
        <Button
          className="normal-case"
          color="error"
          disabled={busy || (!confirming && !others.length)}
          onClick={confirming ? () => onSubmit(targetId) : handleNext}
          startIcon={<ArrowsMergeIcon />}
          variant="contained"
        >
          {confirming ? t('knowledge.companies.merge.submitConfirm') : t('knowledge.companies.merge.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
