import { useState, useEffect } from "react";

const useDebounce = <T,>({ value, delay }: UseDebounceProps<T>) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export interface UseDebounceProps<T> {
  value: T;
  delay: number;
}

export default useDebounce;
