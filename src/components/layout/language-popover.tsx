'use client';

import * as React from 'react';

import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { useTranslation } from 'react-i18next';

import { toast } from 'src/components/toaster';
import { LANGUAGE_STORAGE_KEY, type Language, allLangs } from 'src/i18n/config-lang';

export const languageFlags = allLangs.reduce<Record<Language, string>>(
  (flags, lang) => ({ ...flags, [lang.value]: lang.icon }),
  {} as Record<Language, string>
);

export interface LanguagePopoverProps {
  anchorEl: null | Element;
  onClose?: () => void;
  open?: boolean;
}

export function LanguagePopover({ anchorEl, onClose, open = false }: LanguagePopoverProps): React.JSX.Element {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = React.useCallback(
    async (language: Language): Promise<void> => {
      onClose?.();

      try {
        await i18n.changeLanguage(language);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        toast.success(t('languageChanged'));
      } catch {
        toast.error(t('languageChangeFailed'));
      }
    },
    [i18n, onClose, t]
  );

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '180px' } } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    >
      {allLangs.map(option => (
        <MenuItem
          key={option.value}
          onClick={() => {
            handleLanguageChange(option.value).catch(() => {});
          }}
        >
          <ListItemIcon>
            <Box
              alt={option.label}
              component="img"
              src={option.icon}
              sx={{ width: '30px', height: '20px' }}
            />
          </ListItemIcon>
          <Typography variant="subtitle2">{option.label}</Typography>
        </MenuItem>
      ))}
    </Menu>
  );
}
