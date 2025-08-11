import { useEffect } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(',');

export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  onEscape?: () => void
) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const focusable = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const previousActive = document.activeElement as HTMLElement | null;

    (first || node).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    node.addEventListener('keydown', handleKeyDown);

    return () => {
      node.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [ref, onEscape]);
}
