'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { PencilSimple as PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { KNOWLEDGE_LIVE_ENDPOINTS, createTag, deleteTag, getTags, updateTag } from 'src/modules/knowledge/api';
import { EmptyState } from 'src/modules/knowledge/components/common/empty-state';
import { SoftChip } from 'src/modules/knowledge/components/common/status-chip';
import { TagChip } from 'src/modules/knowledge/components/common/tag-chip';
import { TAG_CATEGORIES } from 'src/modules/knowledge/constants';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { Tag } from 'src/modules/knowledge/types';

import { TagEditDialog } from './tag-edit-dialog';

/**
 * Etiketler — tag taksonomisi yönetimi (FR-11).
 * Prototip karşılığı: `etiketler.html` + `js/pages/etiketler.js`.
 *
 * RACI: yönetim Bilgi Uzmanı Havuzu R/A, Admin C — ekran ikisine de açık.
 *
 * 09 §3 kullanımdaki etiketin pasife alınmasını, silinmemesini söylüyor ve mock
 * kaynakta ekran tam olarak bunu yapar. Canlı backend'de `status` alanı YOK
 * (`LabelResponseDto`: yalnızca `id` + `label`), dolayısıyla pasife alma
 * imkânsız ve tek yazma aksiyonu kalıcı silme. Bu yüzden aksiyon sütunu veri
 * kaynağına göre değişir: mock'ta aktif/pasif anahtarı, canlıda silme.
 */

const GRID = 'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto_auto] gap-4';

