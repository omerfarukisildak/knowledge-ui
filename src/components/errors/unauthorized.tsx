'use client';

import * as React from 'react';

import LockIcon from '@mui/icons-material/Lock';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import { useTranslation } from 'react-i18next';

export function Unauthorized(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Stack
          spacing={4}
          alignItems="center"
          textAlign="center"
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'error.lighter',
              color: 'error.main'
            }}
          >
            <LockIcon sx={{ fontSize: 60 }} />
          </Box>

          <Stack spacing={2}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700 }}
            >
              {t('unauthorized.title')}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}
            >
              {t('unauthorized.description')}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <Button
              variant="contained"
              size="large"
              href={process.env.NEXT_PUBLIC_GALLERY_URL}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {t('unauthorized.goToGallery')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
