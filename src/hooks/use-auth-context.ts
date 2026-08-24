import { useContext } from 'react';

import { AuthContext, AuthContextType } from 'src/contexts/auth-context';

export const useAuthContext = <T = AuthContextType>() => useContext(AuthContext) as T;
