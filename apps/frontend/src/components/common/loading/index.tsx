const Loading = ({
  className = "w-full h-full flex flex-col items-center justify-center",
}: LoadingProps) => {
  return (
    <div className={className}>
      <span className="loading loading-spinner loading-lg bg-info"></span>
    </div>
  );
};

interface LoadingProps {
  className?: string;
}

export default Loading;
