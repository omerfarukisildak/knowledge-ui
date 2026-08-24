'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { NotesScreen } from 'src/modules/knowledge/components/notes/notes-screen';

function NotesPage(): React.JSX.Element {
  return <NotesScreen />;
}

export default withModulePermission(NotesPage, 'knowledge');
