'use client';

import * as React from 'react';
import { useState } from 'react';

import Drawer from '@mui/material/Drawer';

import { KnowledgeSidebar } from './knowledge-sidebar';
import { KnowledgeTopbar } from './knowledge-topbar';

/**
 * Uygulama kabuğu — prototipin `.ds-uygulama` düzeninin karşılığı: solda sabit
 * koyu sidebar, üstte sabit çubuk, ortada içerik.
 *
 * Daha önce `@datassist/ui-shell-next` paketinin `AppShellLayout`'u kullanılıyordu.
 * Kullanıcı kararıyla prototipin kendi kabuğuna geçildi: paket kabuğu açık zeminli
 * ve farklı bir yapıdaydı, referans tasarımı CSS ile ezmeye çalışmak hem kırılgandı
 * hem de paket güncellendiğinde bozulacaktı.
 *
 * Zemin ayrımı bilinçli: içerik alanı açık temada hafif gri (`background.level1`),
 * kartlar beyaz (`background.paper`) — böylece kartlar zeminden ayrışıyor. Koyu
 * temada sıra tersine döner, o yüzden zemin `background.default`'a düşüyor.
 */
export interface KnowledgeShellProps {
  children: React.ReactNode;
}

export function KnowledgeShell({ children }: KnowledgeShellProps): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-1 dark:bg-canvas">
      <KnowledgeTopbar onMenuClick={() => setMobileOpen(true)} />

      {/* Masaüstü: sabit panel, sayfa kaydırılırken yerinden oynamaz. */}
      <div className="fixed left-0 top-0 z-50 hidden h-screen lg:block">
        <KnowledgeSidebar />
      </div>

      {/* Mobil: aynı panel çekmece içinde; bağlantıya tıklanınca kapanır. */}
      <Drawer
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        slotProps={{ paper: { className: 'border-0' } }}
        sx={{ display: { lg: 'none' } }}
      >
        <KnowledgeSidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <main className="pt-topbar lg:pl-sidebar">{children}</main>
    </div>
  );
}
