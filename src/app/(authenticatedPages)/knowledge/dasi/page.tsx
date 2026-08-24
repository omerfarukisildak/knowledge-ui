'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { DasiScreen } from 'src/modules/knowledge/components/dasi/dasi-screen';

function DasiPage(): React.JSX.Element {
  return <DasiScreen />;
}

export default withModulePermission(DasiPage, 'knowledge');
