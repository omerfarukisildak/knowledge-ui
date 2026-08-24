'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { BulletinScreen } from 'src/modules/knowledge/components/bulletin/bulletin-screen';

function BulletinPage(): React.JSX.Element {
  return <BulletinScreen />;
}

export default withModulePermission(BulletinPage, 'knowledge');
