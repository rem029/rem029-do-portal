const WaiverFormContainer = ({
  children,
  className,
}: LaserOasisWaiverDefaultProps) => {
  return (
    <div className={`w-full flex flex-col gap-4 ${className || ""}`}>{children}</div>
  );
};

interface LaserOasisWaiverDefaultProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export default WaiverFormContainer;
