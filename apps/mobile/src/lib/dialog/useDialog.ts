import { useMemo } from 'react';
import { dialog } from './dialogStore';

export function useDialog() {
  return useMemo(() => dialog, []);
}

