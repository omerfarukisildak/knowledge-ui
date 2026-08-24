'use client';

import * as React from 'react';
import { useCallback, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

/**
 * Prototipin `metinSor()` yardımcısı: bir metin isteyip Promise olarak döndüren
 * diyalog. İptal edildiğinde `null` döner, çağıran akışı sessizce keser.
 */

export interface PromptOptions {
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
}

interface PromptState extends PromptOptions {
  open: boolean;
}

export function usePromptDialog(): {
  prompt: (options: PromptOptions) => Promise<string | null>;
  promptDialog: React.ReactNode;
} {
  const [state, setState] = useState<PromptState>({ open: false, title: '' });
  const [value, setValue] = useState('');
  const resolver = useRef<((result: string | null) => void) | null>(null);

  const close = useCallback((result: string | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(current => ({ ...current, open: false }));
    setValue('');
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    setValue('');
    setState({ ...options, open: true });

    return new Promise<string | null>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const promptDialog = (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={() => close(null)}
      open={state.open}
    >
      <DialogTitle>{state.title}</DialogTitle>
      <DialogContent>
        {state.description ? <p className="mb-4 text-sm text-fg-muted">{state.description}</p> : null}
        <TextField
          autoFocus
          fullWidth
          maxRows={8}
          minRows={state.multiline === false ? 1 : 3}
          multiline={state.multiline !== false}
          onChange={event => setValue(event.target.value)}
          placeholder={state.placeholder}
          value={value}
        />
      </DialogContent>
      <DialogActions>
        <Button
          className="normal-case"
          onClick={() => close(null)}
        >
          {state.cancelLabel ?? 'Vazgeç'}
        </Button>
        <Button
          className="normal-case"
          disabled={!value.trim()}
          onClick={() => close(value.trim())}
          variant="contained"
        >
          {state.confirmLabel ?? 'Gönder'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { prompt, promptDialog };
}
