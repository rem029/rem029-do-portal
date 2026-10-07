import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClick?: () => void;
  children?: React.ReactNode | JSX.Element;
}

const Modal = ({ isOpen, children, onClick }: ModalProps) => {
  return (
    <div
      className={clsx(
        "z-10 absolute top-0 left-0 w-screen h-screen bg-gray-950 bg-opacity-0 transition-all duration-300  flex items-center justify-center",
        !isOpen
          ? "bg-opacity-0 pointer-events-none"
          : "bg-opacity-50 pointer-events-auto",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClick) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
};

export default Modal;
