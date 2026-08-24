'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';

import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { PaperPlaneRight as PaperPlaneRightIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneRight';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Sparkle as SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { suggestTags } from 'src/modules/knowledge/api';
import { PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import type { CompanyListItem, CreateQuestionInput, PrivacyClass, Tag } from 'src/modules/knowledge/types';

import { CompanyPickerDialog, TagPickerDialog } from './picker-dialogs';

/**
 * Soru kutusu — referans görseldeki giriş alanının karşılığı.
 *
 * Kendi state'ini taşır ve gönderimde tek bir payload verir; ekran bileşeni
 * alan alan takip etmek zorunda kalmaz. Gönderim anında kutu ve öneri satırı
 * TEMİZLENİR (cevap geldiğinde değil): cevaba bırakıldığında kutu araştırma
 * boyunca dolu ve yüksek kalıyor, cevap gelince bir anda kısalıp sohbet alanını
 * sıçratıyordu.
 */

export interface ComposerSubmitPayload extends CreateQuestionInput {
  /** Kullanıcı balonunun altında gösterilecek bağlam metni (şirket · #etiket). */
  contextLabel: string;
}

export interface QuestionComposerProps {
  companies: CompanyListItem[];
  tags: Tag[];
  disabled?: boolean;
  onSubmit: (payload: ComposerSubmitPayload) => void;
  /** Kullanıcı yazmaya başladı — Dasi LISTENING durumuna geçer. */
  onTyping?: () => void;
  /**
   * Metni kutuya geri koyar ("tekrar dene"). `nonce` her tetiklemede değişir;
   * aynı metin ikinci kez gönderildiğinde de kutu yeniden dolsun.
   */
  refill?: { value: string; nonce: number } | null;
}

/** Çip görünümlü seçici tetiği; dolu durumda vurgulanır. */
function SelectorButton({
  icon,
  label,
  active,
  onClick,
  title
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  title?: string;
}): React.JSX.Element {
  const button = (
    <Button
      className={[
        'max-w-[210px] whitespace-nowrap rounded-md border px-3 py-2 text-sm normal-case',
        active ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border bg-surface text-fg'
      ].join(' ')}
      onClick={onClick}
      startIcon={icon}
    >
      <span className="overflow-hidden text-ellipsis">{label}</span>
    </Button>
  );

  return title ? <Tooltip title={title}>{button}</Tooltip> : button;
}

export function QuestionComposer({
  companies,
  tags,
  disabled,
  onSubmit,
  onTyping,
  refill
}: QuestionComposerProps): React.JSX.Element {
  const { t } = useTranslation();

  const [text, setText] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [privacyClass, setPrivacyClass] = useState<PrivacyClass>('genel');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  /**
   * Öneri isteklerinin nesil sayacı. Öneri getirme async olduğu için soru
   * gönderildikten SONRA dönen bir yanıt, gizlenmiş öneri satırını tekrar açıp
   * giriş kutusunu büyütüyordu. Nesil değiştiyse geç gelen yanıt yazılmaz.
   */
  const generation = useRef(0);

  const company = companies.find(entry => entry.id === companyId) ?? null;
  const canSubmit = Boolean(text.trim()) && !disabled;

  /* ── Etiket önerisi (FR-1) — motor servis katmanında, UI'da değil ── */
  useEffect(() => {
    const value = text.trim();
    if (value.length < 8) {
      setSuggestions([]);

      return;
    }

    const current = ++generation.current;
    const timer = setTimeout(() => {
      suggestTags({ text: value })
        .then(result => {
          if (current === generation.current) {
            setSuggestions(result);
          }
        })
        .catch(error => console.error('[knowledge] Etiket önerisi alınamadı.', error));
    }, 420);

    return () => clearTimeout(timer);
  }, [text]);

  /** "Tekrar dene": soru kutuya geri konur, kullanıcı gözden geçirip gönderir. */
  useEffect(() => {
    if (!refill) {
      return;
    }
    setText(refill.value);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [refill]);

  const toggleTag = useCallback((tag: Tag) => {
    setSelectedTags(current =>
      current.some(entry => entry.id === tag.id) ? current.filter(entry => entry.id !== tag.id) : [...current, tag]
    );
  }, []);

  const handleSubmit = () => {
    const value = text.trim();
    if (!value || disabled) {
      return;
    }

    const contextParts: string[] = [];
    if (company) {
      contextParts.push(company.name);
    }
    if (selectedTags.length) {
      contextParts.push(selectedTags.map(tag => `#${tag.name}`).join(' '));
    }

    onSubmit({
      contextLabel: contextParts.join(' · '),
      privacy_class: privacyClass,
      text: value,
      company_id: companyId,
      tag_id: selectedTags.map(tag => tag.id)
    });

    setText('');
    setSelectedTags([]);
    setSuggestions([]);
    generation.current++;
  };

  return (
    <div>
      <form
        className="rounded-composer border border-border bg-surface p-2 shadow-card"
        onSubmit={event => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <InputBase
          className="px-4 pb-2 pt-4 text-[15px] leading-relaxed md:text-base"
          fullWidth
          inputProps={{ 'aria-label': t('knowledge.dasi.inputLabel') }}
          inputRef={inputRef}
          maxRows={10}
          minRows={3}
          multiline
          onChange={event => {
            setText(event.target.value);
            if (event.target.value.trim()) {
              onTyping?.();
            }
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t('knowledge.dasi.placeholder')}
          value={text}
        />

        <div className="flex flex-wrap items-center gap-2.5 px-2.5 pb-2.5 pt-2">
          <Tooltip title={t('knowledge.dasi.privacyButton')}>
            <IconButton
              aria-label={t('knowledge.dasi.privacyButton')}
              className={[
                'rounded-md border',
                privacyClass === 'genel' ? 'border-border text-fg-muted' : 'border-primary text-primary'
              ].join(' ')}
              onClick={() => setPrivacyOpen(open => !open)}
            >
              <PlusIcon />
            </IconButton>
          </Tooltip>

          <SelectorButton
            active={Boolean(company)}
            icon={<BuildingsIcon />}
            label={company ? company.name : t('knowledge.dasi.companyPicker')}
            onClick={() => setCompanyOpen(true)}
          />

          <SelectorButton
            active={selectedTags.length > 0}
            icon={<TagIcon />}
            label={
              selectedTags.length
                ? t('knowledge.dasi.tagSelectedCount', { count: selectedTags.length })
                : t('knowledge.dasi.tagPicker')
            }
            onClick={() => setTagOpen(true)}
          />

          <IconButton
            aria-label={t('knowledge.dasi.send')}
            className="ml-auto h-[46px] w-[46px] rounded-xl bg-primary text-primary-contrast hover:bg-primary-dark disabled:bg-primary disabled:text-primary-contrast disabled:opacity-45"
            disabled={!canSubmit}
            type="submit"
          >
            <PaperPlaneRightIcon />
          </IconButton>
        </div>
      </form>

      {/* Etiket önerileri — question gönderilmeden önce, düzenlenebilir. */}
      <Collapse in={suggestions.length > 0}>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[13px] text-fg-muted">
            <SparkleIcon />
            {t('knowledge.dasi.tagSuggestions')}
          </span>
          {suggestions.map(tag => {
            const isSelected = selectedTags.some(entry => entry.id === tag.id);

            return (
              <Button
                className="rounded-md normal-case"
                key={tag.id}
                onClick={() => toggleTag(tag)}
                size="small"
                startIcon={isSelected ? <CheckIcon /> : <PlusIcon />}
                variant={isSelected ? 'contained' : 'outlined'}
              >
                {tag.name}
              </Button>
            );
          })}
          <span className="text-[13px] text-fg-muted">{t('knowledge.dasi.tagSuggestionsHint')}</span>
        </div>
      </Collapse>

      {/* Gizlilik sınıfı — 04-KVKK §3. Otomatik PII tespiti yok, sınıf elle seçilir. */}
      <Collapse in={privacyOpen}>
        <div className="mt-3 rounded-bubble border border-border bg-surface p-3.5">
          <p className="mb-2.5 text-[13px] text-fg-muted">{t('knowledge.privacy.panelHint')}</p>
          <div className="flex flex-wrap gap-2">
            {PRIVACY_CLASSES.map(option => (
              <Tooltip
                key={option.id}
                title={t(option.descriptionKey)}
              >
                <Button
                  className="rounded-md normal-case"
                  onClick={() => {
                    setPrivacyClass(option.id);
                    setPrivacyOpen(false);
                    toast(t('knowledge.privacy.selected', { name: t(option.labelKey) }));
                  }}
                  size="small"
                  variant={option.id === privacyClass ? 'contained' : 'outlined'}
                >
                  {t(option.labelKey)}
                </Button>
              </Tooltip>
            ))}
          </div>
        </div>
      </Collapse>

      <CompanyPickerDialog
        companies={companies}
        onClose={() => setCompanyOpen(false)}
        onSelect={setCompanyId}
        open={companyOpen}
        selectedId={companyId}
      />

      <TagPickerDialog
        onClose={() => setTagOpen(false)}
        onToggle={toggleTag}
        open={tagOpen}
        selected={selectedTags}
        tags={tags}
      />
    </div>
  );
}
