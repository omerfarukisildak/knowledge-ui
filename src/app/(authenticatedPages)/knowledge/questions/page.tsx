'use client';

import * as React from 'react';

import withModulePermission from 'src/hocs/with-module-permission';
import { QuestionsScreen } from 'src/modules/knowledge/components/questions/questions-screen';

function QuestionsPage(): React.JSX.Element {
  return <QuestionsScreen />;
}

export default withModulePermission(QuestionsPage, 'knowledge');
