import { useContactSchemas as useContactSchemaContext } from '@/contexts/ContactSchemaContext';

/**
 * @deprecated This hook is deprecated. Please use `useContactSchemas` from `@/contexts/ContactSchemaContext` instead.
 */
export const useContactSchemas = () => {
  return useContactSchemaContext();
};