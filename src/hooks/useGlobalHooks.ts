import { useGlobalComponents } from '@src/PageWrapper';
import { useParams } from './useParams';

export const useGlobalHooks = () => {
  const params = useParams();
  const components = useGlobalComponents();

  return {
    params,
    components,
  };
};
