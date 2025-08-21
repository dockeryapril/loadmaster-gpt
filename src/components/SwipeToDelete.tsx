import { ReactNode, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface SwipeToDeleteProps {
  id: string;
  onDelete: (id: string) => void;
  children: ReactNode;
}

export function SwipeToDelete({ id, onDelete, children }: SwipeToDeleteProps) {
  const [swiped, setSwiped] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setSwiped(true);
      setTimeout(() => onDelete(id), 300);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <div {...handlers} className={swiped ? 'animate-swipe-left' : ''}>
      {children}
    </div>
  );
}
