'use client';

import * as React from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';

import startCase from 'lodash.startcase';

import { CustomSignOut } from 'src/components/layout/user-popover/custom-sign-out';
import { ThemeModeSelector } from 'src/components/layout/user-popover/theme-mode-selector';
import { useAuthContext } from 'src/hooks/use-auth-context';

export interface UserPopoverProps {
  anchorEl: null | Element;
  onClose?: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { token } = useAuthContext();

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      onClose={onClose}
      open={Boolean(open)}
      slotProps={{ paper: { sx: { width: '240px' } } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <ThemeModeSelector />
        </Box>
        <Typography>{`${startCase(token?.first_name)} ${startCase(token?.last_name)}`}</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 1 }}>
        <CustomSignOut />
      </Box>
    </Popover>
  );
}
