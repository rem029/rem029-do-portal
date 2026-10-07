import { useEffect, useState } from "react";

export interface useDebounceProps<T> {
  value: T;
  delay?: number;
}

const useDebounce = <T>({ value, delay = 500 }: useDebounceProps<T>) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
