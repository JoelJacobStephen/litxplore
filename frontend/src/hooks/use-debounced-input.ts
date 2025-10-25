import { useState, useCallback, useRef } from "react";

export function useDebouncedInput(
  onSubmit: (value: string) => void,
  debounceMs: number = 300
) {
  const [input, setInput] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      setInput(value);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        if (value.trim()) {
          onSubmit(value);
        }
      }, debounceMs);
    },
    [onSubmit, debounceMs]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (input.trim()) {
        onSubmit(input);
        setInput("");
      }
    },
    [input, onSubmit]
  );

  const clearInput = useCallback(() => {
    setInput("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    clearInput,
  };
}
