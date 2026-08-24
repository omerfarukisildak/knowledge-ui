'use client';

import * as React from 'react';

import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';

import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { useTranslation } from 'react-i18next';

import { useAuthContext } from 'src/hooks/use-auth-context';

export function CustomSignOut(): React.JSX.Element {
  const { t } = useTranslation();
  const { signOut } = useAuthContext();

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    await signOut();
  }, [signOut]);

  return (
    <MenuItem
      component="div"
      onClick={handleSignOut}
      sx={{ justifyContent: 'left', gap: 1, color: 'var(--mui-palette-primary-main)' }}
    >
      <ListItemIcon>
        <SignOutIcon />
      </ListItemIcon>
      {t('signOut')}
    </MenuItem>
  );
}
