import { useContext } from 'react';

import { ModuleContext, ModuleContextType } from 'src/contexts/module-context';

export const useModuleContext = <T = ModuleContextType>() => useContext(ModuleContext) as T;
