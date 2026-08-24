'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { ArticlesScreen } from 'src/modules/knowledge/components/articles/articles-screen';

function ArticlesPage(): React.JSX.Element {
  return <ArticlesScreen />;
}

export default withModulePermission(ArticlesPage, 'knowledge');
