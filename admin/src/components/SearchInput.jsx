import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui';
import { useDebouncedValue } from '../lib/useListParams';

/**
 * Champ de recherche à état local, propagé après un court délai.
 * `value` reste la source de vérité (URL) : une navigation arrière réaligne
 * le champ.
 */
export default function SearchInput({ value, onChange, placeholder = 'Rechercher…' }) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text);
  const lastSent = useRef(value);

  useEffect(() => {
    setText(value);
    lastSent.current = value;
  }, [value]);

  useEffect(() => {
    if (debounced === lastSent.current) return;
    lastSent.current = debounced;
    onChange(debounced);
  }, [debounced, onChange]);

  return (
    <div className="relative min-w-0 w-full flex-1 sm:max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  );
}
