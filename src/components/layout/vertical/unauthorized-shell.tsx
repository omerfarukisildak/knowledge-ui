'use client';

import * as React from 'react';

import Box from '@mui/material/Box';

import { Unauthorized } from 'src/components/errors/unauthorized';

/**
 * Standalone chrome for users without module access — rendered outside the app
 * shell so no navigation is exposed.
 */
export function UnauthorizedShell(): React.JSX.Element {
  return (
    <Box
      sx={{
        bgcolor: 'var(--mui-palette-background-default)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      <Box
        component="main"
        sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}
      >
        <Unauthorized />
      </Box>
    </Box>
  );
}
