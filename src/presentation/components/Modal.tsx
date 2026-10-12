import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useIsPresent, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { XIcon } from '@phosphor-icons/react';
import { settle, leave } from '../motion/transitions';
interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  drawer?: boolean;
}
export function Modal({ title, onClose, children, drawer = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const dialog = ref.current!;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    // Keep the native focus trap and scroll lock alive until Motion finishes exit.
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);
  const offset = drawer
    ? { x: reduceMotion ? 0 : '100%', y: 0 }
    : { x: 0, y: reduceMotion ? 0 : 14 };
  return (
    <dialog
      ref={ref}
      className={`modal-host ${drawer ? 'drawer-host' : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (isPresent) onClose();
      }}
    >
      <m.div
        className="modal-scrim"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: leave }}
        transition={{ ...settle, duration: 0.26 }}
        onClick={() => {
          if (isPresent) onClose();
        }}
      />
      <m.div
        className={drawer ? 'modal drawer' : 'modal'}
        initial={{ ...offset, opacity: drawer && !reduceMotion ? 1 : 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={{
          ...offset,
          opacity: reduceMotion ? 0 : drawer ? 1 : 0,
          transition: leave,
        }}
        transition={{ ...settle, duration: drawer ? 0.38 : 0.26 }}
        inert={!isPresent}
      >
        <div className="modal-inner">
          <header className="modal-header">
            <h2 id={titleId}>{title}</h2>
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <XIcon size={22} />
            </button>
          </header>
          {children}
        </div>
      </m.div>
    </dialog>
  );
}
