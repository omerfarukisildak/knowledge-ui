'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { CompaniesScreen } from 'src/modules/knowledge/components/companies/companies-screen';

function CompaniesPage(): React.JSX.Element {
  return <CompaniesScreen />;
}

export default withModulePermission(CompaniesPage, 'knowledge');
