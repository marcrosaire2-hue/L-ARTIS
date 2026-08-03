import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filtres de recherche stockés dans l'URL : un résultat de recherche devient
 * partageable par lien, et le bouton retour du navigateur fonctionne.
 */
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    filters[key] = searchParams.get(key) ?? fallback;
  }
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  const update = useCallback(
    (changes, { resetPage = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value == null) next.delete(key);
            else next.set(key, String(value));
          }
          if (resetPage && !('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback((value) => update({ page: value }, { resetPage: false }), [update]);

  return { filters, page, update, setPage };
}
