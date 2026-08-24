'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { ReportedScreen } from 'src/modules/knowledge/components/reported/reported-screen';

function ReportedPage(): React.JSX.Element {
  return <ReportedScreen />;
}

export default withModulePermission(ReportedPage, 'knowledge');