export function TagsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { hasRole, isFetched } = useKnowledgeRole();
  const { run } = useAsyncAction();

  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);
  /** Kullanımda olan etiketi pasife alırken uyarı — 09 §3. */
  const [pendingDeactivate, setPendingDeactivate] = useState<Tag | null>(null);
  /** Kalıcı silme onayı — yalnızca canlı kaynakta çıkar. */
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const canManage = hasRole('bilgi_uzmani', 'admin');

  /**
   * Hangi etiket çağrısı canlı backend'e gidiyor? Okuma ve yazma ayrı ayrı
   * açılabildiği için (`NEXT_PUBLIC_KNOWLEDGE_LIVE_ENDPOINTS`) ikisi ayrı
   * sorulur: yalnızca biri canlıysa ekranda eklenen etiket listede görünmez ve
   * bunu saklamak kullanıcıyı "kaydettim ama yok" hâlinde bırakırdı.
   */
  const isLive = useCallback(
    (name: string) => KNOWLEDGE_LIVE_ENDPOINTS.includes(name) || KNOWLEDGE_LIVE_ENDPOINTS.includes('*'),
    []
  );
  const readsLive = isLive('getTags');
  const writesLive = isLive('createTag');
  /** Okuma ve yazma farklı kaynaklara gidiyor: kayıt listeye düşmez. */
  const sourcesSplit = readsLive !== writesLive;

  const loadData = useCallback(async () => {
    setTags(await getTags());
  }, []);

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    let cancelled = false;

    loadData()
      .catch(error => {
        console.error('[knowledge] Etiketler yüklenemedi.', error);
        toast.error(t('knowledge.tags.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isFetched, loadData, t]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');

    return tags.filter(
      tag =>
        (!category || tag.category === category) &&
        (!status || tag.status === status) &&
        (!needle || tag.name.toLocaleLowerCase('tr-TR').includes(needle))
    );
  }, [category, search, status, tags]);

  const handleSave = useCallback(
    async (values: { name: string; category: string; status?: 'aktif' | 'pasif' }) => {
      setBusy(true);
      const result = editing
        ? await run(() => updateTag(editing.id, values), { message: t('knowledge.tags.edit.updateFailed') })
        : await run(() => createTag({ category: values.category, name: values.name }), {
            message: t('knowledge.tags.edit.createFailed')
          });
      setBusy(false);
      if (!result) {
        return;
      }
      toast.success(editing ? t('knowledge.tags.edit.updated') : t('knowledge.tags.edit.created'));
      setEditing(null);
      setCreating(false);
      await loadData().catch(() => undefined);
    },
    [editing, loadData, run, t]
  );

  const applyStatus = useCallback(
    async (tag: Tag, next: 'aktif' | 'pasif') => {
      setBusy(true);
      const result = await run(() => updateTag(tag.id, { status: next }), {
        message: t('knowledge.tags.statusFailed')
      });
      setBusy(false);
      if (!result) {
        return;
      }
      toast.success(t('knowledge.tags.statusChanged', { status: t(`knowledge.tags.status.${next}`) }));
      await loadData().catch(() => undefined);
    },
    [loadData, run, t]
  );

  const applyDelete = useCallback(
    async (tag: Tag) => {
      setBusy(true);
      const result = await run(() => deleteTag(tag.id), { message: t('knowledge.tags.deleteFailed') });
      setBusy(false);
      if (!result) {
        return;
      }
      toast.success(t('knowledge.tags.deleted', { name: tag.name }));
      await loadData().catch(() => undefined);
    },
    [loadData, run, t]
  );

  const handleToggle = useCallback(
    (tag: Tag) => {
      const next = tag.status === 'aktif' ? 'pasif' : 'aktif';
      // Kullanımda olan etiketi pasife almak geçmiş kayıtları etkiler: onay al.
      if (next === 'pasif' && (tag.usage ?? 0) > 0) {
        setPendingDeactivate(tag);

        return;
      }
      void applyStatus(tag, next);
    },
    [applyStatus]
  );

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-4 md:px-8 md:py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[240px] flex-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('knowledge.tags.title')}</h1>
          <p className="mt-1 max-w-[70ch] text-[13.5px] text-fg-muted">{t('knowledge.tags.subtitle')}</p>
        </div>
        {canManage ? (
          <Button
            className="normal-case"
            onClick={() => setCreating(true)}
            startIcon={<PlusIcon />}
            variant="contained"
          >
            {t('knowledge.tags.newTag')}
          </Button>
        ) : null}
      </header>

      {/*
        "Kullanımdaki etiket silinmez, pasife alınır" kuralı canlı sözleşmede
        uygulanamıyor (durum alanı yok): orada bu bilgi yanlış olurdu, yerini
        alttaki sözleşme uyarısı alıyor.
      */}
      {writesLive ? null : (
        <Alert
          className="mb-4"
          severity="info"
        >
          {t('knowledge.tags.taxonomyNotice')}
        </Alert>
      )}

      {/*
        Okuma ve yazma ayrı kaynaklara giderse eklenen etiket listeye düşmez;
        ikisi de canlıysa sözleşmenin tutmadığı alanları söylemek gerekiyor.
      */}
      {sourcesSplit ? (
        <Alert
          className="mb-4"
          severity="warning"
        >
          {t('knowledge.tags.liveSourceWarning')}
        </Alert>
      ) : writesLive ? (
        <Alert
          className="mb-4"
          severity="warning"
        >
          {t('knowledge.tags.liveContractNotice')}
        </Alert>
      ) : null}

      <section className="rounded-bubble border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassIcon />
                </InputAdornment>
              )
            }}
            className="min-w-[200px] flex-1"
            onChange={event => setSearch(event.target.value)}
            placeholder={t('knowledge.tags.search')}
            size="small"
            type="search"
            value={search}
          />
          <TextField
            className="min-w-[170px]"
            label={t('knowledge.tags.columns.category')}
            onChange={event => setCategory(event.target.value)}
            select
            size="small"
            value={category}
          >
            <MenuItem value="">{t('knowledge.tags.allCategories')}</MenuItem>
            {TAG_CATEGORIES.map(entry => (
              <MenuItem
                key={entry.id}
                value={entry.id}
              >
                {t(entry.labelKey)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            className="min-w-[150px]"
            label={t('knowledge.tags.columns.status')}
            onChange={event => setStatus(event.target.value)}
            select
            size="small"
            value={status}
          >
            <MenuItem value="">{t('knowledge.tags.allStatuses')}</MenuItem>
            <MenuItem value="aktif">{t('knowledge.tags.status.aktif')}</MenuItem>
            <MenuItem value="pasif">{t('knowledge.tags.status.pasif')}</MenuItem>
          </TextField>
          <span className="text-[13px] text-fg-muted">
            {t('knowledge.tags.filterSummary', { shown: filtered.length, total: tags.length })}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map(index => (
              <Skeleton
                height={44}
                key={index}
                variant="rounded"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('knowledge.tags.emptyTitle')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div
                className={`${GRID} border-b border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-fg-muted`}
                role="row"
              >
                <span>{t('knowledge.tags.columns.tag')}</span>
                <span>{t('knowledge.tags.columns.category')}</span>
                <span>{t('knowledge.tags.columns.status')}</span>
                <span className="text-right">{t('knowledge.tags.columns.usage')}</span>
                <span />
              </div>

              {filtered.map(tag => {
                const categoryEntry = TAG_CATEGORIES.find(entry => entry.id === tag.category);

                return (
                  <div
                    className={`${GRID} items-center border-b border-border px-4 py-2.5`}
                    key={tag.id}
                  >
                    <span className="min-w-0">
                      <TagChip
                        pool={tags}
                        tag={tag}
                      />
                    </span>

                    <span className="truncate text-[13px] text-fg-muted">
                      {/* Backend kategori döndürmüyor: uydurmak yerine tire. */}
                      {categoryEntry ? t(categoryEntry.labelKey) : tag.category || '—'}
                    </span>

                    <span>
                      <SoftChip
                        label={t(`knowledge.tags.status.${tag.status}`)}
                        tone={tag.status === 'aktif' ? 'success' : 'neutral'}
                      />
                    </span>

                    <span className="text-right text-[13px] tabular-nums">
                      {tag.usage === undefined ? <span className="text-fg-muted">—</span> : tag.usage}
                    </span>

                    <span className="flex items-center justify-end gap-0.5">
                      {canManage ? (
                        <>
                          <Tooltip title={t('knowledge.tags.editAction')}>
                            <IconButton
                              aria-label={t('knowledge.tags.editActionFor', { name: tag.name })}
                              disabled={busy}
                              onClick={() => setEditing(tag)}
                              size="small"
                            >
                              <PencilSimpleIcon size={15} />
                            </IconButton>
                          </Tooltip>
                          {/*
                            Canlı sözleşmede durum alanı olmadığı için aktif/pasif
                            anahtarı orada hiç gösterilmiyor: tıklandığında hata
                            veren bir düğme, olmayan bir yeteneği varmış gibi
                            gösterirdi. Yerine backend'in gerçekten desteklediği
                            aksiyon var — kalıcı silme.
                          */}
                          {writesLive ? (
                            <Tooltip title={t('knowledge.tags.deleteAction')}>
                              <IconButton
                                aria-label={t('knowledge.tags.deleteActionFor', { name: tag.name })}
                                disabled={busy}
                                onClick={() => setPendingDelete(tag)}
                                size="small"
                              >
                                <TrashIcon size={15} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              title={
                                tag.status === 'aktif' ? t('knowledge.tags.deactivate') : t('knowledge.tags.activate')
                              }
                            >
                              <IconButton
                                aria-label={
                                  tag.status === 'aktif'
                                    ? t('knowledge.tags.deactivateFor', { name: tag.name })
                                    : t('knowledge.tags.activateFor', { name: tag.name })
                                }
                                disabled={busy}
                                onClick={() => handleToggle(tag)}
                                size="small"
                              >
                                {tag.status === 'aktif' ? <EyeSlashIcon size={15} /> : <EyeIcon size={15} />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <TagEditDialog
        busy={busy}
        /*
          Canlı sözleşmede etiketin yalnızca adı var: kategori/durum alanları ve
          kebab-case önizlemesi (mock'a özgü normalizasyon) o modda gösterilmez.
        */
        nameOnly={writesLive}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSubmit={handleSave}
        open={creating || Boolean(editing)}
        tag={editing}
      />

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setPendingDeactivate(null)}
        open={Boolean(pendingDeactivate)}
      >
        <DialogTitle>{t('knowledge.tags.confirmDeactivate.title')}</DialogTitle>
        <DialogContent dividers>
          <p className="text-[13.5px] leading-relaxed">
            {t('knowledge.tags.confirmDeactivate.body', {
              count: pendingDeactivate?.usage ?? 0,
              name: pendingDeactivate?.name ?? ''
            })}
          </p>
        </DialogContent>
        <DialogActions>
          <Button
            className="normal-case"
            disabled={busy}
            onClick={() => setPendingDeactivate(null)}
          >
            {t('knowledge.tags.confirmDeactivate.cancel')}
          </Button>
          <Button
            className="normal-case"
            disabled={busy}
            onClick={() => {
              const target = pendingDeactivate;
              setPendingDeactivate(null);
              if (target) {
                void applyStatus(target, 'pasif');
              }
            }}
            variant="contained"
          >
            {t('knowledge.tags.confirmDeactivate.submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setPendingDelete(null)}
        open={Boolean(pendingDelete)}
      >
        <DialogTitle>{t('knowledge.tags.confirmDelete.title')}</DialogTitle>
        <DialogContent dividers>
          <p className="text-[13.5px] leading-relaxed">
            {/*
              Kullanım sayacı canlı kaynakta gelmiyor (backend saymıyor): kaç
              kaydı etkilediğini bilmediğimizi söylüyoruz, sıfır saymıyoruz.
            */}
            {pendingDelete?.usage === undefined
              ? t('knowledge.tags.confirmDelete.bodyUnknownUsage', { name: pendingDelete?.name ?? '' })
              : t('knowledge.tags.confirmDelete.body', {
                  count: pendingDelete.usage,
                  name: pendingDelete.name
                })}
          </p>
        </DialogContent>
        <DialogActions>
          <Button
            className="normal-case"
            disabled={busy}
            onClick={() => setPendingDelete(null)}
          >
            {t('knowledge.tags.confirmDelete.cancel')}
          </Button>
          <Button
            className="normal-case"
            color="error"
            disabled={busy}
            onClick={() => {
              const target = pendingDelete;
              setPendingDelete(null);
              if (target) {
                void applyDelete(target);
              }
            }}
            variant="contained"
          >
            {t('knowledge.tags.confirmDelete.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
