const WaiverListContainer = ({ children }: LaserOasisWaiverDefaultProps) => {
  return <div className="w-full flex flex-col gap-4">{children}</div>;
};

interface LaserOasisWaiverDefaultProps {
  children: JSX.Element | JSX.Element[];
}

export default WaiverListContainer;
