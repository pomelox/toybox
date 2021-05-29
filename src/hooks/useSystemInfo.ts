import { useMemo } from 'react';
import { system } from '@wxlib';
import { SystemInfo } from '@lib/wxlib/system';

export const useSystemInfo = (): SystemInfo => {
  return useMemo(() => system.info, []);
};
