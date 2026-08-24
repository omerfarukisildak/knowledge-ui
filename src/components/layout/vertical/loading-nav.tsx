'use client';

import * as React from 'react';

import Link from 'next/link';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { LOGO_SHELL_SIDEBAR_BOX, Logo } from 'src/components/logo';
import { config } from 'src/config';
import { paths } from 'src/paths';

export interface LoadingNavProps {
  /**
   * `full` — standalone chrome when shell providers are not mounted yet.
   * `embedded` — spinner only for Next.js `loading.tsx` inside the real shell main (avoids double sidebar/header).
   */
  variant?: 'full' | 'embedded';
}

export function LoadingNav({ variant = 'full' }: LoadingNavProps): React.JSX.Element {
  if (variant === 'embedded') {
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: '1 1 auto',
          justifyContent: 'center',
          minHeight: 0,
          width: '100%'
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      className="loading-nav-full"
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      <Box
        className="loading-nav-sidebar"
        sx={{
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          p: '18px 14px 16px',
          width: 260
        }}
      >
        {/* Mirror `@datassist/ui-shell-next` `.sidebar__top`: logo link flexes; badge is a sibling (stable alignment). */}
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: '8px',
            marginBottom: '18px',
            minHeight: 44,
            paddingRight: '8px'
          }}
        >
          <Box
            component={Link}
            href={paths.knowledge}
            sx={{
              color: 'inherit',
              display: 'block',
              flex: '1 1 auto',
              lineHeight: 0,
              minWidth: 0,
              textDecoration: 'none'
            }}
          >
            <Box
              component="span"
              sx={{ display: 'block' }}
            >
              <Logo {...LOGO_SHELL_SIDEBAR_BOX} />
            </Box>
          </Box>
          <Box
            aria-hidden
            component="span"
            sx={{
              alignSelf: 'center',
              backgroundColor: 'primary.main',
              borderRadius: '6px',
              color: 'primary.contrastText',
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.03em',
              lineHeight: 1.2,
              px: '10px',
              py: '6px'
            }}
          >
            {config.site.shortName}
          </Box>
        </Box>
      </Box>
      <Box
        className="loading-nav-content"
        sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', minWidth: 0 }}
      >
        <Box
          component="header"
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            minHeight: 72
          }}
        />
        <Box
          component="main"
          sx={{
            alignItems: 'center',
            display: 'flex',
            flex: '1 1 auto',
            justifyContent: 'center',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <CircularProgress size={48} />
        </Box>
        <Box
          component="footer"
          sx={{
            bgcolor: 'background.level1',
            borderTop: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            minHeight: 42
          }}
        />
      </Box>
    </Box>
  );
}
