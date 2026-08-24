'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';

import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { TagChip } from 'src/modules/knowledge/components/common/tag-chip';
import type { CompanyListItem, Tag } from 'src/modules/knowledge/types';

/**
 * Şirket ve etiket seçiciler modal kipinde: bu listeler zamanla yüzlerce kayda
 * çıkacak, tetiğin altına açılan bir panel o boyutta kullanılmaz. Kaynak tercihi
 * ise 4 sabit seçenek — onun için modal fazla ağır kaçar, menü olarak duruyor.
 */

function DialogHeader({ title, onClose }: { title: string; onClose: () => void }): React.JSX.Element {
  return (
    <DialogTitle className="flex items-center justify-between gap-4 pb-3">
      {title}
      <IconButton
        aria-label={title}
        onClick={onClose}
        size="small"
      >
        <XIcon />
      </IconButton>
    </DialogTitle>
  );
}

function SearchField({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}): React.JSX.Element {
  return (
    <TextField
      autoFocus
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <MagnifyingGlassIcon />
          </InputAdornment>
        )
      }}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      size="small"
      value={value}
    />
  );
}

/* ═══ Şirket seçici — tek seçim ══════════════════════════════════════════ */

export function CompanyPickerDialog({
  open,
  companies,
  selectedId,
  onSelect,
  onClose
}: {
  open: boolean;
  companies: CompanyListItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');

    return companies.filter(company => !needle || company.name.toLocaleLowerCase('tr-TR').includes(needle));
  }, [companies, query]);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogHeader
        onClose={onClose}
        title={t('knowledge.dasi.companyPickerTitle')}
      />
      <DialogContent>
        <SearchField
          onChange={setQuery}
          placeholder={t('knowledge.dasi.companyPickerTitle')}
          value={query}
        />
        <div className="mt-4 flex max-h-[380px] flex-col overflow-y-auto">
          {filtered.map(company => (
            <ListItemButton
              className="rounded-md"
              key={company.id}
              onClick={() => {
                onSelect(company.id === selectedId ? null : company.id);
                onClose();
              }}
              selected={company.id === selectedId}
            >
              <ListItemText primary={company.name} />
              {company.id === selectedId ? <CheckIcon /> : null}
            </ListItemButton>
          ))}
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-fg-muted">{t('knowledge.dasi.tagNoMatch')}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══ Etiket seçici — çoklu seçim ════════════════════════════════════════ */

/**
 * Modal AÇIK KALIR: çoklu seçimde her tıklamada kapanmak akışı bozuyor.
 * Renkler etiketin havuzdaki sırasından türetilir, böylece bir etiket
 * uygulamanın her yerinde aynı renkte görünür.
 */
export function TagPickerDialog({
  open,
  tags,
  selected,
  onToggle,
  onClose
}: {
  open: boolean;
  tags: Tag[];
  selected: Tag[];
  onToggle: (tag: Tag) => void;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');

    return tags.filter(tag => !needle || tag.name.toLocaleLowerCase('tr-TR').includes(needle));
  }, [query, tags]);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
    >
      <DialogHeader
        onClose={onClose}
        title={t('knowledge.dasi.tagPickerTitle')}
      />
      <DialogContent>
        <SearchField
          onChange={setQuery}
          placeholder={t('knowledge.dasi.tagSearch')}
          value={query}
        />
        {selected.length ? (
          <p className="mt-3 text-[13px] text-fg-muted">
            {t('knowledge.dasi.tagSelectedCount', { count: selected.length })}
          </p>
        ) : null}
        {/* Satır arası aralık yatay aralıktan belirgin şekilde büyük: eşit
            olduğunda çipler tek bir blok gibi görünüp okunmuyordu. */}
        <div
          className="mt-4 flex max-h-[min(52vh,380px)] flex-wrap gap-x-2.5 gap-y-3.5 overflow-y-auto"
          role="listbox"
        >
          {filtered.map(tag => (
            <TagChip
              key={tag.id}
              onClick={() => onToggle(tag)}
              pool={tags}
              selected={selected.some(entry => entry.id === tag.id)}
              tag={tag}
            />
          ))}
          {filtered.length === 0 ? (
            <div className="w-full py-8 text-center">
              <p className="font-medium">{t('knowledge.dasi.tagNoMatch')}</p>
              <p className="mt-1 text-[13px] text-fg-muted">{t('knowledge.dasi.tagNoMatchHint')}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
