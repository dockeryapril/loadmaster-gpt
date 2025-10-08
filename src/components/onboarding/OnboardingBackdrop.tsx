import { createPortal } from 'react-dom';

interface OnboardingBackdropProps {
  targetElement: HTMLElement;
}

export function OnboardingBackdrop({ targetElement }: OnboardingBackdropProps) {
  const rect = targetElement.getBoundingClientRect();
  
  // Create a backdrop with a cut-out for the highlighted element
  const clipPath = `polygon(
    0% 0%, 
    0% 100%, 
    100% 100%, 
    100% 0%, 
    0% 0%,
    0% ${rect.top - 8}px,
    ${rect.left - 8}px ${rect.top - 8}px,
    ${rect.left - 8}px ${rect.bottom + 8}px,
    ${rect.right + 8}px ${rect.bottom + 8}px,
    ${rect.right + 8}px ${rect.top - 8}px,
    ${rect.left - 8}px ${rect.top - 8}px,
    0% ${rect.top - 8}px
  )`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9997] bg-black/40 pointer-events-none transition-opacity duration-300"
      style={{ clipPath }}
    />,
    document.body
  );
}
