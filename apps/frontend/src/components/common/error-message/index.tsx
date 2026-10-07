const ErrorMessage = ({ message, onClose = () => {} }: ErrorMessageProps) => {
  return (
    <div className="toast toast-top toast-start">
      {message && (
        <div className="alert alert-error flex flex-row gap-1 max-md:py-2 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-auto w-6 max-md:w-4"
            fill="none"
            viewBox="0 0 24 24"
            onClick={onClose}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm max-md:text-xs">{message}</span>
        </div>
      )}
    </div>
  );
};

interface ErrorMessageProps {
  message?: string;
  onClose?: () => void;
}

export default ErrorMessage;
