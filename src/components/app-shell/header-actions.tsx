'use client';

import * as React from 'react';

import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import startCase from 'lodash.startcase';
import { useTranslation } from 'react-i18next';

import { LanguagePopover, languageFlags } from 'src/components/layout/language-popover';
import { UserPopover } from 'src/components/layout/user-popover/user-popover';
import { useAuthContext } from 'src/hooks/use-auth-context';
import { usePopover } from 'src/hooks/use-popover';
import type { Language } from 'src/i18n/config-lang';
import { nevada } from 'src/styles/theme/colors';

/** Right-hand side of the shell topbar. Add module context selectors here as they land. */
export function HeaderActions(): React.JSX.Element {
  return (
    <Stack
      direction="row"
      spacing={{ xs: 1, lg: 1.5 }}
      sx={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 0,
        width: '100%'
      }}
    >
      <LanguageSwitch />
      <UserButton />
    </Stack>
  );
}

function LanguageSwitch(): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const popover = usePopover<HTMLButtonElement>();
  const language = (i18n.language || 'tr') as Language;
  const flag = languageFlags[language];

  return (
    <React.Fragment>
      <Tooltip title={t('language')}>
        <IconButton
          onClick={popover.handleOpen}
          ref={popover.anchorRef}
        >
          <Box
            alt={language}
            component="img"
            src={flag}
            sx={{ height: '20px', width: '30px' }}
          />
        </IconButton>
      </Tooltip>
      <LanguagePopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </React.Fragment>
  );
}

function stringAvatar(name: string, size = 40) {
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length > 1 ? `${nameParts[0]?.[0] ?? ''}${nameParts[1]?.[0] ?? ''}` : `${nameParts[0]?.[0] ?? '?'}`;

  return {
    sx: {
      height: size,
      width: size,
      color: 'black',
      fontSize: size < 28 ? '11px' : '14px',
      fontWeight: 500,
      lineHeight: '20px',
      bgcolor: nevada[200],
      letterSpacing: 0.5
    },
    children: initials
  };
}

function UserButton(): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();
  const { token } = useAuthContext();
  const fullName = `${startCase(token?.first_name ?? '')} ${startCase(token?.last_name ?? '')}`;

  return (
    <React.Fragment>
      <Box
        component="button"
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        sx={{ border: 'none', background: 'transparent', cursor: 'pointer', p: 0 }}
      >
        <Badge
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          color="success"
          sx={{
            '& .MuiBadge-dot': {
              border: '2px solid #ffffff',
              borderRadius: '50%',
              bottom: '6px',
              height: '12px',
              right: '6px',
              width: '12px',
              marginTop: '4px'
            }
          }}
          variant="dot"
        >
          <Avatar {...stringAvatar(fullName)} />
        </Badge>
      </Box>
      <UserPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </React.Fragment>
  );
}
