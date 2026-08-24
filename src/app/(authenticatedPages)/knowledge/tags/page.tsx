'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { TagsScreen } from 'src/modules/knowledge/components/tags/tags-screen';

function TagsPage(): React.JSX.Element {
  return <TagsScreen />;
}

export default withModulePermission(TagsPage, 'knowledge');
