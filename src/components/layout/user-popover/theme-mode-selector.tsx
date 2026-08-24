'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { useColorScheme } from '@mui/material/styles';

import { Devices as DevicesIcon } from '@phosphor-icons/react/dist/ssr/Devices';
import { Moon as MoonIcon } from '@phosphor-icons/react/dist/ssr/Moon';
import { Sun as SunIcon } from '@phosphor-icons/react/dist/ssr/Sun';
import { useTranslation } from 'react-i18next';

const themeOptions = [
  { label: 'themeMode.light', value: 'light', icon: SunIcon },
  { label: 'themeMode.dark', value: 'dark', icon: MoonIcon },
  { label: 'themeMode.system', value: 'system', icon: DevicesIcon }
] as const;

export function ThemeModeSelector(): React.JSX.Element {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
  };

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ justifyContent: 'center' }}
    >
      {themeOptions.map(option => {
        const Icon = option.icon;
        const isSelected = mounted && mode === option.value;

        return (
          <ButtonBase
            aria-label={t(option.label)}
            key={option.value}
            onClick={() => handleThemeChange(option.value)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              bgcolor: isSelected ? 'primary.main' : 'transparent',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: isSelected ? 'primary.dark' : 'text.secondary',
                bgcolor: isSelected ? 'primary.dark' : 'action.hover'
              }
            }}
          >
            <Icon
              size={20}
              weight="regular"
              style={{
                color: isSelected ? 'white' : 'var(--mui-palette-text-secondary)'
              }}
            />
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
