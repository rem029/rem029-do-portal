import { useEffect, useRef, ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

const Modal = ({ isOpen, onClose, children, title, className = "" }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    if (isOpen) {
      dialogElement.showModal();
      document.body.classList.add("overflow-hidden"); // Prevent background scrolling
    } else {
      dialogElement.close();
      document.body.classList.remove("overflow-hidden");
    }

    // Handle click outside to close
    const handleOutsideClick = (event: MouseEvent) => {
      const rect = dialogElement.getBoundingClientRect();
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    };

    if (isOpen) {
      dialogElement.addEventListener("click", handleOutsideClick);
    }

    return () => {
      dialogElement?.removeEventListener("click", handleOutsideClick);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={`
         border-none rounded-lg box-border w-full max-w-md bg-white shadow-lg
        [&::backdrop]:bg-black [&::backdrop]:bg-opacity-50
        ${className}
      `}
      aria-labelledby={title ? "modal-title" : undefined}
      aria-modal="true"
    >
      <div className="p-0 flex flex-col gap-2">
        {title && (
          <div className="flex justify-between items-center p-4">
            <h2 id="modal-title" className="text-xl">
              {title}
            </h2>
            <button
              type="button"
              className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-800"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
};

export default Modal;
