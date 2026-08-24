'use client';

import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import dayjs from 'dayjs';
import startCase from 'lodash.startcase';
import { useTranslation } from 'react-i18next';

import withModulePermission from 'src/hocs/with-module-permission';
import { useAuthContext } from 'src/hooks/use-auth-context';

function KnowledgeOverviewPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { token } = useAuthContext();

  const rows = [
    { label: t('knowledge.sessionUser'), value: `${startCase(token?.first_name)} ${startCase(token?.last_name)}` },
    { label: t('knowledge.sessionUserId'), value: token?.id ? String(token.id) : '-' },
    {
      label: t('knowledge.sessionExpiresAt'),
      value: token?.exp ? dayjs.unix(token.exp).format('DD.MM.YYYY HH:mm') : '-'
    }
  ];

  return (
    <Box sx={{ p: { xs: 3, lg: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">{t('knowledge.welcomeTitle')}</Typography>
          <Typography color="text.secondary">{t('knowledge.welcomeDescription')}</Typography>
        </Stack>
        <Card sx={{ maxWidth: 520 }}>
          <CardHeader title={t('knowledge.sessionTitle')} />
          <CardContent>
            <Stack spacing={1.5}>
              {rows.map(row => (
                <Stack
                  direction="row"
                  key={row.label}
                  spacing={2}
                  sx={{ justifyContent: 'space-between' }}
                >
                  <Typography color="text.secondary">{row.label}</Typography>
                  <Typography sx={{ fontWeight: 500 }}>{row.value}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default withModulePermission(KnowledgeOverviewPage, 'knowledge');
