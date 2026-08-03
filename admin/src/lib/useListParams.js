import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filtres de liste stockés dans l'URL : un lien comme
 * `/artisans?status=pending` est partageable, et le retour arrière du
 * navigateur restaure l'état de la table.
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
          // Changer un filtre en gardant la page 7 afficherait un tableau vide
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

/** Évite une requête à chaque frappe dans un champ de recherche. */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
