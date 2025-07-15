// src/hooks/useClickOutside.ts
import { useEffect, RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;

/**
 * A custom hook that triggers a callback when a click is detected outside of a specified element.
 * ✅ DEFINITIVE FIX: The generic type <T> is now correctly constrained to Node.
 * This allows the hook to accept a RefObject for any DOM node (like HTMLDivElement)
 * and correctly understands that ref.current can be T | null.
 */
export function useClickOutside<T extends Node>(
  ref: RefObject<T>,
  handler: (event: AnyEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      // The logic here is robust. It checks if the ref exists and if the click
      // was inside the element it points to.
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}