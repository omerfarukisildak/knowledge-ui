'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { EscalationsScreen } from 'src/modules/knowledge/components/escalations/escalations-screen';

function EscalationsPage(): React.JSX.Element {
  return <EscalationsScreen />;
}

export default withModulePermission(EscalationsPage, 'knowledge');
