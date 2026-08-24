'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { OverviewScreen } from 'src/modules/knowledge/components/overview/overview-screen';

function KnowledgeOverviewPage(): React.JSX.Element {
  return <OverviewScreen />;
}

export default withModulePermission(KnowledgeOverviewPage, 'knowledge');
